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

	test("rejects invalid chat message payloads", async () => {
		const response = await app.request("/chat", {
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
});
