export type ChatCommandInvocation<TName extends string = string> = {
	name: TName;
	rawInput: string;
	args: string;
};

export type ChatCommandContext = {
	exit: () => void;
	navigate: (path: string) => void;
};

export type ChatCommand = {
	name: string;
	token: `/${string}`;
	description: string;
	execute: (
		context: ChatCommandContext,
		invocation: ChatCommandInvocation,
	) => void;
};

export const chatCommands = [
	{
		name: "exit",
		token: "/exit",
		description: "Exit yu-code",
		execute: (
			{ exit }: ChatCommandContext,
			_invocation: ChatCommandInvocation,
		) => {
			exit();
		},
	},
	{
		name: "new",
		token: "/new",
		description: "Start a new chat",
		execute: (
			{ navigate }: ChatCommandContext,
			_invocation: ChatCommandInvocation,
		) => {
			navigate("/");
		},
	},
] as const satisfies readonly ChatCommand[];

export type ChatCommandName = (typeof chatCommands)[number]["name"];

export type KnownChatCommandInvocation =
	ChatCommandInvocation<ChatCommandName>;

type KnownChatCommand = (typeof chatCommands)[number];

function findChatCommand(name: string): KnownChatCommand | undefined {
	return chatCommands.find((command) => command.name === name);
}

function findChatCommandByToken(token: string): KnownChatCommand | undefined {
	return chatCommands.find((command) => command.token === token);
}

export function parseChatCommand(
	input: string,
): KnownChatCommandInvocation | undefined {
	const command = findChatCommandByToken(input);

	if (!command) {
		return undefined;
	}

	return {
		name: command.name,
		rawInput: input,
		args: "",
	};
}

export function executeChatCommand(
	context: ChatCommandContext,
	input: string,
): boolean {
	const invocation = parseChatCommand(input);

	if (!invocation) {
		return false;
	}

	const command = findChatCommand(invocation.name);

	if (!command) {
		return false;
	}

	command.execute(context, invocation);
	return true;
}
