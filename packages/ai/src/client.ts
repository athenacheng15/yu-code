import {
	useChat,
	type UseChatHelpers,
	type UseChatOptions,
} from "@ai-sdk/react";
import {
	DefaultChatTransport,
	safeValidateUIMessages,
	tool,
	lastAssistantMessageIsCompleteWithToolCalls,
	type InferUITools,
	type UIDataTypes,
	type UIMessage,
} from "ai";
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type MutableRefObject,
} from "react";
import {
	editFileInputSchema,
	editFileOutputSchema,
	grepFilesInputSchema,
	grepFilesOutputSchema,
	listFilesInputSchema,
	listFilesOutputSchema,
	readFileInputSchema,
	readFileOutputSchema,
	type EditFileInput,
	type WriteFileInput,
	writeFileInputSchema,
	writeFileOutputSchema,
} from "./index.js";
import { editFile, grepFiles, listFiles, readFile, writeFile } from "./tools/runners.js";

export const chatTools = {
	listFiles: tool({
		description:
			"List files and directories under a relative path in the local workspace.",
		inputSchema: listFilesInputSchema,
		outputSchema: listFilesOutputSchema,
	}),
	readFile: tool({
		description: "Read a UTF-8 text file from the local workspace.",
		inputSchema: readFileInputSchema,
		outputSchema: readFileOutputSchema,
	}),
	writeFile: tool({
		description:
			"Write complete UTF-8 file contents in the local workspace. Requires user approval.",
		inputSchema: writeFileInputSchema,
		outputSchema: writeFileOutputSchema,
	}),
	editFile: tool({
		description:
			"Replace exact text in a UTF-8 file in the local workspace. Requires user approval.",
		inputSchema: editFileInputSchema,
		outputSchema: editFileOutputSchema,
	}),
	grepFiles: tool({
		description:
			"Search UTF-8 text files in the local workspace by text or JavaScript regular expression.",
		inputSchema: grepFilesInputSchema,
		outputSchema: grepFilesOutputSchema,
	}),
};

export type CodingAgentMessage = UIMessage<
	unknown,
	UIDataTypes,
	InferUITools<typeof chatTools>
>;

export async function validateCodingMessages(messages: unknown[]) {
	return safeValidateUIMessages<CodingAgentMessage>({
		messages,
		tools: chatTools,
	});
}

type PendingWriteApproval = {
	toolName: "writeFile";
	toolCallId: string;
	input: WriteFileInput;
};

type PendingEditApproval = {
	toolName: "editFile";
	toolCallId: string;
	input: EditFileInput;
};

type PendingApproval = PendingWriteApproval | PendingEditApproval;

export type CodingChatPendingApproval = {
	toolName: PendingApproval["toolName"];
	path: string;
	reason?: string;
};

export type UseCodingChatOptions = {
	sessionId: string;
	api: string;
	prompt?: string;
	loadMessages: (sessionId: string) => Promise<{ messages: CodingAgentMessage[] }>;
};

