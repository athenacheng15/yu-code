import { Hono } from "hono";
import { createWelcomeMessage, productName } from "@yu-code/shared";

export const app = new Hono();

const routes = app
	.get("/", (c) => {
		return c.json({
			name: productName,
			message: createWelcomeMessage("server"),
		});
	})
	.get("/health", (c) => {
		return c.json({
			ok: true,
			timestamp: new Date().toISOString(),
		});
	});

export type AppType = typeof routes;
