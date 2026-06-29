import { ChatMode } from "@yu-code/database";
import { z } from "zod";

export const sessionIdSchema = z.string().min(1).max(64);
export const chatModeSchema = z.enum(ChatMode);

export const createSessionRequestSchema = z.object({
	prompt: z.string().trim().min(1).max(20_000),
});

export const sessionParamsSchema = z.object({
	id: sessionIdSchema,
});

export const chatParamsSchema = z.object({
	sessionId: sessionIdSchema,
});

export const createMessageRequestSchema = z.object({
	message: z.unknown(),
	mode: chatModeSchema.default(ChatMode.build),
});

export const createSessionResponseEnvelopeSchema = z.object({
	id: sessionIdSchema,
});

export const sessionMessagesResponseEnvelopeSchema = z.object({
	messages: z.array(z.unknown()),
});

export type CreateSessionResponse = {
	id: string;
};

export type SessionMessagesResponse = {
	messages: unknown[];
};
