import { realpath } from "node:fs/promises";
import path from "node:path";

export class WorkspacePathError extends Error {}

export type WorkspacePath = {
	absolutePath: string;
	relativePath: string;
};

export const WORKSPACE_ROOT = process.cwd();

function isPathInsideRoot(candidate: string, root: string) {
	const relative = path.relative(root, candidate);
	return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function toDisplayPath(absolutePath: string) {
	const relativePath = path.relative(WORKSPACE_ROOT, absolutePath);
	return relativePath === "" ? "." : relativePath;
}

export function getWorkspaceRoot() {
	return WORKSPACE_ROOT;
}

export function describeWorkspaceRoot() {
	return toDisplayPath(WORKSPACE_ROOT);
}

export async function resolveWithinWorkspace(
	requestedPath = ".",
	options: { mustExist?: boolean } = {},
): Promise<WorkspacePath> {
	if (path.isAbsolute(requestedPath)) {
		throw new WorkspacePathError("Use a path relative to the workspace root.");
	}

	const absolutePath = path.resolve(WORKSPACE_ROOT, requestedPath);
	if (!isPathInsideRoot(absolutePath, WORKSPACE_ROOT)) {
		throw new WorkspacePathError("Path escapes the workspace root.");
	}

	try {
		const realRoot = await realpath(WORKSPACE_ROOT);
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
		const realRoot = await realpath(WORKSPACE_ROOT);
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

export const resolveWorkspacePath = resolveWithinWorkspace;
