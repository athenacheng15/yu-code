import { hc } from "hono/client";
import type { AppType } from "@yu-code/server/app";
import {
	chatTools,
	sessionMessagesResponseEnvelopeSchema,
	type ChatMessage,
	type SessionMessagesResponse,
} from "@yu-code/shared";
import { safeValidateUIMessages } from "ai";

const serverUrl = Bun.env.SERVER_URL ?? "http://localhost:3000";

export const client = hc<AppType>(serverUrl);

export async function loadSessionMessages(
	sessionId: string,
): Promise<SessionMessagesResponse> {
	const url = client.sessions[":id"].messages.$url({ param: { id: sessionId } });
	const response = await fetch(url);
	const body: unknown = await response.json();

	if (!response.ok) {
		const error =
			typeof body === "object" &&
			body !== null &&
			"error" in body &&
			typeof body.error === "string"
				? body.error
				: "Could not load session";
		throw new Error(error);
	}

	const envelope = sessionMessagesResponseEnvelopeSchema.parse(body);
	const validation =
		envelope.messages.length === 0
			? { success: true as const, data: [] }
			: await safeValidateUIMessages<ChatMessage>({
					messages: envelope.messages,
					tools: chatTools,
				});

	if (!validation.success) {
		throw new Error("Session contains invalid messages");
	}

	return {
		...envelope,
		messages: validation.data,
	};
}
