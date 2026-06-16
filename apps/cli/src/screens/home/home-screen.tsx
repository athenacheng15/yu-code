import { AsciiLogo } from "../../components/home/ascii-logo";
import { PromptTextarea } from "../../components/home/prompt-textarea";

export function HomeScreen() {
  return (
    <box flexDirection="column" padding={1}>
      <AsciiLogo />
      <PromptTextarea />
    </box>
  );
}
