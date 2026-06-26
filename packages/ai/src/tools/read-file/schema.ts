import { z } from "zod";

export const readFileInputSchema = z.object({
	path: z.string().trim().min(1).describe("A relative file path to read."),
});

export const readFileOutputSchema = z.object({
	path: z.string().describe("Path relative to the workspace root."),
	content: z.string().describe("The complete file contents."),
});

export type ReadFileInput = z.infer<typeof readFileInputSchema>;
export type ReadFileOutput = z.infer<typeof readFileOutputSchema>;
