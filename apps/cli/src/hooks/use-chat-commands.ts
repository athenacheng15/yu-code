import { useRenderer } from "@opentui/react";
import { useNavigate } from "react-router";
import { executeChatCommand } from "../lib/chat-commands";

export function useChatCommands() {
	const renderer = useRenderer();
	const navigate = useNavigate();

	function executeCommand(input: string): boolean {
		return executeChatCommand(
			{
				exit: () => renderer.destroy(),
				navigate,
			},
			input,
		);
	}

	return executeCommand;
}
