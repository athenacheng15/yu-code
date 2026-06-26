import {
	safeValidateUIMessages,
	type InferUITools,
	type UIDataTypes,
	type UIMessage,
} from "ai";
import { chatTools } from "./tools/registry.js";

export type CodingAgentMessage = UIMessage<
	unknown,
	UIDataTypes,
	InferUITools<typeof chatTools>
>;

export async function validateCodingMessages(messages: unknown[]) {
	return safeValidateUIMessages<CodingAgentMessage>({
		messages,
		tools: chatTools,
	});
}
