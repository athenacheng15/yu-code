import { tool } from "ai";
import { readFileInputSchema, readFileOutputSchema } from "./schema.js";

export const readFileTool = tool({
	description: "Read a UTF-8 text file from the local workspace.",
	inputSchema: readFileInputSchema,
	outputSchema: readFileOutputSchema,
});
