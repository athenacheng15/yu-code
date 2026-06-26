import { getToolName, type DynamicToolUIPart, type ToolUIPart } from "ai";

type ChatToolPart = ToolUIPart | DynamicToolUIPart;
type ToolState = ChatToolPart["state"];

type ChatMessageToolPartProps = {
	part: ChatToolPart;
};

const toolStateLabel = {
	"input-streaming": "input streaming",
	"input-available": "input available",
	"approval-requested": "approval requested",
	"approval-responded": "approval responded",
	"output-available": "output available",
	"output-error": "output error",
	"output-denied": "output denied",
} satisfies Record<ToolState, string>;

function formatToolValue(value: unknown) {
	if (value == null) return "";
	if (typeof value === "string") return value;

	try {
		const json = JSON.stringify(value);
		return json.length > 600 ? `${json.slice(0, 600)}...` : json;
	} catch {
		return String(value);
	}
}

export function ChatMessageToolPart({ part }: ChatMessageToolPartProps) {
	const name = getToolName(part);

	switch (part.state) {
		case "output-error":
			return (
				<text fg="#ef4444" width="100%">
					{`${name}: ${part.errorText}`}
				</text>
			);

		case "output-denied":
			return <text fg="#ef4444" width="100%">{`${name}: denied`}</text>;

		case "input-streaming":
		case "input-available":
		case "approval-requested":
		case "approval-responded":
		case "output-available": {
			const input = "input" in part ? formatToolValue(part.input) : "";
			const output = "output" in part ? formatToolValue(part.output) : "";
			const suffix = output || input;
			const label = toolStateLabel[part.state];

			return (
				<text fg="#6b7280" width="100%">
					{suffix ? `${name} (${label}): ${suffix}` : `${name} (${label})`}
				</text>
			);
		}
	}
}
