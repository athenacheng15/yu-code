import { createSessionResponseEnvelopeSchema } from "@yu-code/shared";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ChatTextArea } from "../../components/chat/chat-text-area";
import { AsciiLogo } from "../../components/home/ascii-logo";
import { client } from "../../lib/client";

export function HomeScreen() {
	const navigate = useNavigate();
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<Error>();

	async function createChat(prompt: string) {
		setIsCreating(true);
		setError(undefined);

		try {
			const response = await client.sessions.$post({ json: { prompt } });
			const body: unknown = await response.json();

			if (!response.ok) {
				const error =
					typeof body === "object" &&
					body !== null &&
					"error" in body &&
					typeof body.error === "string"
						? body.error
						: "Could not create session";
				throw new Error(error);
			}

			const data = createSessionResponseEnvelopeSchema.parse(body);
			navigate(`/sessions/${data.id}`, { state: { prompt } });
		} catch (cause) {
			setError(cause instanceof Error ? cause : new Error("Could not create session"));
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
			<box marginTop={1} width="100%">
				<ChatTextArea
					label="What are we building?"
					placeholder="Ask yu-code to edit, explain, or create something..."
					height={5}
					focused
					disabled={isCreating}
					onSubmit={submitPrompt}
				/>
			</box>
			{isCreating ? <text fg="#6b7280">Creating session...</text> : null}
			{error ? <text fg="#ef4444">{error.message}</text> : null}
		</box>
	);
}
