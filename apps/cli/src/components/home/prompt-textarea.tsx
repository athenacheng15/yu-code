import type { TextareaRenderable } from "@opentui/core";
import { useRef } from "react";
import { useNavigate } from "react-router";
import { z } from "zod";

const promptSubmitSchema = z.object({
	prompt: z.string().min(1),
});

export function PromptTextarea() {
	const navigate = useNavigate();
	const textareaRef = useRef<TextareaRenderable>(null);

	function submitPrompt() {
		const state = promptSubmitSchema.safeParse({
			prompt: textareaRef.current?.plainText ?? "",
		});

		if (!state.success) return;

		textareaRef.current?.setText("");
		navigate("/chat", { state: state.data });
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
