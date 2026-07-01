import { TextAttributes } from "@opentui/core";
import type { chatCommands } from "../../lib/chat-commands";

type CommandPopoverCommand = (typeof chatCommands)[number];

type CommandPopoverProps = {
	commands: readonly CommandPopoverCommand[];
	activeIndex: number;
	top: number;
};

export function CommandPopover({
	commands,
	activeIndex,
	top,
}: CommandPopoverProps) {
	if (commands.length === 0) {
		return null;
	}

	return (
		<box
			position="absolute"
			top={top}
			left={0}
			zIndex={10}
			flexDirection="column"
			width="100%"
			height={commands.length + 2}
			backgroundColor="#111111"
			paddingX={1}
			paddingY={1}
		>
			{commands.map((command, index) => {
				const isActive = index === activeIndex;
				const foreground = isActive ? "#9ff3e8" : "#d8d8ee";
				const descriptionColor = isActive ? "#9ff3e8" : "#8b8fa3";

				return (
					<box
						key={command.name}
						flexDirection="row"
						width="100%"
						backgroundColor={isActive ? "#2f2f2f" : "#111111"}
					>
						<box width={20} flexShrink={0}>
							<text
								fg={foreground}
								attributes={
									isActive ? TextAttributes.BOLD : TextAttributes.NONE
								}
							>
								{command.token}
							</text>
						</box>
						<text fg={descriptionColor}>{command.description}</text>
					</box>
				);
			})}
		</box>
	);
}
