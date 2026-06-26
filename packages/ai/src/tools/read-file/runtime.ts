import { readFile as readTextFile, stat } from "node:fs/promises";
import { resolveWithinWorkspace } from "../../workspace.js";
import type { ReadFileInput, ReadFileOutput } from "./schema.js";

export async function readFile(input: ReadFileInput): Promise<ReadFileOutput> {
	const file = await resolveWithinWorkspace(input.path, { mustExist: true });
	const fileStats = await stat(file.absolutePath);

	if (!fileStats.isFile()) {
		throw new Error(`${file.relativePath} is not a file.`);
	}

	return {
		path: file.relativePath,
		content: await readTextFile(file.absolutePath, "utf8"),
	};
}
