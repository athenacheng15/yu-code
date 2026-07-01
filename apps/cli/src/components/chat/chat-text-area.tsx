import type { TextareaRenderable } from "@opentui/core";
import type { ModeId } from "@yu-code/ai/client";
import { type ReactNode, useRef } from "react";
import { chatInputBackgroundColor } from "./chat-colors";
import { getModeColor } from "./mode-colors";

type ChatTextAreaProps = {
	label?: string;
	placeholder: string;
	modeId: ModeId;
	height?: number;
	focused?: boolean;
	disabled?: boolean;
	footer?: ReactNode;
	onSubmit: (text: string) => void;
	onCommand?: (text: string) => boolean;
};

export function ChatTextArea({
	label,
	placeholder,
	modeId,
	height = 4,
	focused = false,
	disabled = false,
	footer,
	onSubmit,
	onCommand,
}: ChatTextAreaProps) {
	const textareaRef = useRef<TextareaRenderable>(null);
	const backgroundColor = chatInputBackgroundColor;
	const paddingX = 1;
	const paddingY = 1;
	const innerHeight = Math.max(1, height - paddingY * 2);
	const bottomRule = "\u2500".repeat(240);

	function submitText() {
		if (disabled) return;

		const rawText = textareaRef.current?.plainText ?? "";
		const text = rawText.trim();
		if (!text) return;

		if (onCommand?.(rawText)) {
			textareaRef.current?.setText("");
			return;
		}

		textareaRef.current?.setText("");
		onSubmit(text);
	}

	return (
		<box flexDirection="column" width="100%">
			{label ? (
				<box marginBottom={1}>
					<text fg="#6b7280">{label}</text>
				</box>
			) : null}
			<box
				backgroundColor={backgroundColor}
				width="100%"
				height={height}
				paddingX={paddingX}
				paddingY={paddingY}
			>
				<textarea
					ref={textareaRef}
					initialValue=""
					placeholder={placeholder}
					backgroundColor={backgroundColor}
					width="100%"
					height={innerHeight}
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
			<box width="100%" height={1} overflow="hidden">
				<text fg={getModeColor(modeId)}>{bottomRule}</text>
			</box>
			{footer ? (
				<box width="100%" height={1}>
					{footer}
				</box>
			) : null}
		</box>
	);
}
