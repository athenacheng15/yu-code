import { TextAttributes } from "@opentui/core";

export function SettingsScreen() {
	return (
		<box flexDirection="column" flexGrow={1}>
			<text fg="#90ffc7" attributes={TextAttributes.BOLD} marginBottom={1}>
				Settings
			</text>
			<box flexDirection="column" marginBottom={1}>
				<text>Theme: Terminal</text>
				<text>Model: Not configured</text>
			</box>
			<text attributes={TextAttributes.DIM}>
				Settings are placeholders while the app shell takes shape.
			</text>
		</box>
	);
}
