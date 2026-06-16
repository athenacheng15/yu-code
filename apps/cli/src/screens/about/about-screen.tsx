import { TextAttributes } from "@opentui/core";

export function AboutScreen() {
	return (
		<box flexDirection="column" flexGrow={1}>
			<text fg="#90ffc7" attributes={TextAttributes.BOLD} marginBottom={1}>
				About
			</text>
			<text>
				yu-code is a terminal workspace for building with Bun, Hono, and OpenTUI.
			</text>
		</box>
	);
}
