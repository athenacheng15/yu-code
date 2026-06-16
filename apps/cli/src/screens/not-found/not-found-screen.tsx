import { TextAttributes } from "@opentui/core";

export function NotFoundScreen() {
	return (
		<box alignItems="center" justifyContent="center" flexGrow={1}>
			<box flexDirection="column" alignItems="center">
				<text fg="#ff6b6b" attributes={TextAttributes.BOLD}>
					Screen Not Found
				</text>
				<text attributes={TextAttributes.DIM}>
					Press ctrl+1 to return home.
				</text>
			</box>
		</box>
	);
}