export function useCodingChat({
	sessionId,
	api,
	prompt = "",
	loadMessages,
}: UseCodingChatOptions) {
	const submittedPromptRef = useRef<string | null>(null);
	const pendingApprovalRef = useRef<PendingApproval | null>(null);
	const addToolOutputRef = useRef<AddToolOutput | null>(null);
	const [isHydrated, setIsHydrated] = useState(false);
	const [loadError, setLoadError] = useState<Error>();
	const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
	const transport = useMemo(() => {
		return new DefaultChatTransport<CodingAgentMessage>({
			api,
			prepareSendMessagesRequest: ({ messages }) => ({
				body: {
					message: messages.at(-1),
				},
			}),
		});
	}, [api]);
	const { messages, setMessages, sendMessage, addToolOutput, error, status } =
		useChat<CodingAgentMessage>({
			id: sessionId,
			transport,
			sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
			onToolCall: createCodingToolCallHandler({
				addToolOutputRef,
				pendingApprovalRef,
				setPendingApproval,
			}),
		});
	addToolOutputRef.current = addToolOutput;
	const isLoading =
		!isHydrated || status === "submitted" || status === "streaming";

	useEffect(() => {
		let cancelled = false;
		setIsHydrated(false);
		setLoadError(undefined);
		setPendingApproval(null);
		pendingApprovalRef.current = null;
		submittedPromptRef.current = null;

		async function loadData() {
			try {
				const data = await loadMessages(sessionId);

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

		void loadData();

		return () => {
			cancelled = true;
		};
	}, [loadMessages, sessionId, setMessages]);

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
		if (pendingApproval) {
			void submitApproval(text);
			return;
		}

		void sendMessage({ text });
	}

	async function submitApproval(text: string) {
		const decision = text.trim().toLowerCase();
		const approval = pendingApprovalRef.current;
		if (!approval) return;

		if (
			decision !== "y" &&
			decision !== "yes" &&
			decision !== "n" &&
			decision !== "no"
		) {
			setLoadError(new Error("Type y to approve the write/edit or n to deny it."));
			return;
		}

		setLoadError(undefined);
		setPendingApproval(null);
		pendingApprovalRef.current = null;

		if (decision === "n" || decision === "no") {
			void addToolOutput({
				tool: approval.toolName,
				toolCallId: approval.toolCallId,
				state: "output-error",
				errorText: "User denied the filesystem change.",
			});
			return;
		}

		try {
			if (approval.toolName === "writeFile") {
				const output = await writeFile(approval.input);
				void addToolOutput({
					tool: "writeFile",
					toolCallId: approval.toolCallId,
					output,
				});
				return;
			}

			const output = await editFile(approval.input);
			void addToolOutput({
				tool: "editFile",
				toolCallId: approval.toolCallId,
				output,
			});
		} catch (cause) {
			void addToolOutput({
				tool: approval.toolName,
				toolCallId: approval.toolCallId,
				state: "output-error",
				errorText:
					cause instanceof Error ? cause.message : "Could not change file.",
			});
		}
	}

	return {
		messages,
		isLoading,
		error: loadError ?? error,
		pendingApproval: pendingApproval
			? {
					toolName: pendingApproval.toolName,
					path: pendingApproval.input.path,
					reason: pendingApproval.input.reason,
				}
			: undefined,
		submitMessage,
	};
}

type StaticToolCall = Exclude<
	Parameters<CodingChatOnToolCall>[0]["toolCall"],
	{ dynamic: true }
>;

type CodingChatInitOptions = Exclude<
	UseChatOptions<CodingAgentMessage>,
	{ chat: unknown }
>;

type CodingChatOnToolCall = NonNullable<CodingChatInitOptions["onToolCall"]>;

type AddToolOutput =
	UseChatHelpers<CodingAgentMessage>["addToolOutput"];

type HandleToolCallOptions = {
	toolCall: Parameters<CodingChatOnToolCall>[0]["toolCall"];
	addToolOutput: AddToolOutput;
	pendingApprovalRef: MutableRefObject<PendingApproval | null>;
	setPendingApproval: (approval: PendingApproval | null) => void;
};

type CodingToolCallHandlerOptions = Omit<
	HandleToolCallOptions,
	"toolCall" | "addToolOutput"
> & {
	addToolOutputRef: MutableRefObject<AddToolOutput | null>;
};

export function createCodingToolCallHandler(
	options: CodingToolCallHandlerOptions,
): CodingChatOnToolCall {
	return function onToolCall({ toolCall }) {
		const addToolOutput = options.addToolOutputRef.current;
		if (!addToolOutput) return;

		void handleToolCall({
			addToolOutput,
			pendingApprovalRef: options.pendingApprovalRef,
			setPendingApproval: options.setPendingApproval,
			toolCall,
		});
	};
}

export async function handleToolCall({
	toolCall,
	addToolOutput,
	pendingApprovalRef,
	setPendingApproval,
}: HandleToolCallOptions) {
	if (toolCall.dynamic) return;

	if (toolCall.toolName === "writeFile") {
		const parseResult = writeFileInputSchema.safeParse(toolCall.input);
		if (!parseResult.success) {
			void addToolOutput({
				tool: "writeFile",
				toolCallId: toolCall.toolCallId,
				state: "output-error",
				errorText: parseResult.error.issues[0]?.message ?? "Invalid write input",
			});
			return;
		}

		queueApproval({
			toolName: "writeFile",
			toolCallId: toolCall.toolCallId,
			input: parseResult.data,
			addToolOutput,
			pendingApprovalRef,
			setPendingApproval,
		});
		return;
	}

	if (toolCall.toolName === "editFile") {
		const parseResult = editFileInputSchema.safeParse(toolCall.input);
		if (!parseResult.success) {
			void addToolOutput({
				tool: "editFile",
				toolCallId: toolCall.toolCallId,
				state: "output-error",
				errorText: parseResult.error.issues[0]?.message ?? "Invalid edit input",
			});
			return;
		}

		queueApproval({
			toolName: "editFile",
			toolCallId: toolCall.toolCallId,
			input: parseResult.data,
			addToolOutput,
			pendingApprovalRef,
			setPendingApproval,
		});
		return;
	}

	await executeAutomaticToolCall(toolCall, addToolOutput);
}

function queueApproval(
	approval: PendingApproval & {
		addToolOutput: AddToolOutput;
		pendingApprovalRef: MutableRefObject<PendingApproval | null>;
		setPendingApproval: (approval: PendingApproval | null) => void;
	},
) {
	if (approval.pendingApprovalRef.current) {
		void approval.addToolOutput({
			tool: approval.toolName,
			toolCallId: approval.toolCallId,
			state: "output-error",
			errorText: "Another filesystem change is already awaiting approval.",
		});
		return;
	}

	const nextApproval: PendingApproval =
		approval.toolName === "writeFile"
			? {
					toolName: approval.toolName,
					toolCallId: approval.toolCallId,
					input: approval.input,
				}
			: {
					toolName: approval.toolName,
					toolCallId: approval.toolCallId,
					input: approval.input,
				};
	approval.pendingApprovalRef.current = nextApproval;
	approval.setPendingApproval(nextApproval);
}

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

		if (toolCall.toolName === "grepFiles") {
			const input = grepFilesInputSchema.parse(toolCall.input);
			const output = await grepFiles(input);
			void addToolOutput({
				tool: "grepFiles",
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
