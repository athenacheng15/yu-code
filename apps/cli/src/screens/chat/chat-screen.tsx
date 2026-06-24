import { useChat } from "@ai-sdk/react";
import { sessionIdSchema, type ChatMessage } from "@yu-code/shared";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router";
import { z } from "zod";
import { ChatShell } from "../../components/chat/chat-shell";
import { client, loadSessionMessages } from "../../lib/client";

const chatLocationStateSchema = z.object({
	prompt: z.string(),
});

export function ChatScreen() {
	const location = useLocation();
	const params = useParams<{ id: string }>();
	const sessionId = sessionIdSchema.parse(params.id);
	const state = chatLocationStateSchema.safeParse(location.state);
	const prompt = state.success ? state.data.prompt : "";
	const submittedPromptRef = useRef<string | null>(null);
	const [isHydrated, setIsHydrated] = useState(false);
	const [loadError, setLoadError] = useState<Error>();
	const transport = useMemo(() => {
		return new DefaultChatTransport<ChatMessage>({
			api: client.chat[":sessionId"].$url({
				param: { sessionId },
			}).toString(),
			prepareSendMessagesRequest: ({ messages }) => ({
				body: {
					message: messages.at(-1),
				},
			}),
		});
	}, [sessionId]);
	const { messages, setMessages, sendMessage, error, status } =
		useChat<ChatMessage>({
			id: sessionId,
			transport,
		});
	const isLoading =
		!isHydrated || status === "submitted" || status === "streaming";

	useEffect(() => {
		let cancelled = false;
		setIsHydrated(false);
		setLoadError(undefined);
		submittedPromptRef.current = null;

		async function loadMessages() {
			try {
				const data = await loadSessionMessages(sessionId);

				if (!cancelled) {
					setMessages(data.messages);
					setIsHydrated(true);
				}
			} catch (cause) {
				if (!cancelled) {
					setLoadError(
						cause instanceof Error ? cause : new Error("Could not load session"),
					);
				}
			}
		}

		void loadMessages();

		return () => {
			cancelled = true;
		};
	}, [sessionId, setMessages]);

	useEffect(() => {
		if (
			!isHydrated ||
			!prompt ||
			submittedPromptRef.current === prompt ||
			messages.length > 0
		) {
			return;
		}

		submittedPromptRef.current = prompt;
		void sendMessage({ text: prompt });
	}, [isHydrated, messages.length, prompt, sendMessage]);

	function submitMessage(text: string) {
		void sendMessage({ text });
	}

	return (
		<ChatShell
			messages={messages}
			isLoading={isLoading}
			error={loadError ?? error}
			onSubmit={submitMessage}
		/>
	);
}
