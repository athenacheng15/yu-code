import { z } from "zod";

export const grepFilesInputSchema = z.object({
	query: z.string().trim().min(1).describe("Text or regular expression to search for."),
	path: z
		.string()
		.trim()
		.min(1)
		.optional()
		.describe("A relative file or directory path to search. Defaults to the workspace root."),
	maxResults: z
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.describe("Maximum matches to return, from 1 to 100."),
	regex: z.boolean().optional().describe("Treat query as a JavaScript regular expression."),
});

export const grepMatchSchema = z.object({
	path: z.string().describe("Path relative to the workspace root."),
	line: z.number().int().positive().describe("One-based line number."),
	text: z.string().describe("The matching line."),
});

export const grepFilesOutputSchema = z.object({
	matches: z.array(grepMatchSchema),
	truncated: z.boolean().describe("Whether additional matches were omitted."),
});

export type GrepFilesInput = z.infer<typeof grepFilesInputSchema>;
export type GrepFilesOutput = z.infer<typeof grepFilesOutputSchema>;
