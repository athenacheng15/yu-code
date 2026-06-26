import { mkdir, rm, writeFile as writeTextFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { WORKSPACE_ROOT } from "../workspace";
import { editFile, grepFiles, readFile, writeFile } from "./runners";

const fixtureRoot = `.ai-test-fixtures-${Date.now()}`;

async function cleanup() {
	await rm(path.join(WORKSPACE_ROOT, fixtureRoot), {
		force: true,
		recursive: true,
	});
}

afterEach(async () => {
	await cleanup();
});

describe("tool runners", () => {
	test("writes and reads files inside the workspace", async () => {
		const target = `${fixtureRoot}/notes.txt`;
		await mkdir(path.join(WORKSPACE_ROOT, fixtureRoot), { recursive: true });

		await expect(
			writeFile({
				path: target,
				content: "hello\n",
			}),
		).resolves.toEqual({
			path: target,
			bytesWritten: 6,
		});

		await expect(readFile({ path: target })).resolves.toEqual({
			path: target,
			content: "hello\n",
		});
	});

	test("edits exact text in a file", async () => {
		const target = `${fixtureRoot}/edit.txt`;
		await mkdir(path.join(WORKSPACE_ROOT, fixtureRoot), { recursive: true });
		await writeTextFile(path.join(WORKSPACE_ROOT, target), "alpha beta beta", "utf8");

		const output = await editFile({
			path: target,
			search: "beta",
			replacement: "gamma",
		});

		expect(output).toEqual({
			path: target,
			replacements: 2,
			bytesWritten: 17,
		});
		await expect(readFile({ path: target })).resolves.toEqual({
			path: target,
			content: "alpha gamma gamma",
		});
	});

	test("greps files under a relative path", async () => {
		await mkdir(path.join(WORKSPACE_ROOT, fixtureRoot, "nested"), {
			recursive: true,
		});
		await writeTextFile(
			path.join(WORKSPACE_ROOT, fixtureRoot, "one.txt"),
			"first\nneedle here\n",
			"utf8",
		);
		await writeTextFile(
			path.join(WORKSPACE_ROOT, fixtureRoot, "nested", "two.txt"),
			"second needle\n",
			"utf8",
		);

		await expect(
			grepFiles({ path: fixtureRoot, query: "needle" }),
		).resolves.toEqual({
			matches: [
				{
					path: `${fixtureRoot}/nested/two.txt`,
					line: 1,
					text: "second needle",
				},
				{
					path: `${fixtureRoot}/one.txt`,
					line: 2,
					text: "needle here",
				},
			],
			truncated: false,
		});
	});
});
