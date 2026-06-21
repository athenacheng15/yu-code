import type { TextareaRenderable } from "@opentui/core";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router";
import { z } from "zod";
import { client } from "../../lib/client";

const chatLocationStateSchema = z.object({
	prompt: z.string(),
});

const promptSubmitSchema = z.object({
	prompt: z.string().trim().min(1),
});

const chatApi = client.chat.$url().toString();
const speakerWidth = 8;

function getMessageText(message: UIMessage) {
	return message.parts
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("");
}

export function ChatScreen() {
	const location = useLocation();
	const state = chatLocationStateSchema.safeParse(location.state);
	const prompt = state.success ? state.data.prompt : "";
	const submittedPromptRef = useRef<string | null>(null);
	const textareaRef = useRef<TextareaRenderable>(null);
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

	function submitPrompt() {
		if (isLoading) return;

		const state = promptSubmitSchema.safeParse({
			prompt: textareaRef.current?.plainText ?? "",
		});

		if (!state.success) return;

		textareaRef.current?.setText("");
		void sendMessage({ text: state.data.prompt });
	}

	return (
		<box flexDirection="column" gap={1} padding={1} flexGrow={1} width="100%">
			<scrollbox
				flexGrow={1}
				width="100%"
				stickyScroll
				stickyStart="bottom"
				scrollY
				focused={false}
				style={{
					scrollbarOptions: {
						showArrows: true,
						trackOptions: {
							foregroundColor: "#09ff00",
							backgroundColor: "#11271c",
						},
						arrowOptions: {
							foregroundColor: "#09ff00",
							backgroundColor: "#11271c",
						},
					},
					verticalScrollbarOptions: {
						visible: true,
						width: 1,
					},
					contentOptions: {
						gap: 1,
						paddingRight: 1,
					},
				}}
			>
				{messages.map((message) => {
					const text = getMessageText(message);
					if (!text) return null;
					const speaker = message.role === "user" ? "You" : "yu-code";

					return (
						<box
							key={message.id}
							flexDirection="row"
							alignItems="flex-start"
							gap={1}
							width="100%"
						>
							<box width={speakerWidth} flexShrink={0}>
								<text fg={message.role === "user" ? "#09ff00" : "#95ffba"}>
									{speaker}
								</text>
							</box>
							<text width="100%">{text}</text>
						</box>
					);
				})}
				{isLoading ? (
					<box flexDirection="row" alignItems="flex-start" gap={1} width="100%">
						<box width={speakerWidth} flexShrink={0}>
							<text fg="#95ffba">yu-code</text>
						</box>
						<text fg="#6b7280">Thinking...</text>
					</box>
				) : null}
				{error ? (
					<box flexDirection="row" alignItems="flex-start" gap={1} width="100%">
						<box width={speakerWidth} flexShrink={0}>
							<text fg="#ff5c57">Error</text>
						</box>
						<text fg="#ff5c57">{error.message}</text>
					</box>
				) : null}
			</scrollbox>
			<box
				flexDirection="column"
				marginTop={1}
				flexShrink={0}
				borderStyle="single"
				border={["top"]}
				paddingTop={1}
			>
				<box flexDirection="row" gap={1} alignItems="flex-start">
					<box width={speakerWidth} flexShrink={0}>
						<text fg="#09ff00">You</text>
					</box>
					<box flexDirection="column">
						<text fg="#6b7280">Reply</text>
						<textarea
							ref={textareaRef}
							initialValue=""
							placeholder="Continue the conversation..."
							width={72}
							height={4}
							focused
							wrapMode="word"
							backgroundColor="#11271c"
							focusedBackgroundColor="#11271c"
							textColor="#95ffba"
							placeholderColor="#6b7280"
							cursorColor="#c7ffe3"
							keyBindings={[
								{ name: "return", action: "submit" },
								{ name: "enter", action: "submit" },
								{ name: "kpenter", action: "submit" },
								{ name: "return", shift: true, action: "newline" },
								{ name: "enter", shift: true, action: "newline" },
								{ name: "kpenter", shift: true, action: "newline" },
							]}
							onSubmit={submitPrompt}
						/>
					</box>
				</box>
			</box>
		</box>
	);
}
