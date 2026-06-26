import { anthropic } from "@ai-sdk/anthropic";
import {
	safeValidateUIMessages,
	stepCountIs,
	tool,
	ToolLoopAgent,
	type InferAgentUIMessage,
} from "ai";
import { systemInstructions } from "./instructions.js";
import {
	editFileInputSchema,
	editFileOutputSchema,
	grepFilesInputSchema,
	grepFilesOutputSchema,
	listFilesInputSchema,
	listFilesOutputSchema,
	readFileInputSchema,
	readFileOutputSchema,
	writeFileInputSchema,
	writeFileOutputSchema,
} from "./index.js";

export const chatTools = {
	listFiles: tool({
		description:
			"List files and directories under a relative path in the local workspace.",
		inputSchema: listFilesInputSchema,
		outputSchema: listFilesOutputSchema,
	}),
	readFile: tool({
		description: "Read a UTF-8 text file from the local workspace.",
		inputSchema: readFileInputSchema,
		outputSchema: readFileOutputSchema,
	}),
	writeFile: tool({
		description:
			"Write complete UTF-8 file contents in the local workspace. Requires user approval.",
		inputSchema: writeFileInputSchema,
		outputSchema: writeFileOutputSchema,
	}),
	editFile: tool({
		description:
			"Replace exact text in a UTF-8 file in the local workspace. Requires user approval.",
		inputSchema: editFileInputSchema,
		outputSchema: editFileOutputSchema,
	}),
	grepFiles: tool({
		description:
			"Search UTF-8 text files in the local workspace by text or JavaScript regular expression.",
		inputSchema: grepFilesInputSchema,
		outputSchema: grepFilesOutputSchema,
	}),
};

export const codingAgent = new ToolLoopAgent({
	id: "yu-code-coding-agent",
	model: anthropic(Bun.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"),
	instructions: systemInstructions,
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
	stopWhen: stepCountIs(6),
});

export type CodingAgentUIMessage = InferAgentUIMessage<typeof codingAgent>;

export async function validateCodingMessages(messages: unknown[]) {
	return safeValidateUIMessages<CodingAgentUIMessage>({
		messages,
		tools: chatTools,
	});
}
