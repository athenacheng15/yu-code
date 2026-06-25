import { describe, expect, test } from "bun:test";
import { resolveWorkspacePath, WorkspacePathError } from "./path-guard";

describe("path guard", () => {
	test("resolves paths inside the invocation cwd", async () => {
		const resolved = await resolveWorkspacePath("package.json", {
			mustExist: true,
		});

		expect(resolved.relativePath).toBe("package.json");
		expect(resolved.absolutePath.endsWith("package.json")).toBe(true);
	});

	test("rejects absolute paths", async () => {
		await expect(resolveWorkspacePath("/tmp")).rejects.toBeInstanceOf(
			WorkspacePathError,
		);
	});

	test("rejects relative escapes", async () => {
		await expect(resolveWorkspacePath("..")).rejects.toBeInstanceOf(
			WorkspacePathError,
		);
	});
});
