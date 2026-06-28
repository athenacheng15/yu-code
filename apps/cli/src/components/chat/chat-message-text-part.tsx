import type { TextUIPart } from "ai";

type ChatMessageTextPartProps = {
	part: TextUIPart;
	color?: string;
	backgroundColor?: string;
};

export function ChatMessageTextPart({
	part,
	color,
	backgroundColor,
}: ChatMessageTextPartProps) {
	if (!part.text) return null;

	return (
		<text bg={backgroundColor} fg={color} width="100%">
			{part.text}
		</text>
	);
}
