import { Hono } from "hono";
import { anthropic } from "@ai-sdk/anthropic";
import { zValidator } from "@hono/zod-validator";
import { streamText } from "ai";
import { z } from "zod";
import { createWelcomeMessage, productName } from "@yu-code/shared";

export const app = new Hono();

const llmRequestSchema = z.object({
	prompt: z.string().trim().min(1),
});

const routes = app
	.get("/", (c) => {
		return c.json({
			name: productName,
			message: createWelcomeMessage("server"),
		});
	})
	.get("/health", (c) => {
		return c.json({
			ok: true,
			timestamp: new Date().toISOString(),
		});
	})
	.post("/llm", zValidator("json", llmRequestSchema), (c) => {
		const { prompt } = c.req.valid("json");

		const result = streamText({
			model: anthropic(Bun.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"),
			prompt,
		});

		return result.toTextStreamResponse();
	});

export type AppType = typeof routes;
