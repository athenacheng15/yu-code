import { ChatMessage } from "./chat-message";
import { ChatMessageError } from "./chat-message-error";
import { ChatTextArea } from "./chat-text-area";
import { ModeStatus } from "./mode-status";
import type { CodingAgentMessage, ModeId } from "@yu-code/ai/client";

type ChatShellProps = {
	messages: CodingAgentMessage[];
	isLoading: boolean;
	error?: Error;
	modeId: ModeId;
	modeLabel: string;
	pendingApproval?: {
		path: string;
		reason?: string;
	};
	onSubmit: (text: string) => void;
	onCommand?: (text: string) => boolean;
};

export function ChatShell({
	messages,
	isLoading,
	error,
	modeId,
	modeLabel,
	pendingApproval,
	onSubmit,
	onCommand,
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
					<ChatMessage
						key={message.id}
						currentModeId={modeId}
						message={message}
					/>
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
				flexDirection="column"
				gap={1}
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
					modeId={modeId}
					placeholder={
						pendingApproval
							? "Type y to approve or n to deny..."
							: "Continue the conversation..."
					}
					focused
					disabled={isLoading}
					commandPopoverPlacement="above"
					footer={<ModeStatus modeId={modeId} modeLabel={modeLabel} />}
					onSubmit={onSubmit}
					onCommand={onCommand}
				/>
			</box>
		</box>
	);
}
