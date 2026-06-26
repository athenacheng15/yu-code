import { tool, type Tool } from "ai";
import type { z } from "zod";

type ToolSchema = z.ZodType;

type ApprovalDisplay<Input> = {
	path: string;
	reason?: string;
	input: Input;
};

type AutomaticToolConfig<InputSchema extends ToolSchema, OutputSchema extends ToolSchema> = {
	description: string;
	inputSchema: InputSchema;
	outputSchema: OutputSchema;
	approval: {
		mode: "automatic";
	};
	run: (input: z.infer<InputSchema>) => Promise<z.infer<OutputSchema>>;
};

type ApprovalToolConfig<InputSchema extends ToolSchema, OutputSchema extends ToolSchema> = {
	description: string;
	inputSchema: InputSchema;
	outputSchema: OutputSchema;
	approval: {
		mode: "approval";
		getDisplay: (input: z.infer<InputSchema>) => ApprovalDisplay<z.infer<InputSchema>>;
	};
	run: (input: z.infer<InputSchema>) => Promise<z.infer<OutputSchema>>;
};

type CodingToolConfig<
	InputSchema extends ToolSchema,
	OutputSchema extends ToolSchema,
> =
	| AutomaticToolConfig<InputSchema, OutputSchema>
	| ApprovalToolConfig<InputSchema, OutputSchema>;

type CodingToolEntry<InputSchema extends ToolSchema, OutputSchema extends ToolSchema> = {
	tool: Tool<z.infer<InputSchema>, z.infer<OutputSchema>>;
};

export function defineCodingTool<
	InputSchema extends ToolSchema,
	OutputSchema extends ToolSchema,
>(
	config: AutomaticToolConfig<InputSchema, OutputSchema>,
): AutomaticToolConfig<InputSchema, OutputSchema> &
	CodingToolEntry<InputSchema, OutputSchema>;
export function defineCodingTool<
	InputSchema extends ToolSchema,
	OutputSchema extends ToolSchema,
>(
	config: ApprovalToolConfig<InputSchema, OutputSchema>,
): ApprovalToolConfig<InputSchema, OutputSchema> &
	CodingToolEntry<InputSchema, OutputSchema>;
export function defineCodingTool<InputSchema extends ToolSchema, OutputSchema extends ToolSchema>(
	config: CodingToolConfig<InputSchema, OutputSchema>,
) {
	return {
		...config,
		tool: tool({
			description: config.description,
			inputSchema: config.inputSchema,
			outputSchema: config.outputSchema,
		}) as Tool<z.infer<InputSchema>, z.infer<OutputSchema>>,
	};
}
