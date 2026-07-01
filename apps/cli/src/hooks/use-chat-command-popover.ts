import { useKeyboard } from "@opentui/react";
import { useEffect, useMemo, useState } from "react";
import { getSuggestedChatCommands } from "../lib/chat-commands";

type UseChatCommandPopoverOptions = {
	placement: "above" | "below";
	label?: string;
	textareaHeight: number;
	getRawText: () => string;
	clearText: () => void;
	onSubmit: (text: string) => void;
	onCommand?: (text: string) => boolean;
};

export function getCommandPopoverTop({
	placement,
	hasLabel,
	textareaHeight,
	commandCount,
}: {
	placement: "above" | "below";
	hasLabel: boolean;
	textareaHeight: number;
	commandCount: number;
}) {
	const labelHeight = hasLabel ? 2 : 0;
	const popoverHeight = commandCount + 2;

	return placement === "above"
		? labelHeight - popoverHeight
		: labelHeight + textareaHeight;
}

export function useChatCommandPopover({
	placement,
	label,
	textareaHeight,
	getRawText,
	clearText,
	onSubmit,
	onCommand,
}: UseChatCommandPopoverOptions) {
	const [draftText, setDraftText] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const commands = useMemo(
		() => getSuggestedChatCommands(draftText),
		[draftText],
	);
	const isOpen = commands.length > 0;
	const top = getCommandPopoverTop({
		placement,
		hasLabel: Boolean(label),
		textareaHeight,
		commandCount: commands.length,
	});

	useEffect(() => {
		setActiveIndex(0);
	}, [draftText]);

	useKeyboard((key) => {
		if (!isOpen) {
			return;
		}

		if (key.name === "escape") {
			setDraftText("");
			return;
		}

		if (key.name === "up") {
			setActiveIndex((currentIndex) => {
				return currentIndex === 0 ? commands.length - 1 : currentIndex - 1;
			});
			return;
		}

		if (key.name === "down") {
			setActiveIndex((currentIndex) => {
				return (currentIndex + 1) % commands.length;
			});
		}
	});

	function reset() {
		clearText();
		setDraftText("");
	}

	function handleContentChange(rawText: string) {
		setDraftText(rawText);
	}

	function handleSubmit() {
		const rawText = getRawText();
		const text = rawText.trim();
		if (!text) return;

		const selectedCommand = isOpen ? commands[activeIndex] : undefined;

		if (selectedCommand && onCommand?.(selectedCommand.token)) {
			reset();
			return;
		}

		if (onCommand?.(rawText)) {
			reset();
			return;
		}

		reset();
		onSubmit(text);
	}

	return {
		commands,
		activeIndex,
		isOpen,
		top,
		handleContentChange,
		handleSubmit,
	};
}
