import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { createWelcomeMessage } from "@yu-code/shared";

function App() {
  return (
    <box padding={1}>
      <text>{createWelcomeMessage("cli")}</text>
    </box>
  );
}

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
});

createRoot(renderer).render(<App />);
