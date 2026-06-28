import { describe, expect, test } from "bun:test";
import { createMessageRequestSchema } from "./chat";

describe("chat contract", () => {
	test("defaults chat mode to build", () => {
		expect(
			createMessageRequestSchema.parse({
				message: {
					id: "message-1",
					role: "user",
					parts: [{ type: "text", text: "hello" }],
				},
			}),
		).toEqual({
			mode: "build",
			message: {
				id: "message-1",
				role: "user",
				parts: [{ type: "text", text: "hello" }],
			},
		});
	});

	test("rejects invalid chat modes", () => {
		expect(() =>
			createMessageRequestSchema.parse({
				mode: "review",
				message: {
					id: "message-1",
					role: "user",
					parts: [{ type: "text", text: "hello" }],
				},
			}),
		).toThrow();
	});
});
