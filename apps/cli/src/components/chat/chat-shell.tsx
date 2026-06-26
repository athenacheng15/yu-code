import type { UIMessage } from "ai";
import { ChatMessage } from "./chat-message";
import { ChatMessageError } from "./chat-message-error";
import { ChatTextArea } from "./chat-text-area";

type ChatShellProps = {
	messages: UIMessage[];
	isLoading: boolean;
	error?: Error;
	pendingApproval?: {
		path: string;
		reason?: string;
	};
	onSubmit: (text: string) => void;
};

export function ChatShell({
	messages,
	isLoading,
	error,
	pendingApproval,
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
				{pendingApproval ? (
					<box flexDirection="column" gap={1} width="100%" marginBottom={1}>
						<text fg="#f59e0b">{`Approve write to ${pendingApproval.path}?`}</text>
						{pendingApproval.reason ? (
							<text fg="#9ca3af">{pendingApproval.reason}</text>
						) : null}
					</box>
				) : null}
				<ChatTextArea
					label={pendingApproval ? "Approve" : "Reply"}
					placeholder={
						pendingApproval
							? "Type y to approve or n to deny..."
							: "Continue the conversation..."
					}
					focused
					disabled={isLoading}
					onSubmit={onSubmit}
				/>
			</box>
		</box>
	);
}
