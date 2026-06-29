import { anthropic } from "@ai-sdk/anthropic";
import {
	stepCountIs,
	ToolLoopAgent,
} from "ai";
import { z } from "zod";
import { systemInstructions } from "./instructions.js";
import { codingModelId } from "./model-config.js";
import {
	defaultModeId,
	getMode,
	modeSchema,
} from "./modes.js";
import { chatTools } from "./tools/registry.js";

export {
	type CodingAgentMessage as CodingAgentUIMessage,
	validateCodingMessages,
} from "./messages.js";
export { chatTools } from "./tools/registry.js";
export {
	defaultModeId,
	getMode,
	getNextModeId,
	isToolAllowedInMode,
	modeSchema,
	modes,
	type ModeId,
} from "./modes.js";

const callOptionsSchema = z.object({
	mode: modeSchema,
});

export const codingAgent = new ToolLoopAgent({
	id: "yu-code-coding-agent",
	model: anthropic(codingModelId),
	callOptionsSchema,
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
	prepareCall: ({ options, ...settings }) => {
		const mode = getMode(options?.mode ?? defaultModeId);

		return {
			...settings,
			instructions: `${settings.instructions ?? ""}\n\n${mode.instructions}`,
			activeTools: [...mode.toolNames],
		};
	},
	stopWhen: stepCountIs(6),
});
