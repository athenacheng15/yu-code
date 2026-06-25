import { describe, expect, test } from "bun:test";
import {
	listFilesInputSchema,
	readFileInputSchema,
	writeFileInputSchema,
	writeFileOutputSchema,
} from "./index";

describe("tool schemas", () => {
	test("accepts list file input defaults", () => {
		expect(listFilesInputSchema.parse({})).toEqual({});
		expect(listFilesInputSchema.parse({ path: "apps", maxDepth: 3 })).toEqual({
			path: "apps",
			maxDepth: 3,
		});
	});

	test("bounds list depth", () => {
		expect(() => listFilesInputSchema.parse({ maxDepth: 0 })).toThrow();
		expect(() => listFilesInputSchema.parse({ maxDepth: 6 })).toThrow();
	});

	test("requires non-empty file paths", () => {
		expect(() => readFileInputSchema.parse({ path: " " })).toThrow();
		expect(() => writeFileInputSchema.parse({ path: "", content: "" })).toThrow();
	});

	test("validates write output", () => {
		expect(
			writeFileOutputSchema.parse({ path: "readme.md", bytesWritten: 12 }),
		).toEqual({ path: "readme.md", bytesWritten: 12 });
		expect(() =>
			writeFileOutputSchema.parse({ path: "readme.md", bytesWritten: -1 }),
		).toThrow();
	});
});
