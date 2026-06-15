import { Hono } from "hono";
import { createWelcomeMessage, productName } from "@yu-code/shared";

const app = new Hono();

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
		});
	});

export type AppType = typeof routes;

const port = Number(Bun.env.PORT ?? 3000);

export { app };

export default {
	port,
	fetch: app.fetch,
};
