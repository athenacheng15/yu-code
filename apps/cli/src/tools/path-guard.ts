import { realpath } from "node:fs/promises";
import path from "node:path";

export class WorkspacePathError extends Error {}

export type WorkspacePath = {
	absolutePath: string;
	relativePath: string;
};

const workspaceRoot = process.cwd();

function isPathInsideRoot(candidate: string, root: string) {
	const relative = path.relative(root, candidate);
	return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function toDisplayPath(absolutePath: string) {
	const relativePath = path.relative(workspaceRoot, absolutePath);
	return relativePath === "" ? "." : relativePath;
}

export function getWorkspaceRoot() {
	return workspaceRoot;
}

export function describeWorkspaceRoot() {
	return toDisplayPath(workspaceRoot);
}

export async function resolveWorkspacePath(
	requestedPath = ".",
	options: { mustExist?: boolean } = {},
): Promise<WorkspacePath> {
	if (path.isAbsolute(requestedPath)) {
		throw new WorkspacePathError("Use a path relative to the workspace root.");
	}

	const absolutePath = path.resolve(workspaceRoot, requestedPath);
	if (!isPathInsideRoot(absolutePath, workspaceRoot)) {
		throw new WorkspacePathError("Path escapes the workspace root.");
	}

	try {
		const realRoot = await realpath(workspaceRoot);
		const realTarget = await realpath(absolutePath);

		if (!isPathInsideRoot(realTarget, realRoot)) {
			throw new WorkspacePathError("Path resolves outside the workspace root.");
		}

		return {
			absolutePath: realTarget,
			relativePath: toDisplayPath(realTarget),
		};
	} catch (error) {
		if (error instanceof WorkspacePathError) {
			throw error;
		}

		if (options.mustExist) {
			throw error;
		}

		const parentPath = path.dirname(absolutePath);
		const realRoot = await realpath(workspaceRoot);
		const realParent = await realpath(parentPath);

		if (!isPathInsideRoot(realParent, realRoot)) {
			throw new WorkspacePathError("Parent path resolves outside the workspace root.");
		}

		return {
			absolutePath,
			relativePath: toDisplayPath(absolutePath),
		};
	}
}
