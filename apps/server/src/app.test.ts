import { describe, expect, test } from "bun:test";
import { app } from "./app";

describe("server", () => {
	test("does not expose the old root endpoint", async () => {
		const response = await app.request("/");

		expect(response.status).toBe(404);
	});

	test("does not expose the old health endpoint", async () => {
		const response = await app.request("/health");

		expect(response.status).toBe(404);
	});

	test("rejects invalid message payloads", async () => {
		const response = await app.request("/chat/session-1", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ messages: [] }),
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: expect.any(String),
		});
	});

	test("rejects invalid chat modes before accessing the database", async () => {
		const response = await app.request("/chat/session-1", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				mode: "review",
				message: {
					id: "message-1",
					role: "user",
					parts: [{ type: "text", text: "Hello" }],
				},
			}),
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: expect.any(String),
		});
	});

	test("rejects invalid non-user and non-assistant session messages", async () => {
		const response = await app.request("/chat/session-1", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				message: {
					id: "message-1",
					role: "system",
					parts: [{ type: "text", text: "Not a user message" }],
				},
			}),
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: "The latest message must have the user or assistant role",
		});
	});

	test("rejects empty session prompts before accessing the database", async () => {
		const response = await app.request("/sessions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ prompt: "   " }),
		});

		expect(response.status).toBe(400);
	});
});
