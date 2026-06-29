export const codingModelProvider = "Anthropic";

export const codingModelId =
	Bun.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5";
