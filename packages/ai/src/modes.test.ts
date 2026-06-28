import { describe, expect, test } from "bun:test";
import {
	defaultModeId,
	getMode,
	getNextModeId,
	isToolAllowedInMode,
	modeSchema,
	modes,
} from "./modes";

describe("modes", () => {
	test("defines stable build and plan mode order", () => {
		expect(modes.map((mode) => mode.id)).toEqual(["build", "plan"]);
		expect(defaultModeId).toBe("build");
		expect(getNextModeId("build")).toBe("plan");
		expect(getNextModeId("plan")).toBe("build");
	});

	test("build mode exposes all current tools", () => {
		expect(getMode("build").toolNames).toEqual([
			"listFiles",
			"readFile",
			"writeFile",
			"editFile",
			"grepFiles",
		]);
	});

	test("plan mode exposes only read-only tools", () => {
		expect(getMode("plan").toolNames).toEqual([
			"listFiles",
			"readFile",
			"grepFiles",
		]);
		expect(isToolAllowedInMode("readFile", "plan")).toBe(true);
		expect(isToolAllowedInMode("writeFile", "plan")).toBe(false);
		expect(isToolAllowedInMode("editFile", "plan")).toBe(false);
	});

	test("rejects invalid mode ids", () => {
		expect(modeSchema.safeParse("review").success).toBe(false);
	});
});
