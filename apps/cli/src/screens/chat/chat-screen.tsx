import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router";
import { z } from "zod";
import { ChatShell } from "../../components/chat/chat-shell";
import { client } from "../../lib/client";

const chatLocationStateSchema = z.object({
	prompt: z.string(),
});

const chatApi = client.chat.$url().toString();

export function ChatScreen() {
	const location = useLocation();
	const state = chatLocationStateSchema.safeParse(location.state);
	const prompt = state.success ? state.data.prompt : "";
	const submittedPromptRef = useRef<string | null>(null);
	const transport = useMemo(() => {
		return new DefaultChatTransport({
			api: chatApi,
		});
	}, []);
	const { messages, sendMessage, error, status } = useChat({
		transport,
	});
	const isLoading = status === "submitted" || status === "streaming";

	useEffect(() => {
		if (!prompt || submittedPromptRef.current === prompt) return;

		submittedPromptRef.current = prompt;
		void sendMessage({ text: prompt });
	}, [prompt, sendMessage]);

	function submitMessage(text: string) {
		void sendMessage({ text });
	}

	return (
		<ChatShell
			messages={messages}
			isLoading={isLoading}
			error={error}
			onSubmit={submitMessage}
		/>
	);
}
