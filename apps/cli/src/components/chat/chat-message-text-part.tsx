import type { TextUIPart } from "ai";

type ChatMessageTextPartProps = {
	part: TextUIPart;
};

export function ChatMessageTextPart({ part }: ChatMessageTextPartProps) {
	if (!part.text) return null;

	return <text width="100%">{part.text}</text>;
}
