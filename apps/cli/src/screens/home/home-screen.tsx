import { useNavigate } from "react-router";
import { ChatTextArea } from "../../components/chat/chat-text-area";
import { AsciiLogo } from "../../components/home/ascii-logo";

export function HomeScreen() {
	const navigate = useNavigate();

	function submitPrompt(prompt: string) {
		navigate("/chat", { state: { prompt } });
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
					onSubmit={submitPrompt}
				/>
			</box>
		</box>
	);
}
