import { readdir, readFile as readTextFile, stat } from "node:fs/promises";
import path from "node:path";
import { getWorkspaceRoot, resolveWithinWorkspace } from "../../workspace.js";
import type { GrepFilesInput, GrepFilesOutput } from "./schema.js";

const ignoredNames = new Set([".git", "node_modules", "dist"]);

export async function grepFiles(input: GrepFilesInput): Promise<GrepFilesOutput> {
	const maxResults = input.maxResults ?? 50;
	const root = await resolveWithinWorkspace(input.path, { mustExist: true });
	const rootStats = await stat(root.absolutePath);
	const matches: GrepFilesOutput["matches"] = [];
	const matcher = createMatcher(input);

	async function searchFile(absolutePath: string) {
		if (matches.length >= maxResults) return;

		const workspacePath = await resolveWithinWorkspace(
			path.relative(getWorkspaceRoot(), absolutePath),
			{ mustExist: true },
		);
		const content = await readTextFile(workspacePath.absolutePath, "utf8");
		const lines = content.split(/\r?\n/);

		for (const [index, text] of lines.entries()) {
			if (matcher(text)) {
				matches.push({
					path: workspacePath.relativePath,
					line: index + 1,
					text,
				});
			}

			if (matches.length >= maxResults) return;
		}
	}

	async function searchDirectory(directory: string) {
		if (matches.length >= maxResults) return;

		const children = await readdir(directory, { withFileTypes: true });
		children.sort((left, right) => left.name.localeCompare(right.name));

		for (const child of children) {
			if (ignoredNames.has(child.name)) continue;

			const childPath = path.join(directory, child.name);
			if (child.isDirectory()) {
				await searchDirectory(childPath);
			} else if (child.isFile()) {
				await searchFile(childPath);
			}

			if (matches.length >= maxResults) return;
		}
	}

	if (rootStats.isDirectory()) {
		await searchDirectory(root.absolutePath);
	} else if (rootStats.isFile()) {
		await searchFile(root.absolutePath);
	} else {
		throw new Error(`${root.relativePath} is not a searchable file or directory.`);
	}

	return {
		matches,
		truncated: matches.length >= maxResults,
	};
}

function createMatcher(input: GrepFilesInput) {
	if (!input.regex) {
		return (line: string) => line.includes(input.query);
	}

	const expression = new RegExp(input.query);
	return (line: string) => expression.test(line);
}
