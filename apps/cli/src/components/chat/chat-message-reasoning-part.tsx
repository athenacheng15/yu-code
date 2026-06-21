import type { ReasoningUIPart } from "ai";

type ChatMessageReasoningPartProps = {
	part: ReasoningUIPart;
};

export function ChatMessageReasoningPart({
	part,
}: ChatMessageReasoningPartProps) {
	if (!part.text) return null;

	return <text fg="#6b7280" width="100%">{`Reasoning: ${part.text}`}</text>;
}
