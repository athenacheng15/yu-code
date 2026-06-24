export const productName = "yu-code";

export * from "./contracts/chat.js";
export * from "./contracts/chat-tools.js";

export function createWelcomeMessage(target: "server" | "cli") {
  return `Welcome to ${productName} ${target}`;
}
