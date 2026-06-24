type ChatMessageErrorProps = {
	error: Error;
};

export function ChatMessageError({ error }: ChatMessageErrorProps) {
	return (
		<box flexDirection="row" alignItems="flex-start" gap={1} width="100%">
			<box width={8} flexShrink={0}>
				<text fg="#ef4444">Error</text>
			</box>
			<text fg="#ef4444" width="100%">
				{error.message}
			</text>
		</box>
	);
}
