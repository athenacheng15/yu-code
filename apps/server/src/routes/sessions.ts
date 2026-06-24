import { zValidator } from "@hono/zod-validator";
import {
	createSessionRequestSchema,
	chatTools,
	type ChatMessage,
	sessionParamsSchema,
	type CreateSessionResponse,
	type SessionMessagesResponse,
} from "@yu-code/shared";
import { safeValidateUIMessages } from "ai";
import { Hono } from "hono";
import {
	createSession,
	loadSession,
	toUIMessageCandidate,
} from "../services/session-store";

export const sessionRoutes = new Hono()
	.post(
		"/sessions",
		zValidator("json", createSessionRequestSchema, (result, c) => {
			if (!result.success) {
				return c.json(
					{ error: result.error.issues[0]?.message ?? "Invalid session request" },
					400,
				);
			}
		}),
		async (c) => {
			const { prompt } = c.req.valid("json");
			const session = await createSession(prompt);

			return c.json(
				{
					id: session.id,
				} satisfies CreateSessionResponse,
				201,
			);
		},
	)
	.get(
		"/sessions/:id/messages",
		zValidator("param", sessionParamsSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const session = await loadSession(id);

			if (!session) {
				return c.json({ error: "Session not found" }, 404);
			}

			const candidates = session.messages.map(toUIMessageCandidate);
			const validation =
				candidates.length === 0
					? { success: true as const, data: [] }
					: await safeValidateUIMessages<ChatMessage>({
							messages: candidates,
							tools: chatTools,
						});

			if (!validation.success) {
				return c.json({ error: "Stored session messages are invalid" }, 500);
			}

			return c.json({
				messages: validation.data,
			} satisfies SessionMessagesResponse);
		},
	);
