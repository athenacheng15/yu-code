import {
	defaultModeId,
	getMode,
	getNextModeId,
	useCodingChat,
	type ModeId,
} from "@yu-code/ai/client";
import { useKeyboard } from "@opentui/react";
import { sessionIdSchema } from "@yu-code/shared";
import { useState } from "react";
import { useLocation, useParams } from "react-router";
import { z } from "zod";
import { ChatShell } from "../../components/chat/chat-shell";
import { createChatUrl, loadSessionMessages } from "../../lib/client";

const chatLocationStateSchema = z.object({
	prompt: z.string(),
});

export function ChatScreen() {
	const location = useLocation();
	const params = useParams<{ id: string }>();
	const sessionId = sessionIdSchema.parse(params.id);
	const state = chatLocationStateSchema.safeParse(location.state);
	const prompt = state.success ? state.data.prompt : "";
	const [mode, setMode] = useState<ModeId>(defaultModeId);
	const { messages, isLoading, error, pendingApproval, submitMessage } =
		useCodingChat({
			sessionId,
			api: createChatUrl(sessionId),
			mode,
			prompt,
			loadMessages: loadSessionMessages,
		});
	const activeMode = getMode(mode);

	useKeyboard((key) => {
		if (key.name !== "tab" || isLoading || pendingApproval) {
			return;
		}

		setMode((currentMode) => {
			return getNextModeId(currentMode);
		});
	});

	return (
		<ChatShell
			messages={messages}
			isLoading={isLoading}
			error={error}
			modeLabel={activeMode.label}
			pendingApproval={
				pendingApproval
					? {
							path: pendingApproval.path,
							reason: pendingApproval.reason,
						}
					: undefined
			}
			onSubmit={submitMessage}
		/>
	);
}
