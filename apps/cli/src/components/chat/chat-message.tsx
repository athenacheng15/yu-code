import {
	isReasoningUIPart,
	isTextUIPart,
	isToolUIPart,
	type UIDataTypes,
	type UIMessagePart,
	type UITools,
} from "ai";
import {
	modeSchema,
	type CodingAgentMessage,
	type ModeId,
} from "@yu-code/ai/client";
import { ChatMessageReasoningPart } from "./chat-message-reasoning-part";
import { ChatMessageTextPart } from "./chat-message-text-part";
import { ChatMessageToolPart } from "./chat-message-tool-part";
import { chatInputBackgroundColor } from "./chat-colors";
import { getModeColor } from "./mode-colors";

type ChatMessageProps = {
	message: CodingAgentMessage;
	currentModeId: ModeId;
};

const speakerWidth = 8;

const speakerByRole = {
	system: "System",
	user: "You",
	assistant: "yu-code",
} satisfies Record<CodingAgentMessage["role"], string>;

const speakerColorByRole = {
	system: "#6b7280",
	user: "#e5e7eb",
	assistant: "#9ca3af",
} satisfies Record<CodingAgentMessage["role"], string>;

function getSpeaker(message: CodingAgentMessage) {
	return speakerByRole[message.role];
}

type ChatMessagePartProps = {
	backgroundColor?: string;
	color?: string;
	part: UIMessagePart<UIDataTypes, UITools>;
};

function ChatMessagePart({
	backgroundColor,
	color,
	part,
}: ChatMessagePartProps) {
	if (isTextUIPart(part)) {
		return (
			<ChatMessageTextPart
				backgroundColor={backgroundColor}
				color={color}
				part={part}
			/>
		);
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

function getUserPromptColor(message: CodingAgentMessage, currentModeId: ModeId) {
	if (message.role !== "user") {
		return undefined;
	}

	const mode = modeSchema.safeParse(message.metadata?.mode);
	return getModeColor(mode.success ? mode.data : currentModeId);
}

export function ChatMessage({ currentModeId, message }: ChatMessageProps) {
	const textColor = getUserPromptColor(message, currentModeId);
	const isUserMessage = message.role === "user";
	const backgroundColor = isUserMessage ? chatInputBackgroundColor : undefined;
	const speakerColor = textColor ?? speakerColorByRole[message.role];

	return (
		<box
			backgroundColor={backgroundColor}
			flexDirection="row"
			alignItems="flex-start"
			gap={1}
			paddingY={isUserMessage ? 1 : 0}
			width="100%"
		>
			<box backgroundColor={backgroundColor} width={speakerWidth} flexShrink={0}>
				<text bg={backgroundColor} fg={speakerColor}>
					{getSpeaker(message)}
				</text>
			</box>
			<box
				backgroundColor={backgroundColor}
				flexDirection="column"
				gap={1}
				width="100%"
			>
				{message.parts.map((part, index) => (
					<ChatMessagePart
						key={`${message.id}-${index}`}
						backgroundColor={backgroundColor}
						color={textColor}
						part={part}
					/>
				))}
			</box>
		</box>
	);
}
