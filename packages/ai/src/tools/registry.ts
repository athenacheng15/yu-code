import type { z } from "zod";
import { editFile } from "./edit-file/runtime.js";
import {
	editFileInputSchema,
	editFileOutputSchema,
} from "./edit-file/schema.js";
import { defineCodingTool } from "./define-tool.js";
import { grepFiles } from "./grep/runtime.js";
import {
	grepFilesInputSchema,
	grepFilesOutputSchema,
} from "./grep/schema.js";
import { listFiles } from "./list-files/runtime.js";
import {
	listFilesInputSchema,
	listFilesOutputSchema,
} from "./list-files/schema.js";
import { readFile } from "./read-file/runtime.js";
import {
	readFileInputSchema,
	readFileOutputSchema,
} from "./read-file/schema.js";
import { writeFile } from "./write-file/runtime.js";
import {
	writeFileInputSchema,
	writeFileOutputSchema,
} from "./write-file/schema.js";

export const toolRegistry = {
	listFiles: defineCodingTool({
		description:
			"List files and directories under a relative path in the local workspace.",
		inputSchema: listFilesInputSchema,
		outputSchema: listFilesOutputSchema,
		approval: {
			mode: "automatic",
		},
		run: listFiles,
	}),
	readFile: defineCodingTool({
		description: "Read a UTF-8 text file from the local workspace.",
		inputSchema: readFileInputSchema,
		outputSchema: readFileOutputSchema,
		approval: {
			mode: "automatic",
		},
		run: readFile,
	}),
	writeFile: defineCodingTool({
		description:
			"Write complete UTF-8 file contents in the local workspace. Requires user approval.",
		inputSchema: writeFileInputSchema,
		outputSchema: writeFileOutputSchema,
		approval: {
			mode: "approval",
			getDisplay: (input) => ({
				path: input.path,
				reason: input.reason,
				input,
			}),
		},
		run: writeFile,
	}),
	editFile: defineCodingTool({
		description:
			"Replace exact text in a UTF-8 file in the local workspace. Requires user approval.",
		inputSchema: editFileInputSchema,
		outputSchema: editFileOutputSchema,
		approval: {
			mode: "approval",
			getDisplay: (input) => ({
				path: input.path,
				reason: input.reason,
				input,
			}),
		},
		run: editFile,
	}),
	grepFiles: defineCodingTool({
		description:
			"Search UTF-8 text files in the local workspace by text or JavaScript regular expression.",
		inputSchema: grepFilesInputSchema,
		outputSchema: grepFilesOutputSchema,
		approval: {
			mode: "automatic",
		},
		run: grepFiles,
	}),
};

export type CodingToolRegistry = typeof toolRegistry;
export type CodingToolName = keyof CodingToolRegistry & string;

export const chatTools = {
	listFiles: toolRegistry.listFiles.tool,
	readFile: toolRegistry.readFile.tool,
	writeFile: toolRegistry.writeFile.tool,
	editFile: toolRegistry.editFile.tool,
	grepFiles: toolRegistry.grepFiles.tool,
} satisfies {
	[Name in CodingToolName]: CodingToolRegistry[Name]["tool"];
};

export const toolRunners = {
	listFiles: toolRegistry.listFiles.run,
	readFile: toolRegistry.readFile.run,
	writeFile: toolRegistry.writeFile.run,
	editFile: toolRegistry.editFile.run,
	grepFiles: toolRegistry.grepFiles.run,
} satisfies {
	[Name in CodingToolName]: CodingToolRegistry[Name]["run"];
};

export type CodingToolInput<Name extends CodingToolName> = z.infer<
	CodingToolRegistry[Name]["inputSchema"]
>;

export type CodingToolOutput<Name extends CodingToolName> = z.infer<
	CodingToolRegistry[Name]["outputSchema"]
>;

export type ApprovalToolName = {
	[Name in CodingToolName]: CodingToolRegistry[Name]["approval"]["mode"] extends "approval"
		? Name
		: never;
}[CodingToolName];

export type PendingToolApproval = {
	[Name in ApprovalToolName]: {
		toolName: Name;
		toolCallId: string;
		input: CodingToolInput<Name>;
	};
}[ApprovalToolName];

export type ToolApprovalDisplay = {
	toolName: ApprovalToolName;
	path: string;
	reason?: string;
};

export function isCodingToolName(toolName: string): toolName is CodingToolName {
	return toolName in toolRegistry;
}

export function getToolEntry<Name extends CodingToolName>(
	toolName: Name,
): CodingToolRegistry[Name] {
	return toolRegistry[toolName];
}

export function parseToolInput<Name extends CodingToolName>(
	toolName: Name,
	input: unknown,
): CodingToolInput<Name> {
	return getToolEntry(toolName).inputSchema.parse(input) as CodingToolInput<Name>;
}

export function createPendingToolApproval<Name extends CodingToolName>({
	toolName,
	toolCallId,
	input,
}: {
	toolName: Name;
	toolCallId: string;
	input: CodingToolInput<Name>;
}): PendingToolApproval | undefined {
	const entry = getToolEntry(toolName);

	if (entry.approval.mode !== "approval") {
		return undefined;
	}

	return {
		toolName,
		toolCallId,
		input,
	} as PendingToolApproval;
}

export function getToolApprovalDisplay(
	approval: PendingToolApproval,
): ToolApprovalDisplay {
	const entry = toolRegistry[approval.toolName];
	const display = entry.approval.getDisplay(approval.input as never);
	return {
		toolName: approval.toolName,
		path: display.path,
		reason: display.reason,
	};
}

export async function runCodingTool<Name extends CodingToolName>(
	toolName: Name,
	input: CodingToolInput<Name>,
): Promise<CodingToolOutput<Name>> {
	const entry = getToolEntry(toolName);
	const output = await entry.run(input as never);
	return entry.outputSchema.parse(output) as CodingToolOutput<Name>;
}

export function createToolOutputPayload<Name extends CodingToolName>({
	toolName,
	toolCallId,
	output,
}: {
	toolName: Name;
	toolCallId: string;
	output: CodingToolOutput<Name>;
}) {
	return {
		tool: toolName,
		toolCallId,
		output,
	};
}

export function createToolErrorPayload({
	toolName,
	toolCallId,
	errorText,
}: {
	toolName: CodingToolName;
	toolCallId: string;
	errorText: string;
}) {
	return {
		tool: toolName,
		toolCallId,
		state: "output-error" as const,
		errorText,
	};
}
