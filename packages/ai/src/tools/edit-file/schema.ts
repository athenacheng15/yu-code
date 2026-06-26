import { z } from "zod";

export const editFileInputSchema = z.object({
	path: z.string().trim().min(1).describe("A relative file path to edit."),
	search: z.string().min(1).describe("The exact text to replace."),
	replacement: z.string().describe("The replacement text."),
	reason: z
		.string()
		.trim()
		.min(1)
		.optional()
		.describe("A short explanation of why this edit is needed."),
});

export const editFileOutputSchema = z.object({
	path: z.string().describe("Path relative to the workspace root."),
	replacements: z.number().int().positive(),
	bytesWritten: z.number().int().nonnegative(),
});

export type EditFileInput = z.infer<typeof editFileInputSchema>;
export type EditFileOutput = z.infer<typeof editFileOutputSchema>;
