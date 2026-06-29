import { ChatMode } from "@yu-code/database";
import { z } from "zod";
import { type CodingToolName } from "./tools/registry.js";

const buildToolNames = [
	"listFiles",
	"readFile",
	"writeFile",
	"editFile",
	"grepFiles",
] as const satisfies readonly CodingToolName[];

const planToolNames = [
	"listFiles",
	"readFile",
	"grepFiles",
] as const satisfies readonly CodingToolName[];

export const modeSchema = z.enum(ChatMode);

export type ModeId = z.infer<typeof modeSchema>;

export type ModeDefinition = {
	id: ModeId;
	label: string;
	description: string;
	instructions: string;
	toolNames: readonly CodingToolName[];
};

export const modes = [
	{
		id: ChatMode.build,
		label: "Build",
		description: "Implement changes with approval-gated filesystem writes.",
		instructions:
			"You are in build mode. You may inspect the workspace and implement requested changes. Use writeFile or editFile only when a file change is needed and the requested change is clear.",
		toolNames: buildToolNames,
	},
	{
		id: ChatMode.plan,
		label: "Plan",
		description: "Read-only planning mode for safe inspection and implementation plans.",
		instructions:
			"You are in plan mode. Treat this as read-only safe mode. Inspect files as needed, but do not write or edit files. Produce a concrete implementation plan instead of making changes.",
		toolNames: planToolNames,
	},
] as const satisfies readonly ModeDefinition[];

export const defaultModeId: ModeId = ChatMode.build;

export function getMode(modeId: ModeId): ModeDefinition {
	return modes.find((mode) => mode.id === modeId) ?? modes[0];
}

export function getNextModeId(modeId: ModeId): ModeId {
	const currentIndex = modes.findIndex((mode) => mode.id === modeId);
	const nextIndex = (Math.max(currentIndex, 0) + 1) % modes.length;
	return modes[nextIndex]?.id ?? defaultModeId;
}

export function isToolAllowedInMode(
	toolName: CodingToolName,
	modeId: ModeId,
): boolean {
	return getMode(modeId).toolNames.includes(toolName);
}
