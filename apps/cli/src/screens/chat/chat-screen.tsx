import { useCodingChat } from "@yu-code/ai/client";
import { sessionIdSchema } from "@yu-code/shared";
import { useLocation, useParams } from "react-router";
import { z } from "zod";
import { ChatShell } from "../../components/chat/chat-shell";
import { createChatUrl, loadSessionMessages } from "../../lib/client";

const chatLocationStateSchema = z.object({
	prompt: z.string(),
});

export function ChatScreen() {
	const location = useLocation();
	const params = useParams<{ id: string }>();
	const sessionId = sessionIdSchema.parse(params.id);
	const state = chatLocationStateSchema.safeParse(location.state);
	const prompt = state.success ? state.data.prompt : "";
	const { messages, isLoading, error, pendingApproval, submitMessage } =
		useCodingChat({
			sessionId,
			api: createChatUrl(sessionId),
			prompt,
			loadMessages: loadSessionMessages,
		});

	return (
		<ChatShell
			messages={messages}
			isLoading={isLoading}
			error={error}
			pendingApproval={
				pendingApproval
					? {
							path: pendingApproval.path,
							reason: pendingApproval.reason,
						}
					: undefined
			}
			onSubmit={submitMessage}
		/>
	);
}
