import { mkdir, writeFile as writeTextFile } from "node:fs/promises";
import path from "node:path";
import { resolveWithinWorkspace } from "../../workspace.js";
import type { WriteFileInput, WriteFileOutput } from "./schema.js";

export async function writeFile(input: WriteFileInput): Promise<WriteFileOutput> {
	const file = await resolveWithinWorkspace(input.path);

	await mkdir(path.dirname(file.absolutePath), { recursive: true });
	await writeTextFile(file.absolutePath, input.content, "utf8");

	return {
		path: file.relativePath,
		bytesWritten: new TextEncoder().encode(input.content).byteLength,
	};
}
