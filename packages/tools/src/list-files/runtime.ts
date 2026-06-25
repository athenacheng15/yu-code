import { tool } from "ai";
import { listFilesInputSchema, listFilesOutputSchema } from "./schema.js";

export const listFilesTool = tool({
	description:
		"List files and directories under a relative path in the local workspace.",
	inputSchema: listFilesInputSchema,
	outputSchema: listFilesOutputSchema,
});
