import { describe, expect, test } from "bun:test";
import { deriveSessionTitle, toUIMessageCandidate } from "./session-store";

describe("session store", () => {
	test("derives a normalized bounded title from the first prompt", () => {
		const title = deriveSessionTitle(`  Build\n\ta ${"long ".repeat(40)}project  `);

		expect(title).not.toMatch(/\s{2,}/);
		expect(title.length).toBe(120);
	});

	test("reconstructs an AI SDK UI message candidate", () => {
		expect(
			toUIMessageCandidate({
				id: "message-1",
				role: "assistant",
				parts: [
					{ type: "reasoning", text: "Checking" },
					{ type: "text", text: "Done" },
				],
				metadata: { model: "test-model" },
			}),
		).toEqual({
			id: "message-1",
			role: "assistant",
			parts: [
				{ type: "reasoning", text: "Checking" },
				{ type: "text", text: "Done" },
			],
			metadata: { model: "test-model" },
		});
	});
});
