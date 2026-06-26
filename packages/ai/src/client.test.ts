import { mkdir, rm, writeFile as writeTextFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { WORKSPACE_ROOT } from "./workspace";
import { handleToolCall } from "./client";

const fixtureRoot = `.ai-client-test-fixtures-${Date.now()}`;

async function cleanup() {
	await rm(path.join(WORKSPACE_ROOT, fixtureRoot), {
		force: true,
		recursive: true,
	});
}

afterEach(async () => {
	await cleanup();
});

type HandleToolCallOptions = Parameters<typeof handleToolCall>[0];

function createHarness() {
	const outputs: unknown[] = [];
	let pendingApproval: HandleToolCallOptions["pendingApprovalRef"]["current"] = null;

	const pendingApprovalRef: HandleToolCallOptions["pendingApprovalRef"] = {
		current: null,
	};

	return {
		outputs,
		pendingApprovalRef,
		addToolOutput: ((output: unknown) => {
			outputs.push(output);
		}) as HandleToolCallOptions["addToolOutput"],
		setPendingApproval: (approval: typeof pendingApproval) => {
			pendingApproval = approval;
		},
		get pendingApproval() {
			return pendingApproval;
		},
	};
}

describe("client tool dispatch", () => {
	test("runs automatic tools through the registry", async () => {
		const target = `${fixtureRoot}/read.txt`;
		await mkdir(path.join(WORKSPACE_ROOT, fixtureRoot), { recursive: true });
		await writeTextFile(path.join(WORKSPACE_ROOT, target), "hello", "utf8");
		const harness = createHarness();

		await handleToolCall({
			...harness,
			toolCall: {
				toolName: "readFile",
				toolCallId: "call-read",
				input: { path: target },
			},
		});

		expect(harness.outputs).toEqual([
			{
				tool: "readFile",
				toolCallId: "call-read",
				output: {
					path: target,
					content: "hello",
				},
			},
		]);
	});

	test("queues approval-required tools without running them", async () => {
		const harness = createHarness();

		await handleToolCall({
			...harness,
			toolCall: {
				toolName: "writeFile",
				toolCallId: "call-write",
				input: {
					path: `${fixtureRoot}/write.txt`,
					content: "hello",
					reason: "create fixture",
				},
			},
		});

		expect(harness.outputs).toEqual([]);
		expect(harness.pendingApproval).toEqual({
			toolName: "writeFile",
			toolCallId: "call-write",
			input: {
				path: `${fixtureRoot}/write.txt`,
				content: "hello",
				reason: "create fixture",
			},
		});
	});

	test("reports unknown tools as tool errors", async () => {
		const harness = createHarness();

		await handleToolCall({
			...harness,
			toolCall: {
				toolName: "unknownTool",
				toolCallId: "call-unknown",
				input: {},
			},
		});

		expect(harness.outputs).toEqual([
			{
				tool: "unknownTool",
				toolCallId: "call-unknown",
				state: "output-error",
				errorText: "Unknown tool: unknownTool",
			},
		]);
	});
});
