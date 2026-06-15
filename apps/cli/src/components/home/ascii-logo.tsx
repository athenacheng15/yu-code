import { productName } from "@yu-code/shared";

export function AsciiLogo() {
	return (
		<box>
			<ascii-font
				text={productName.toUpperCase()}
				font="block"
				color="#90ffc7"
			/>
		</box>
	);
}
