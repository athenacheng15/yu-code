import type { InferUITools, UIDataTypes, UIMessage } from "ai";
import { listFilesTool } from "./list-files/runtime.js";
import { readFileTool } from "./read-file/runtime.js";
import { writeFileTool } from "./write-file/runtime.js";

export * from "./list-files/schema.js";
export * from "./list-files/runtime.js";
export * from "./read-file/schema.js";
export * from "./read-file/runtime.js";
export * from "./write-file/schema.js";
export * from "./write-file/runtime.js";

export const chatTools = {
	listFiles: listFilesTool,
	readFile: readFileTool,
	writeFile: writeFileTool,
};

export type ChatMessage = UIMessage<
	unknown,
	UIDataTypes,
	InferUITools<typeof chatTools>
>;
