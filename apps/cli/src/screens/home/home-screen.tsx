import {
	defaultModeId,
	getMode,
	getNextModeId,
	type ModeId,
} from "@yu-code/ai/client";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ChatTextArea } from "../../components/chat/chat-text-area";
import { ModeStatus } from "../../components/chat/mode-status";
import { AsciiLogo } from "../../components/home/ascii-logo";
import { useChatCommands } from "../../hooks/use-chat-commands";
import { createSession } from "../../lib/client";

export function HomeScreen() {
	const navigate = useNavigate();
	const executeChatCommand = useChatCommands();
	const [mode, setMode] = useState<ModeId>(defaultModeId);
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<Error>();
	const activeMode = getMode(mode);

	useKeyboard((key) => {
		if (key.name !== "tab" || isCreating) {
			return;
		}

		setMode((currentMode) => {
			return getNextModeId(currentMode);
		});
	});

	async function createChat(prompt: string) {
		setIsCreating(true);
		setError(undefined);

		try {
			const data = await createSession(prompt);
			navigate(`/sessions/${data.id}`, { state: { mode, prompt } });
		} catch (cause) {
			setError(
				cause instanceof Error ? cause : new Error("Could not create session"),
			);
			setIsCreating(false);
		}
	}

	function submitPrompt(prompt: string) {
		void createChat(prompt);
	}

	return (
		<box
			flexDirection="column"
			width="100%"
			height="100%"
			overflow="hidden"
			padding={1}
		>
			<AsciiLogo />
			<box marginTop={1} width="100%" height={8}>
				<ChatTextArea
					label="What are we building?"
					modeId={activeMode.id}
					placeholder="Ask yu-code to edit, explain, or create something..."
					height={4}
					focused
					disabled={isCreating}
					footer={
						<ModeStatus modeId={activeMode.id} modeLabel={activeMode.label} />
					}
					onSubmit={submitPrompt}
					onCommand={executeChatCommand}
				/>
			</box>
			{isCreating ? <text fg="#6b7280">Creating session...</text> : null}
			{error ? <text fg="#ef4444">{error.message}</text> : null}
		</box>
	);
}
