export const productName = "yu-code";

export function createWelcomeMessage(target: "server" | "cli") {
  return `Welcome to ${productName} ${target}`;
}
