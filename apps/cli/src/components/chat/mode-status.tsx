import {
	codingModelId,
	codingModelProvider,
	type ModeId,
} from "@yu-code/ai/client";
import { getModeColor } from "./mode-colors";

type ModeStatusProps = {
	modeId: ModeId;
	modeLabel: string;
};

export function ModeStatus({ modeId, modeLabel }: ModeStatusProps) {
	return (
		<text>
			<span fg={getModeColor(modeId)}>{modeLabel}</span>
			<span fg="#808080">{" · "}</span>
			<span fg="#ffffff">{codingModelId}</span>
			<span fg="#808080">{` ${codingModelProvider}`}</span>
		</text>
	);
}
