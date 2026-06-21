import { Hono } from "hono";
import { chatRoutes } from "./routes/chat";

export const app = new Hono();

const routes = app.route("/", chatRoutes);

export type AppType = typeof routes;
