import { zValidator } from "@hono/zod-validator";
import {
	chatParamsSchema,
	createMessageRequestSchema,
} from "@yu-code/shared";
import {
	chatTools,
	codingAgent,
	modeSchema,
	type CodingAgentUIMessage as ChatMessage,
	validateCodingMessages,
} from "@yu-code/ai/server";
import {
	convertToModelMessages,
	createIdGenerator,
} from "ai";
import { Hono } from "hono";
import { z } from "zod";
import {
	appendMessage,
	DuplicateMessageError,
	loadSession,
	SessionNotFoundError,
	toUIMessageCandidate,
	upsertMessage,
} from "../services/session-store";

const createMessageSchema = createMessageRequestSchema.transform(
	async ({ message: candidateMessage, mode: candidateMode }, ctx) => {
		const modeResult = modeSchema.safeParse(candidateMode);
		if (!modeResult.success) {
			ctx.addIssue({
				code: "custom",
				message: "Invalid chat mode",
			});
			return z.NEVER;
		}

		const validation = await validateCodingMessages([candidateMessage]);

		if (!validation.success) {
			ctx.addIssue({
				code: "custom",
				message: validation.error.message,
			});
			return z.NEVER;
		}

		const validatedMessage = validation.data[0] as ChatMessage | undefined;
		if (
			!validatedMessage ||
			(validatedMessage.role !== "user" && validatedMessage.role !== "assistant")
		) {
			ctx.addIssue({
				code: "custom",
				message: "The latest message must have the user or assistant role",
			});
			return z.NEVER;
		}

		return { message: validatedMessage, mode: modeResult.data };
	},
);

const generateAssistantMessageId = createIdGenerator({
	prefix: "msg",
	size: 24,
});

export const chatRoutes = new Hono().post(
	"/chat/:sessionId",
	zValidator("param", chatParamsSchema),
	zValidator("json", createMessageSchema, (result, c) => {
		if (!result.success) {
			return c.json(
				{ error: result.error.issues[0]?.message ?? "Invalid chat request" },
				400,
			);
		}
	}),
	async (c) => {
		const { sessionId } = c.req.valid("param");
		const { message, mode } = c.req.valid("json");
		const session = await loadSession(sessionId);

		if (!session) {
			return c.json({ error: "Session not found" }, 404);
		}

		const storedMessageCandidates = session.messages.map(toUIMessageCandidate);
		const storedValidation =
			storedMessageCandidates.length === 0
				? { success: true as const, data: [] }
				: await validateCodingMessages(storedMessageCandidates);

		if (!storedValidation.success) {
			return c.json({ error: "Stored session messages are invalid" }, 500);
		}

		try {
			if (message.role === "assistant") {
				await upsertMessage(sessionId, message);
			} else {
				await appendMessage(sessionId, message);
			}
		} catch (error) {
			if (error instanceof SessionNotFoundError) {
				return c.json({ error: error.message }, 404);
			}
			if (error instanceof DuplicateMessageError) {
				return c.json({ error: error.message }, 409);
			}
			throw error;
		}

		const messages = mergeLatestMessage(storedValidation.data, message);
		const result = await codingAgent.stream({
			prompt: await convertToModelMessages(messages, { tools: chatTools }),
			options: { mode },
		});

		void result.consumeStream();

		return result.toUIMessageStreamResponse({
			originalMessages: messages,
			generateMessageId: generateAssistantMessageId,
			sendReasoning: true,
			onFinish: async ({ responseMessage, isAborted, finishReason }) => {
				if (isAborted || finishReason === "error" || finishReason === undefined) {
					return;
				}

				await upsertMessage(sessionId, responseMessage);
			},
		});
	},
);

function mergeLatestMessage(messages: ChatMessage[], message: ChatMessage) {
	const existingIndex = messages.findIndex((candidate) => candidate.id === message.id);

	if (existingIndex === -1) {
		return [...messages, message];
	}

	return messages.map((candidate, index) =>
		index === existingIndex ? message : candidate,
	);
}
