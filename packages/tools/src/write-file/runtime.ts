import { tool } from "ai";
import { writeFileInputSchema, writeFileOutputSchema } from "./schema.js";

export const writeFileTool = tool({
	description:
		"Write complete UTF-8 file contents in the local workspace. Requires user approval.",
	inputSchema: writeFileInputSchema,
	outputSchema: writeFileOutputSchema,
});
