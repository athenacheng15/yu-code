import { TextAttributes } from "@opentui/core";
import { useEffect, useState } from "react";
import { client } from "../../lib/client";

type HealthPayload = Record<string, unknown>;

function formatHealthValue(value: unknown) {
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (value === null) return "null";

	return JSON.stringify(value);
}

export function AboutScreen() {
	const [serverStatus, setServerStatus] = useState("checking");
	const [healthPayload, setHealthPayload] = useState<HealthPayload | null>(null);

	useEffect(() => {
		let isMounted = true;

		async function checkServer() {
			try {
				const response = await client.health.$get();
				const data = await response.json();

				if (isMounted) {
					setHealthPayload(data);
					setServerStatus(data.ok ? "online" : "unhealthy");
				}
			} catch {
				if (isMounted) {
					setHealthPayload(null);
					setServerStatus("offline");
				}
			}
		}

		void checkServer();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<box flexDirection="column" flexGrow={1}>
			<text fg="#90ffc7" attributes={TextAttributes.BOLD} marginBottom={1}>
				About
			</text>
			<text>
				yu-code is a terminal workspace for building with Bun, Hono, and OpenTUI.
			</text>
			<text attributes={TextAttributes.DIM} marginTop={1}>
				Server: {serverStatus}
			</text>
			{healthPayload ? (
				<box flexDirection="column" marginTop={1}>
					{Object.entries(healthPayload).map(([key, value]) => (
						<text key={key}>
							{key}: {formatHealthValue(value)}
						</text>
					))}
				</box>
			) : null}
		</box>
	);
}
