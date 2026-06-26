import { anthropic } from "@ai-sdk/anthropic";
import {
	stepCountIs,
	ToolLoopAgent,
} from "ai";
import { systemInstructions } from "./instructions.js";
import { chatTools } from "./tools/registry.js";

export {
	type CodingAgentMessage as CodingAgentUIMessage,
	validateCodingMessages,
} from "./messages.js";
export { chatTools } from "./tools/registry.js";

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
