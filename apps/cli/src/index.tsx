import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { AppRouter } from "./app/router";

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
});

createRoot(renderer).render(<AppRouter />);
