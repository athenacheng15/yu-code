import { afterEach, describe, expect, test } from "bun:test";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { chatCommands } from "../../lib/chat-commands";
import { CommandPopover } from "./command-popover";

let testSetup: Awaited<ReturnType<typeof testRender>> | undefined;

afterEach(() => {
	act(() => {
		testSetup?.renderer.destroy();
	});
	testSetup = undefined;
});

describe("CommandPopover", () => {
	test("renders command tokens and descriptions", async () => {
		await act(async () => {
			testSetup = await testRender(
				<CommandPopover commands={chatCommands} activeIndex={1} top={0} />,
				{ width: 80, height: 8 },
			);
		});
		await act(async () => {
			await testSetup?.renderOnce();
		});

		if (!testSetup) throw new Error("Test renderer was not initialized");

		const frame = testSetup.captureCharFrame();

		expect(frame).toContain("/exit");
		expect(frame).toContain("Exit yu-code");
		expect(frame).toContain("/new");
		expect(frame).toContain("Start a new chat");
	});
});
