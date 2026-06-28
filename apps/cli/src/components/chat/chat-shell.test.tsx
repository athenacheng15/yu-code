import { afterEach, describe, expect, test } from "bun:test";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { ChatShell } from "./chat-shell";

let testSetup: Awaited<ReturnType<typeof testRender>> | undefined;

afterEach(() => {
	act(() => {
		testSetup?.renderer.destroy();
	});
	testSetup = undefined;
});

describe("ChatShell", () => {
	test("renders the active mode beneath the textarea", async () => {
		await act(async () => {
			testSetup = await testRender(
				<ChatShell
					messages={[]}
					isLoading={false}
					modeId="plan"
					modeLabel="Plan"
					onSubmit={() => {}}
				/>,
				{ width: 80, height: 20 },
			);
		});
		await act(async () => {
			await testSetup?.renderOnce();
		});

		if (!testSetup) throw new Error("Test renderer was not initialized");

		expect(testSetup.captureCharFrame()).toContain(
			"Plan · claude-haiku-4-5 Anthropic",
		);
	});
});
