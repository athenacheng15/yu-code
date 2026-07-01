import { afterEach, describe, expect, test } from "bun:test";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
	getCommandPopoverTop,
	useChatCommandPopover,
} from "./use-chat-command-popover";

let testSetup: Awaited<ReturnType<typeof testRender>> | undefined;

afterEach(() => {
	act(() => {
		testSetup?.renderer.destroy();
	});
	testSetup = undefined;
});

describe("chat command popover hook helpers", () => {
	test("positions the popover below a textarea", () => {
		expect(
			getCommandPopoverTop({
				placement: "below",
				hasLabel: true,
				textareaHeight: 4,
				commandCount: 2,
			}),
		).toBe(6);
	});

	test("positions the popover above a textarea", () => {
		expect(
			getCommandPopoverTop({
				placement: "above",
				hasLabel: true,
				textareaHeight: 4,
				commandCount: 2,
			}),
		).toBe(-2);
	});

	test("executes the active suggested command on submit", async () => {
		let rawText = "/n";
		const handledCommands: string[] = [];
		let controls:
			| ReturnType<typeof useChatCommandPopover>
			| undefined;

		function Harness() {
			controls = useChatCommandPopover({
				placement: "below",
				textareaHeight: 4,
				getRawText: () => rawText,
				clearText: () => {
					rawText = "";
				},
				onSubmit: () => {},
				onCommand: (text) => {
					handledCommands.push(text);
					return true;
				},
			});

			return <box />;
		}

		await act(async () => {
			testSetup = await testRender(<Harness />, { width: 80, height: 8 });
		});
		await act(async () => {
			controls?.handleContentChange(rawText);
			await testSetup?.renderOnce();
		});
		await act(async () => {
			controls?.handleSubmit();
			await testSetup?.renderOnce();
		});

		expect(handledCommands).toEqual(["/new"]);
		expect(rawText).toBe("");
	});

	test("submits trimmed text when no command is handled", async () => {
		let rawText = "  hello  ";
		const submittedText: string[] = [];
		let controls:
			| ReturnType<typeof useChatCommandPopover>
			| undefined;

		function Harness() {
			controls = useChatCommandPopover({
				placement: "below",
				textareaHeight: 4,
				getRawText: () => rawText,
				clearText: () => {
					rawText = "";
				},
				onSubmit: (text) => {
					submittedText.push(text);
				},
				onCommand: () => false,
			});

			return <box />;
		}

		await act(async () => {
			testSetup = await testRender(<Harness />, { width: 80, height: 8 });
		});
		await act(async () => {
			controls?.handleContentChange(rawText);
			await testSetup?.renderOnce();
		});
		await act(async () => {
			controls?.handleSubmit();
			await testSetup?.renderOnce();
		});

		expect(submittedText).toEqual(["hello"]);
		expect(rawText).toBe("");
	});
});
