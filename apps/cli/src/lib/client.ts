import {
	createSessionResponseEnvelopeSchema,
	sessionMessagesResponseEnvelopeSchema,
	type CreateSessionResponse,
} from "@yu-code/shared";
import { chatTools, type ChatMessage } from "@yu-code/tools";
import { safeValidateUIMessages } from "ai";

const serverUrl = Bun.env.SERVER_URL ?? "http://localhost:3000";

function createUrl(path: string) {
	return new URL(path, serverUrl).toString();
}

async function readError(response: Response, fallback: string) {
	let body: unknown;
	try {
		body = await response.json();
	} catch {
		return fallback;
	}

	return typeof body === "object" &&
		body !== null &&
		"error" in body &&
		typeof body.error === "string"
		? body.error
		: fallback;
}

export function createChatUrl(sessionId: string) {
	return createUrl(`/chat/${encodeURIComponent(sessionId)}`);
}

export async function createSession(
	prompt: string,
): Promise<CreateSessionResponse> {
	const response = await fetch(createUrl("/sessions"), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ prompt }),
	});

	if (!response.ok) {
		throw new Error(await readError(response, "Could not create session"));
	}

	const body: unknown = await response.json();
	return createSessionResponseEnvelopeSchema.parse(body);
}

export async function loadSessionMessages(
	sessionId: string,
): Promise<{ messages: ChatMessage[] }> {
	const response = await fetch(
		createUrl(`/sessions/${encodeURIComponent(sessionId)}/messages`),
	);

	if (!response.ok) {
		throw new Error(await readError(response, "Could not load session"));
	}

	const body: unknown = await response.json();
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
