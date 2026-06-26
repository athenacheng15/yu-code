import { z } from "zod";

export const listFilesInputSchema = z.object({
	path: z
		.string()
		.trim()
		.min(1)
		.optional()
		.describe("A relative directory path to list. Defaults to the workspace root."),
	maxDepth: z
		.number()
		.int()
		.min(1)
		.max(5)
		.optional()
		.describe("Maximum directory depth to include, from 1 to 5."),
});

export const fileEntrySchema = z.object({
	path: z.string().describe("Path relative to the workspace root."),
	type: z.enum(["file", "directory"]).describe("Filesystem entry type."),
});

export const listFilesOutputSchema = z.object({
	root: z.string().describe("The listed path relative to the workspace root."),
	entries: z.array(fileEntrySchema),
});

export type ListFilesInput = z.infer<typeof listFilesInputSchema>;
export type ListFilesOutput = z.infer<typeof listFilesOutputSchema>;
