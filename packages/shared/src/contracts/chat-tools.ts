import {
	type InferUITools,
	type UIDataTypes,
	type UIMessage,
	tool,
} from "ai";
import { z } from "zod";

export const chatTools = {
	inspectPrompt: tool({
		description: "Inspect a short user request so the UI can render a tool call.",
		inputSchema: z.object({
			request: z.string().describe("The user request to inspect."),
		}),
		execute: async ({ request }) => ({
			characterCount: request.length,
			containsDemo: request.toLowerCase().includes("demo"),
		}),
	}),
	failDemo: tool({
		description: "Intentionally fail so the UI can render a tool output error state.",
		inputSchema: z.object({
			reason: z.string().describe("Why the demo should fail."),
		}),
		execute: async ({ reason }): Promise<{ failed: true; reason: string }> => {
			throw new Error(`Demo tool failure: ${reason}`);
		},
	}),
	approvalDemo: tool({
		description: "Request approval so the UI can render a tool approval state.",
		needsApproval: true,
		inputSchema: z.object({
			action: z.string().describe("The demo action requiring approval."),
		}),
		execute: async ({ action }) => ({ approvedAction: action }),
	}),
};

export type ChatMessage = UIMessage<
	unknown,
	UIDataTypes,
	InferUITools<typeof chatTools>
>;
