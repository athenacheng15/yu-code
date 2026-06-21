import { anthropic } from "@ai-sdk/anthropic";
import { zValidator } from "@hono/zod-validator";
import {
	convertToModelMessages,
	safeValidateUIMessages,
	stepCountIs,
	streamText,
	tool,
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
			system:
				"When the user asks for a chat rendering demo, call inspectPrompt once before answering. If they ask for a tool error demo, call failDemo. If they ask for an approval demo, call approvalDemo. Keep the final answer short.",
			messages: await convertToModelMessages(messages),
			maxOutputTokens: 2048,
			providerOptions: {
				anthropic: {
					thinking: {
						type: "enabled",
						budgetTokens: 1024,
					},
				},
			},
			tools: {
				inspectPrompt: tool({
					description:
						"Inspect a short user request so the UI can render a tool call.",
					inputSchema: z.object({
						request: z.string().describe("The user request to inspect."),
					}),
					execute: async ({ request }) => ({
						characterCount: request.length,
						containsDemo: request.toLowerCase().includes("demo"),
					}),
				}),
				failDemo: tool({
					description:
						"Intentionally fail so the UI can render a tool output error state.",
					inputSchema: z.object({
						reason: z.string().describe("Why the demo should fail."),
					}),
					execute: async ({
						reason,
					}): Promise<{ failed: true; reason: string }> => {
						throw new Error(`Demo tool failure: ${reason}`);
					},
				}),
				approvalDemo: tool({
					description:
						"Request approval so the UI can render a tool approval state.",
					needsApproval: true,
					inputSchema: z.object({
						action: z.string().describe("The demo action requiring approval."),
					}),
					execute: async ({ action }) => ({ approvedAction: action }),
				}),
			},
			stopWhen: stepCountIs(2),
		});

		return result.toUIMessageStreamResponse({
			originalMessages: messages,
			sendReasoning: true,
		});
	},
);
