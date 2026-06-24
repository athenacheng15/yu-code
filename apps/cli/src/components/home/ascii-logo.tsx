import { productName } from "@yu-code/shared";

export function AsciiLogo() {
	return (
		<box width="100%" overflow="hidden" flexShrink={0}>
			<ascii-font
				text={productName.toUpperCase()}
				font="block"
				color="#90ffc7"
			/>
		</box>
	);
}
