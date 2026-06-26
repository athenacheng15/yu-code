import { z } from "zod";

export const writeFileInputSchema = z.object({
	path: z.string().trim().min(1).describe("A relative file path to write."),
	content: z.string().describe("The complete replacement file contents."),
	reason: z
		.string()
		.trim()
		.min(1)
		.optional()
		.describe("A short explanation of why this write is needed."),
});

export const writeFileOutputSchema = z.object({
	path: z.string().describe("Path relative to the workspace root."),
	bytesWritten: z.number().int().nonnegative(),
});

export type WriteFileInput = z.infer<typeof writeFileInputSchema>;
export type WriteFileOutput = z.infer<typeof writeFileOutputSchema>;
