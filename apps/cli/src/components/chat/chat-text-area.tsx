import type { TextareaRenderable } from "@opentui/core";
import { useRef } from "react";

type ChatTextAreaProps = {
	label?: string;
	placeholder: string;
	height?: number;
	focused?: boolean;
	disabled?: boolean;
	onSubmit: (text: string) => void;
};

export function ChatTextArea({
	label,
	placeholder,
	height = 4,
	focused = false,
	disabled = false,
	onSubmit,
}: ChatTextAreaProps) {
	const textareaRef = useRef<TextareaRenderable>(null);

	function submitText() {
		if (disabled) return;

		const text = textareaRef.current?.plainText.trim() ?? "";
		if (!text) return;

		textareaRef.current?.setText("");
		onSubmit(text);
	}

	return (
		<box flexDirection="column" gap={label ? 1 : 0} width="100%">
			{label ? <text fg="#6b7280">{label}</text> : null}
			<textarea
				ref={textareaRef}
				initialValue=""
				placeholder={placeholder}
				width="100%"
				height={height}
				focused={focused}
				wrapMode="word"
				keyBindings={[
					{ name: "return", action: "submit" },
					{ name: "enter", action: "submit" },
					{ name: "kpenter", action: "submit" },
					{ name: "return", shift: true, action: "newline" },
					{ name: "enter", shift: true, action: "newline" },
					{ name: "kpenter", shift: true, action: "newline" },
				]}
				onSubmit={submitText}
			/>
		</box>
	);
}
