import { describe, expect, test } from "bun:test";
import { app } from "./app";

describe("server", () => {
  test("responds to health checks", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      timestamp: expect.any(String),
    });
  });
});
