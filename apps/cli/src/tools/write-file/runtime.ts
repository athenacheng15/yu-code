import { mkdir, writeFile as writeTextFile } from "node:fs/promises";
import path from "node:path";
import type { WriteFileInput, WriteFileOutput } from "@yu-code/tools";
import { resolveWorkspacePath } from "../path-guard";

export async function writeFile(input: WriteFileInput): Promise<WriteFileOutput> {
	const file = await resolveWorkspacePath(input.path);

	await mkdir(path.dirname(file.absolutePath), { recursive: true });
	await writeTextFile(file.absolutePath, input.content, "utf8");

	return {
		path: file.relativePath,
		bytesWritten: new TextEncoder().encode(input.content).byteLength,
	};
}
