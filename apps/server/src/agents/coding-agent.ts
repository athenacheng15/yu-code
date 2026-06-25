import { anthropic } from "@ai-sdk/anthropic";
import { chatTools } from "@yu-code/tools";
import { stepCountIs, ToolLoopAgent } from "ai";

export const codingAgent = new ToolLoopAgent({
	id: "yu-code-coding-agent",
	model: anthropic(Bun.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"),
	instructions:
		"You are yu-code, a concise coding agent. Use filesystem tools to inspect files before making claims about local code. Prefer small, focused changes. When editing, read the relevant files first, call writeFile only with complete replacement contents, and treat tool errors as real constraints. The server cannot access files; only the CLI tools can.",
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
