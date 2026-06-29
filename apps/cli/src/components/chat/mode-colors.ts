import type { ModeId } from "@yu-code/ai/client";

export function getModeColor(modeId: ModeId) {
	switch (modeId) {
		case "build":
			return "#48f254";
		case "plan":
			return "#59baf6";
	}
}
