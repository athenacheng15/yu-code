import { anthropic } from "@ai-sdk/anthropic";
import { zValidator } from "@hono/zod-validator";
import {
	convertToModelMessages,
	safeValidateUIMessages,
	streamText,
} from "ai";
import { Hono } from "hono";
import { z } from "zod";

const chatRequestSchema = z.object({
	messages: z.unknown().transform(async (messages, ctx) => {
		const validation = await safeValidateUIMessages({ messages });

		if (!validation.success) {
			ctx.addIssue({
				code: "custom",
				message: validation.error.message,
			});

			return z.NEVER;
		}

		return validation.data;
	}),
});

export const chatRoutes = new Hono().post(
	"/chat",
	zValidator("json", chatRequestSchema, (result, c) => {
		if (!result.success) {
			return c.json(
				{ error: result.error.issues[0]?.message ?? "Invalid chat request" },
				400,
			);
		}
	}),
	async (c) => {
		const { messages } = c.req.valid("json");
		const result = streamText({
			model: anthropic(Bun.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"),
			messages: await convertToModelMessages(messages),
		});

		return result.toUIMessageStreamResponse({
			originalMessages: messages,
		});
	},
);
