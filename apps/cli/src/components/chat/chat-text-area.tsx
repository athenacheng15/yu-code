import type { TextareaRenderable } from "@opentui/core";
import type { ModeId } from "@yu-code/ai/client";
import { type ReactNode, useRef } from "react";
import { useChatCommandPopover } from "../../hooks/use-chat-command-popover";
import { chatInputBackgroundColor } from "./chat-colors";
import { CommandPopover } from "./command-popover";
import { getModeColor } from "./mode-colors";

type ChatTextAreaProps = {
	label?: string;
	placeholder: string;
	modeId: ModeId;
	height?: number;
	commandPopoverPlacement?: "above" | "below";
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
	commandPopoverPlacement = "below",
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
	const commandPopover = useChatCommandPopover({
		placement: commandPopoverPlacement,
		label,
		textareaHeight: height,
		getRawText: () => textareaRef.current?.plainText ?? "",
		clearText: () => textareaRef.current?.setText(""),
		onSubmit,
		onCommand,
	});

	return (
		<box flexDirection="column" width="100%" position="relative">
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
					onContentChange={() => {
						commandPopover.handleContentChange(
							textareaRef.current?.plainText ?? "",
						);
					}}
					onSubmit={() => {
						if (disabled) return;
						commandPopover.handleSubmit();
					}}
				/>
			</box>
			{commandPopover.isOpen ? (
				<CommandPopover
					commands={commandPopover.commands}
					activeIndex={commandPopover.activeIndex}
					top={commandPopover.top}
				/>
			) : null}
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
