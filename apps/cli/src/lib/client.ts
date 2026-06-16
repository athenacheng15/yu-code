import { hc } from "hono/client";
import type { AppType } from "@yu-code/server/app";

const serverUrl = Bun.env.SERVER_URL ?? "http://localhost:3000";

export const client = hc<AppType>(serverUrl);
