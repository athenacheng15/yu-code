import { afterEach, describe, expect, test } from "bun:test";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { AppRouter } from "./router";

let testSetup: Awaited<ReturnType<typeof testRender>> | undefined;

afterEach(() => {
	act(() => {
		testSetup?.renderer.destroy();
	});
	testSetup = undefined;
});

describe("root layout", () => {
	test("shows the current mode on the home screen", async () => {
		await act(async () => {
			testSetup = await testRender(<AppRouter />, { width: 80, height: 24 });
		});
		await act(async () => {
			await testSetup?.renderOnce();
		});

		if (!testSetup) throw new Error("Test renderer was not initialized");

		expect(testSetup.captureCharFrame()).toContain(
			"Build · claude-haiku-4-5 Anthropic",
		);
	});

	test("clips stale content after resizing from wide to narrow", async () => {
		await act(async () => {
			testSetup = await testRender(<AppRouter />, { width: 100, height: 24 });
		});
		await act(async () => {
			await testSetup?.renderOnce();
		});

		await act(async () => {
			testSetup?.resize(36, 24);
			await testSetup?.flush();
		});

		if (!testSetup) throw new Error("Test renderer was not initialized");

		const frame = testSetup.captureCharFrame();
		const rows = frame.endsWith("\n")
			? frame.slice(0, -1).split("\n")
			: frame.split("\n");

		expect(rows).toHaveLength(24);
		expect(rows.every((row) => row.length <= 36)).toBe(true);
	});
});
