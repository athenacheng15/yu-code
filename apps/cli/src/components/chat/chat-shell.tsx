import type { UIMessage } from "ai";
import { ChatMessage } from "./chat-message";
import { ChatMessageError } from "./chat-message-error";
import { ChatTextArea } from "./chat-text-area";

type ChatShellProps = {
	messages: UIMessage[];
	isLoading: boolean;
	error?: Error;
	onSubmit: (text: string) => void;
};

export function ChatShell({
	messages,
	isLoading,
	error,
	onSubmit,
}: ChatShellProps) {
	return (
		<box
			flexDirection="column"
			gap={1}
			flexGrow={1}
			width="100%"
			height="100%"
			overflow="hidden"
		>
			<scrollbox
				flexGrow={1}
				width="100%"
				stickyScroll
				stickyStart="bottom"
				scrollY
				focused={false}
				style={{
					scrollbarOptions: {
						showArrows: true,
					},
					verticalScrollbarOptions: {
						visible: true,
						width: 1,
					},
					contentOptions: {
						gap: 1,
						paddingRight: 1,
					},
				}}
			>
				{messages.map((message) => (
					<ChatMessage key={message.id} message={message} />
				))}
				{isLoading ? (
					<box flexDirection="row" alignItems="flex-start" gap={1} width="100%">
						<box width={8} flexShrink={0}>
							<text fg="#9ca3af">yu-code</text>
						</box>
						<text fg="#6b7280">Thinking...</text>
					</box>
				) : null}
				{error ? <ChatMessageError error={error} /> : null}
			</scrollbox>
			<box
				border={["top"]}
				borderStyle="single"
				paddingTop={1}
				flexShrink={0}
				width="100%"
			>
				<ChatTextArea
					label="Reply"
					placeholder="Continue the conversation..."
					focused
					disabled={isLoading}
					onSubmit={onSubmit}
				/>
			</box>
		</box>
	);
}
