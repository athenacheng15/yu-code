import { useCompletion } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { z } from "zod";
import { client } from "../../lib/client";

const chatLocationStateSchema = z.object({
	prompt: z.string(),
});

const llmApi = client.llm.$url().toString();

export function ChatScreen() {
	const location = useLocation();
	const state = chatLocationStateSchema.safeParse(location.state);
	const prompt = state.success ? state.data.prompt : "";
	const submittedPromptRef = useRef<string | null>(null);
	const { completion, complete, error, isLoading } = useCompletion({
		api: llmApi,
		streamProtocol: "text",
	});

	useEffect(() => {
		if (!prompt || submittedPromptRef.current === prompt) return;

		submittedPromptRef.current = prompt;
		void complete(prompt);
	}, [complete, prompt]);

	return (
		<box flexDirection="column" gap={1}>
			<text fg="#09ff00">{prompt}</text>
			{isLoading ? <text fg="#6b7280">Thinking...</text> : null}
			{error ? <text fg="#ff5c57">{error.message}</text> : null}
			{completion ? <text>{completion}</text> : null}
		</box>
	);
}
