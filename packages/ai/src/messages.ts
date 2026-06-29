import {
	safeValidateUIMessages,
	type InferUITools,
	type UIDataTypes,
	type UIMessage,
} from "ai";
import type { ModeId } from "./modes.js";
import { chatTools } from "./tools/registry.js";

export type CodingMessageMetadata = {
	mode?: ModeId;
};

export type CodingAgentMessage = UIMessage<
	CodingMessageMetadata,
	UIDataTypes,
	InferUITools<typeof chatTools>
>;

export async function validateCodingMessages(messages: unknown[]) {
	return safeValidateUIMessages<CodingAgentMessage>({
		messages,
		tools: chatTools,
	});
}
