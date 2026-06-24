import {
	isReasoningUIPart,
	isTextUIPart,
	isToolUIPart,
	type UIDataTypes,
	type UIMessage,
	type UIMessagePart,
	type UITools,
} from "ai";
import { ChatMessageReasoningPart } from "./chat-message-reasoning-part";
import { ChatMessageTextPart } from "./chat-message-text-part";
import { ChatMessageToolPart } from "./chat-message-tool-part";

type ChatMessageProps = {
	message: UIMessage;
};

const speakerWidth = 8;

const speakerByRole = {
	system: "System",
	user: "You",
	assistant: "yu-code",
} satisfies Record<UIMessage["role"], string>;

const speakerColorByRole = {
	system: "#6b7280",
	user: "#e5e7eb",
	assistant: "#9ca3af",
} satisfies Record<UIMessage["role"], string>;

function getSpeaker(message: UIMessage) {
	return speakerByRole[message.role];
}

type ChatMessagePartProps = {
	part: UIMessagePart<UIDataTypes, UITools>;
};

function ChatMessagePart({ part }: ChatMessagePartProps) {
	if (isTextUIPart(part)) {
		return <ChatMessageTextPart part={part} />;
	}

	if (isReasoningUIPart(part)) {
		return <ChatMessageReasoningPart part={part} />;
	}

	if (isToolUIPart(part)) {
		return <ChatMessageToolPart part={part} />;
	}

	if (part.type === "file") {
		return (
			<text fg="#6b7280" width="100%">
				{`File: ${part.filename ?? part.mediaType}`}
			</text>
		);
	}

	if (part.type === "source-url") {
		return (
			<text fg="#6b7280" width="100%">
				{`Source: ${part.title ?? part.url}`}
			</text>
		);
	}

	if (part.type === "source-document") {
		return (
			<text fg="#6b7280" width="100%">
				{`Source: ${part.title}`}
			</text>
		);
	}

	if (part.type.startsWith("data-")) {
		return <text fg="#6b7280" width="100%">{part.type}</text>;
	}

	return null;
}

export function ChatMessage({ message }: ChatMessageProps) {
	return (
		<box flexDirection="row" alignItems="flex-start" gap={1} width="100%">
			<box width={speakerWidth} flexShrink={0}>
				<text fg={speakerColorByRole[message.role]}>{getSpeaker(message)}</text>
			</box>
			<box flexDirection="column" gap={1} width="100%">
				{message.parts.map((part, index) => (
					<ChatMessagePart key={`${message.id}-${index}`} part={part} />
				))}
			</box>
		</box>
	);
}
