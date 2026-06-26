export const productName = "yu-code";

export * from "./contracts/chat.js";

export function createWelcomeMessage(target: "server" | "cli") {
  return `Welcome to ${productName} ${target}`;
}
