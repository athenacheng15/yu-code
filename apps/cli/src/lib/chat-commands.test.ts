import { describe, expect, test } from "bun:test";
import { executeChatCommand, parseChatCommand } from "./chat-commands";

describe("chat commands", () => {
	test("recognizes supported commands", () => {
		expect(parseChatCommand("/exit")).toEqual({
			name: "exit",
			rawInput: "/exit",
			args: "",
		});
		expect(parseChatCommand("/new")).toEqual({
			name: "new",
			rawInput: "/new",
			args: "",
		});
	});

	test("leaves non-exact command input as normal chat text", () => {
		expect(parseChatCommand("/unknown")).toBeUndefined();
		expect(parseChatCommand("hello /exit")).toBeUndefined();
		expect(parseChatCommand("/exit ")).toBeUndefined();
		expect(parseChatCommand("/exit now")).toBeUndefined();
		expect(parseChatCommand(" /exit")).toBeUndefined();
		expect(parseChatCommand('"/exit"')).toBeUndefined();
		expect(parseChatCommand("'/new'")).toBeUndefined();
	});

	test("executes command behavior with screen-provided context", () => {
		const calls: string[] = [];
		const navigate = (path: string) => {
			calls.push(`navigate:${path}`);
		};

		expect(
			executeChatCommand(
				{
					exit: () => calls.push("exit"),
					navigate,
				},
				"/new",
			),
		).toBe(true);
		expect(
			executeChatCommand(
				{
					exit: () => calls.push("exit"),
					navigate,
				},
				"/exit",
			),
		).toBe(true);

		expect(calls).toEqual(["navigate:/", "exit"]);
	});

	test("returns false when no command matched", () => {
		const calls: string[] = [];

		expect(
			executeChatCommand(
				{
					exit: () => calls.push("exit"),
					navigate: (path) => calls.push(`navigate:${path}`),
				},
				"/unknown",
			),
		).toBe(false);
		expect(
			executeChatCommand(
				{
					exit: () => calls.push("exit"),
					navigate: (path) => calls.push(`navigate:${path}`),
				},
				"/exit ",
			),
		).toBe(false);

		expect(calls).toEqual([]);
	});
});
