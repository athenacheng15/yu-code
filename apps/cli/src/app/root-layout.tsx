import { TextAttributes } from "@opentui/core";
import { Outlet, useLocation } from "react-router";
import { navigationRoutes } from "./routes";

export function RootLayout() {
	const location = useLocation();

	return (
		<box
			flexDirection="column"
			width="100%"
			height="100%"
			overflow="hidden"
		>
			<box
				flexDirection="row"
				justifyContent="space-between"
				width="100%"
				flexShrink={0}
				overflow="hidden"
				paddingLeft={1}
				paddingRight={1}
				borderStyle="single"
				border={["bottom"]}
			>
				<text attributes={TextAttributes.BOLD}>yu-code</text>
				<text attributes={TextAttributes.DIM}>Current: {location.pathname}</text>
			</box>

			<box
				flexGrow={1}
				flexShrink={1}
				width="100%"
				overflow="hidden"
				padding={1}
			>
				<Outlet />
			</box>

			<box
				flexDirection="row"
				justifyContent="center"
				gap={2}
				width="100%"
				flexShrink={0}
				overflow="hidden"
				paddingTop={1}
				paddingBottom={1}
				borderStyle="single"
				border={["top"]}
			>
				{navigationRoutes.map((route) => (
					<text
						key={route.path}
						attributes={
							location.pathname === route.path
								? TextAttributes.BOLD | TextAttributes.UNDERLINE
								: TextAttributes.NONE
						}
					>
						[{route.command}] {route.label}
					</text>
				))}
			</box>
		</box>
	);
}
