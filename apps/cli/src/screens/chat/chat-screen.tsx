import { useChat } from "@ai-sdk/react";
import { sessionIdSchema } from "@yu-code/shared";
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithToolCalls,
	type ChatOnToolCallCallback,
} from "ai";
import {
	listFilesInputSchema,
	readFileInputSchema,
	type ChatMessage,
	type WriteFileInput,
	writeFileInputSchema,
} from "@yu-code/tools";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router";
import { z } from "zod";
import { ChatShell } from "../../components/chat/chat-shell";
import { createChatUrl, loadSessionMessages } from "../../lib/client";
import { listFiles, readFile, writeFile } from "../../tools";

const chatLocationStateSchema = z.object({
	prompt: z.string(),
});

type PendingWrite = {
	toolCallId: string;
	input: WriteFileInput;
};

export function ChatScreen() {
	const location = useLocation();
	const params = useParams<{ id: string }>();
	const sessionId = sessionIdSchema.parse(params.id);
	const state = chatLocationStateSchema.safeParse(location.state);
	const prompt = state.success ? state.data.prompt : "";
	const submittedPromptRef = useRef<string | null>(null);
	const pendingWriteRef = useRef<PendingWrite | null>(null);
	const [isHydrated, setIsHydrated] = useState(false);
	const [loadError, setLoadError] = useState<Error>();
	const [pendingWrite, setPendingWrite] = useState<PendingWrite | null>(null);
	const transport = useMemo(() => {
		return new DefaultChatTransport<ChatMessage>({
			api: createChatUrl(sessionId),
			prepareSendMessagesRequest: ({ messages }) => ({
				body: {
					message: messages.at(-1),
				},
			}),
		});
	}, [sessionId]);
	const { messages, setMessages, sendMessage, addToolOutput, error, status } =
		useChat<ChatMessage>({
			id: sessionId,
			transport,
			sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
			onToolCall({ toolCall }) {
				if (toolCall.dynamic) return;

				if (toolCall.toolName === "writeFile") {
					const parseResult = writeFileInputSchema.safeParse(toolCall.input);
					if (!parseResult.success) {
						void addToolOutput({
							tool: "writeFile",
							toolCallId: toolCall.toolCallId,
							state: "output-error",
							errorText:
								parseResult.error.issues[0]?.message ?? "Invalid write input",
						});
						return;
					}

					if (pendingWriteRef.current) {
						void addToolOutput({
							tool: "writeFile",
							toolCallId: toolCall.toolCallId,
							state: "output-error",
							errorText: "Another write is already awaiting approval.",
						});
						return;
					}

					const nextPendingWrite = {
						toolCallId: toolCall.toolCallId,
						input: parseResult.data,
					};
					pendingWriteRef.current = nextPendingWrite;
					setPendingWrite(nextPendingWrite);
					return;
				}

				void executeAutomaticToolCall(toolCall, addToolOutput);
			},
		});
	const isLoading =
		!isHydrated || status === "submitted" || status === "streaming";

	useEffect(() => {
		let cancelled = false;
		setIsHydrated(false);
		setLoadError(undefined);
		setPendingWrite(null);
		pendingWriteRef.current = null;
		submittedPromptRef.current = null;

		async function loadMessages() {
			try {
				const data = await loadSessionMessages(sessionId);

				if (!cancelled) {
					setMessages(data.messages);
					setIsHydrated(true);
				}
			} catch (cause) {
				if (!cancelled) {
					setLoadError(
						cause instanceof Error ? cause : new Error("Could not load session"),
					);
				}
			}
		}

		void loadMessages();

		return () => {
			cancelled = true;
		};
	}, [sessionId, setMessages]);

	useEffect(() => {
		if (
			!isHydrated ||
			!prompt ||
			submittedPromptRef.current === prompt ||
			messages.length > 0
		) {
			return;
		}

		submittedPromptRef.current = prompt;
		void sendMessage({ text: prompt });
	}, [isHydrated, messages.length, prompt, sendMessage]);

	function submitMessage(text: string) {
		if (pendingWrite) {
			void submitWriteApproval(text);
			return;
		}

		void sendMessage({ text });
	}

	async function submitWriteApproval(text: string) {
		const decision = text.trim().toLowerCase();
		const write = pendingWriteRef.current;
		if (!write) return;

		if (
			decision !== "y" &&
			decision !== "yes" &&
			decision !== "n" &&
			decision !== "no"
		) {
			setLoadError(new Error("Type y to approve the write or n to deny it."));
			return;
		}

		setLoadError(undefined);
		setPendingWrite(null);
		pendingWriteRef.current = null;

		if (decision === "n" || decision === "no") {
			void addToolOutput({
				tool: "writeFile",
				toolCallId: write.toolCallId,
				state: "output-error",
				errorText: "User denied the write.",
			});
			return;
		}

		try {
			const output = await writeFile(write.input);
			void addToolOutput({
				tool: "writeFile",
				toolCallId: write.toolCallId,
				output,
			});
		} catch (cause) {
			void addToolOutput({
				tool: "writeFile",
				toolCallId: write.toolCallId,
				state: "output-error",
				errorText: cause instanceof Error ? cause.message : "Could not write file.",
			});
		}
	}

	return (
		<ChatShell
			messages={messages}
			isLoading={isLoading}
			error={loadError ?? error}
			pendingApproval={
				pendingWrite
					? {
							path: pendingWrite.input.path,
							reason: pendingWrite.input.reason,
						}
					: undefined
			}
			onSubmit={submitMessage}
		/>
	);
}

type StaticToolCall = Exclude<
	Parameters<ChatOnToolCallCallback<ChatMessage>>[0]["toolCall"],
	{ dynamic: true }
>;

type AddToolOutput = ReturnType<typeof useChat<ChatMessage>>["addToolOutput"];

async function executeAutomaticToolCall(
	toolCall: StaticToolCall,
	addToolOutput: AddToolOutput,
) {
	try {
		if (toolCall.toolName === "listFiles") {
			const input = listFilesInputSchema.parse(toolCall.input);
			const output = await listFiles(input);
			void addToolOutput({
				tool: "listFiles",
				toolCallId: toolCall.toolCallId,
				output,
			});
			return;
		}

		if (toolCall.toolName === "readFile") {
			const input = readFileInputSchema.parse(toolCall.input);
			const output = await readFile(input);
			void addToolOutput({
				tool: "readFile",
				toolCallId: toolCall.toolCallId,
				output,
			});
			return;
		}

		void addToolOutput({
			tool: toolCall.toolName,
			toolCallId: toolCall.toolCallId,
			state: "output-error",
			errorText: `Unknown tool: ${toolCall.toolName}`,
		});
	} catch (cause) {
		void addToolOutput({
			tool: toolCall.toolName,
			toolCallId: toolCall.toolCallId,
			state: "output-error",
			errorText: cause instanceof Error ? cause.message : "Tool execution failed.",
		});
	}
}
