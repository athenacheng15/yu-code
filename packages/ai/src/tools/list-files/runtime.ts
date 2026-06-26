import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { getWorkspaceRoot, resolveWithinWorkspace } from "../../workspace.js";
import type { ListFilesInput, ListFilesOutput } from "./schema.js";

const ignoredNames = new Set([".git", "node_modules", "dist"]);

type Entry = ListFilesOutput["entries"][number];

export async function listFiles(input: ListFilesInput): Promise<ListFilesOutput> {
	const maxDepth = input.maxDepth ?? 2;
	const root = await resolveWithinWorkspace(input.path, { mustExist: true });
	const rootStats = await stat(root.absolutePath);

	if (!rootStats.isDirectory()) {
		throw new Error(`${root.relativePath} is not a directory.`);
	}

	const entries: Entry[] = [];

	async function visit(directory: string, depth: number) {
		if (depth > maxDepth) return;

		const children = await readdir(directory, { withFileTypes: true });
		children.sort((left, right) => left.name.localeCompare(right.name));

		for (const child of children) {
			if (ignoredNames.has(child.name)) continue;

			const childPath = path.join(directory, child.name);
			const childWorkspacePath = await resolveWithinWorkspace(
				path.relative(getWorkspaceRoot(), childPath),
				{ mustExist: true },
			);

			if (child.isDirectory()) {
				entries.push({ path: childWorkspacePath.relativePath, type: "directory" });
				await visit(childPath, depth + 1);
			} else if (child.isFile()) {
				entries.push({ path: childWorkspacePath.relativePath, type: "file" });
			}
		}
	}

	await visit(root.absolutePath, 1);

	return {
		root: root.relativePath,
		entries,
	};
}
