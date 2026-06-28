import {
	useChat,
	type UseChatHelpers,
} from "@ai-sdk/react";
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type MutableRefObject,
} from "react";
import {
	type CodingAgentMessage,
	validateCodingMessages,
} from "./messages.js";
import {
	defaultModeId,
	isToolAllowedInMode,
	type ModeId,
} from "./modes.js";
import {
	createPendingToolApproval,
	createToolErrorPayload,
	createToolOutputPayload,
	getToolApprovalDisplay,
	isCodingToolName,
	parseToolInput,
	runCodingTool,
	type CodingToolName,
	type PendingToolApproval,
} from "./tools/registry.js";

export {
	defaultModeId,
	getMode,
	getNextModeId,
	modeSchema,
	modes,
	type ModeId,
} from "./modes.js";
export { validateCodingMessages, type CodingAgentMessage };

type PendingApproval = PendingToolApproval;

export type CodingChatPendingApproval = {
	toolName: PendingApproval["toolName"];
	path: string;
	reason?: string;
};

export type UseCodingChatOptions = {
	sessionId: string;
	api: string;
	mode?: ModeId;
	prompt?: string;
	loadMessages: (sessionId: string) => Promise<{ messages: CodingAgentMessage[] }>;
};

export function useCodingChat({
	sessionId,
	api,
	mode = defaultModeId,
	prompt = "",
	loadMessages,
}: UseCodingChatOptions) {
	const submittedPromptRef = useRef<string | null>(null);
	const pendingApprovalRef = useRef<PendingApproval | null>(null);
	const addToolOutputRef = useRef<AddToolOutput | null>(null);
	const modeRef = useRef<ModeId>(mode);
	const [isHydrated, setIsHydrated] = useState(false);
	const [loadError, setLoadError] = useState<Error>();
	const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
	modeRef.current = mode;
	const transport = useMemo(() => {
		return new DefaultChatTransport<CodingAgentMessage>({
			api,
			prepareSendMessagesRequest: ({ messages }) => ({
				body: {
					message: messages.at(-1),
					mode: modeRef.current,
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
				modeRef,
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
			const output = await runCodingTool(approval.toolName, approval.input);
			submitToolOutput({
				addToolOutput,
				toolName: approval.toolName,
				toolCallId: approval.toolCallId,
				output,
			});
		} catch (cause) {
			submitToolError({
				addToolOutput,
				toolName: approval.toolName,
				toolCallId: approval.toolCallId,
				errorText: cause instanceof Error ? cause.message : "Could not change file.",
			});
		}
	}

	return {
		messages,
		isLoading,
		error: loadError ?? error,
		pendingApproval: pendingApproval
			? getToolApprovalDisplay(pendingApproval)
			: undefined,
		submitMessage,
	};
}

type AddToolOutput =
	UseChatHelpers<CodingAgentMessage>["addToolOutput"];

type ClientToolCall = {
	dynamic?: boolean;
	toolName: string;
	toolCallId: string;
	input: unknown;
};

type HandleToolCallOptions = {
	toolCall: ClientToolCall;
	addToolOutput: AddToolOutput;
	mode?: ModeId;
	pendingApprovalRef: MutableRefObject<PendingApproval | null>;
	setPendingApproval: (approval: PendingApproval | null) => void;
};

type CodingToolCallHandlerOptions = Omit<
	HandleToolCallOptions,
	"toolCall" | "addToolOutput"
> & {
	addToolOutputRef: MutableRefObject<AddToolOutput | null>;
	modeRef: MutableRefObject<ModeId>;
};

export function createCodingToolCallHandler(
	options: CodingToolCallHandlerOptions,
) {
	return function onToolCall({ toolCall }: { toolCall: ClientToolCall }) {
		const addToolOutput = options.addToolOutputRef.current;
		if (!addToolOutput) return;

		void handleToolCall({
			addToolOutput,
			mode: options.modeRef.current,
			pendingApprovalRef: options.pendingApprovalRef,
			setPendingApproval: options.setPendingApproval,
			toolCall,
		});
	};
}

export async function handleToolCall({
	toolCall,
	addToolOutput,
	mode = defaultModeId,
	pendingApprovalRef,
	setPendingApproval,
}: HandleToolCallOptions) {
	if (toolCall.dynamic) return;

	if (!isCodingToolName(toolCall.toolName)) {
		submitToolError({
			addToolOutput,
			toolName: toolCall.toolName,
			toolCallId: toolCall.toolCallId,
			errorText: `Unknown tool: ${toolCall.toolName}`,
		});
		return;
	}

	const toolName = toolCall.toolName;

	if (!isToolAllowedInMode(toolName, mode)) {
		submitToolError({
			addToolOutput,
			toolName,
			toolCallId: toolCall.toolCallId,
			errorText: `${toolName} is not available in ${mode} mode.`,
		});
		return;
	}

	let input: ReturnType<typeof parseToolInput<typeof toolName>>;

	try {
		input = parseToolInput(toolName, toolCall.input);
	} catch (cause) {
		submitToolError({
			addToolOutput,
			toolName,
			toolCallId: toolCall.toolCallId,
			errorText: cause instanceof Error ? cause.message : "Invalid tool input.",
		});
		return;
	}

	const approval = createPendingToolApproval({
		toolName,
		toolCallId: toolCall.toolCallId,
		input,
	});

	if (approval) {
		queueApproval({
			approval,
			addToolOutput,
			pendingApprovalRef,
			setPendingApproval,
		});
		return;
	}

	try {
		const output = await runCodingTool(toolName, input);
		submitToolOutput({
			addToolOutput,
			toolName,
			toolCallId: toolCall.toolCallId,
			output,
		});
	} catch (cause) {
		submitToolError({
			addToolOutput,
			toolName,
			toolCallId: toolCall.toolCallId,
			errorText: cause instanceof Error ? cause.message : "Tool execution failed.",
		});
	}
}

function queueApproval(
	options: {
		approval: PendingApproval;
		addToolOutput: AddToolOutput;
		pendingApprovalRef: MutableRefObject<PendingApproval | null>;
		setPendingApproval: (approval: PendingApproval | null) => void;
	},
) {
	if (options.pendingApprovalRef.current) {
		submitToolError({
			addToolOutput: options.addToolOutput,
			toolName: options.approval.toolName,
			toolCallId: options.approval.toolCallId,
			errorText: "Another filesystem change is already awaiting approval.",
		});
		return;
	}

	options.pendingApprovalRef.current = options.approval;
	options.setPendingApproval(options.approval);
}

function submitToolOutput<Name extends CodingToolName>({
	addToolOutput,
	toolName,
	toolCallId,
	output,
}: {
	addToolOutput: AddToolOutput;
	toolName: Name;
	toolCallId: string;
	output: Awaited<ReturnType<typeof runCodingTool<Name>>>;
}) {
	void addToolOutput(
		createToolOutputPayload({
			toolName,
			toolCallId,
			output,
		}) as Parameters<AddToolOutput>[0],
	);
}

function submitToolError({
	addToolOutput,
	toolName,
	toolCallId,
	errorText,
}: {
	addToolOutput: AddToolOutput;
	toolName: string;
	toolCallId: string;
	errorText: string;
}) {
	void addToolOutput(
		createToolErrorPayload({
			toolName: toolName as CodingToolName,
			toolCallId,
			errorText,
		}) as Parameters<AddToolOutput>[0],
	);
}
