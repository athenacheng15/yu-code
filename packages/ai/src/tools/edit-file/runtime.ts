import { readFile as readTextFile, stat, writeFile as writeTextFile } from "node:fs/promises";
import { resolveWithinWorkspace } from "../../workspace.js";
import type { EditFileInput, EditFileOutput } from "./schema.js";

export async function editFile(input: EditFileInput): Promise<EditFileOutput> {
	const file = await resolveWithinWorkspace(input.path, { mustExist: true });
	const fileStats = await stat(file.absolutePath);

	if (!fileStats.isFile()) {
		throw new Error(`${file.relativePath} is not a file.`);
	}

	const content = await readTextFile(file.absolutePath, "utf8");
	const replacements = content.split(input.search).length - 1;

	if (replacements === 0) {
		throw new Error(`Text not found in ${file.relativePath}.`);
	}

	const nextContent = content.replaceAll(input.search, input.replacement);
	await writeTextFile(file.absolutePath, nextContent, "utf8");

	return {
		path: file.relativePath,
		replacements,
		bytesWritten: new TextEncoder().encode(nextContent).byteLength,
	};
}
