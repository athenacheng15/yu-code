import type { TextareaRenderable } from "@opentui/core";
import { useRef } from "react";
import { useNavigate } from "react-router";
import { navigationRoutes } from "../../app/routes";

export function PromptTextarea() {
	const navigate = useNavigate();
	const textareaRef = useRef<TextareaRenderable>(null);

	function submitPrompt() {
		const command = textareaRef.current?.plainText.trim().toLowerCase();
		const route = navigationRoutes.find((item) => item.command === command);

		if (!route) return;

		textareaRef.current?.setText("");
		navigate(route.path);
	}

	return (
		<box flexDirection="column" marginTop={1}>
			<text fg="#09ff00">What are we building?</text>
			<textarea
				ref={textareaRef}
				initialValue=""
				placeholder="Ask yu-code to edit, explain, or create something..."
				width={72}
				height={5}
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
	);
}
