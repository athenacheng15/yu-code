import { Hono } from "hono";
import { chatRoutes } from "./routes/chat";
import { sessionRoutes } from "./routes/sessions";

export const app = new Hono();

const routes = app.route("/", sessionRoutes).route("/", chatRoutes);

export type AppType = typeof routes;
