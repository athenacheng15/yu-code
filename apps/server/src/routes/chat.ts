import { anthropic } from "@ai-sdk/anthropic";
import { zValidator } from "@hono/zod-validator";
import {
	chatParamsSchema,
	chatTools,
	createMessageRequestSchema,
	type ChatMessage,
} from "@yu-code/shared";
import {
	convertToModelMessages,
	createIdGenerator,
	safeValidateUIMessages,
	stepCountIs,
	streamText,
} from "ai";
import { Hono } from "hono";
import { z } from "zod";
import {
	appendMessage,
	DuplicateMessageError,
	loadSession,
	SessionNotFoundError,
	toUIMessageCandidate,
} from "../services/session-store";

const createMessageSchema = createMessageRequestSchema.transform(
	async ({ message }, ctx) => {
		const validation = await safeValidateUIMessages<ChatMessage>({
			messages: [message],
			tools: chatTools,
		});

		if (!validation.success) {
			ctx.addIssue({
				code: "custom",
				message: validation.error.message,
			});
			return z.NEVER;
		}

		const userMessage = validation.data[0];
		if (!userMessage || userMessage.role !== "user") {
			ctx.addIssue({
				code: "custom",
				message: "The latest message must have the user role",
			});
			return z.NEVER;
		}

		return { message: userMessage };
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
		const { message } = c.req.valid("json");
		const session = await loadSession(sessionId);

		if (!session) {
			return c.json({ error: "Session not found" }, 404);
		}

		const storedMessageCandidates = session.messages.map(toUIMessageCandidate);
		const storedValidation =
			storedMessageCandidates.length === 0
				? { success: true as const, data: [] }
				: await safeValidateUIMessages<ChatMessage>({
						messages: storedMessageCandidates,
						tools: chatTools,
					});

		if (!storedValidation.success) {
			return c.json({ error: "Stored session messages are invalid" }, 500);
		}

		try {
			await appendMessage(sessionId, message);
		} catch (error) {
			if (error instanceof SessionNotFoundError) {
				return c.json({ error: error.message }, 404);
			}
			if (error instanceof DuplicateMessageError) {
				return c.json({ error: error.message }, 409);
			}
			throw error;
		}

		const messages = [...storedValidation.data, message];
		const result = streamText({
			model: anthropic(Bun.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"),
			system:
				"When the user asks for a chat rendering demo, call inspectPrompt once before answering. If they ask for a tool error demo, call failDemo. If they ask for an approval demo, call approvalDemo. Keep the final answer short.",
			messages: await convertToModelMessages(messages, { tools: chatTools }),
			maxOutputTokens: 2048,
			providerOptions: {
				anthropic: {
					thinking: {
						type: "enabled",
						budgetTokens: 1024,
					},
				},
			},
			tools: chatTools,
			stopWhen: stepCountIs(2),
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

				await appendMessage(sessionId, responseMessage);
			},
		});
	},
);
