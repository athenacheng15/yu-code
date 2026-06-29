import type { UIMessage } from "ai";
import { Prisma } from "@yu-code/database";
import { getDatabase } from "../lib/database";

const sessionTitleLength = 120;

export class SessionNotFoundError extends Error {
	constructor() {
		super("Session not found");
	}
}

export class DuplicateMessageError extends Error {
	constructor() {
		super("Message already exists");
	}
}

function hasPrismaCode(error: unknown): error is { code: string } {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof error.code === "string"
	);
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
	return JSON.parse(JSON.stringify(value));
}

export function deriveSessionTitle(prompt: string) {
	return prompt.trim().replaceAll(/\s+/g, " ").slice(0, sessionTitleLength);
}

export async function createSession(prompt: string) {
	return getDatabase().session.create({
		data: {
			title: deriveSessionTitle(prompt),
		},
	});
}

export async function loadSession(sessionId: string) {
	return getDatabase().session.findUnique({
		where: { id: sessionId },
		include: {
			messages: {
				orderBy: { sequence: "asc" },
			},
		},
	});
}

export function toUIMessageCandidate(message: {
	id: string;
	role: "system" | "user" | "assistant";
	parts: Prisma.JsonValue;
	metadata: Prisma.JsonValue | null;
}) {
	return {
		id: message.id,
		role: message.role,
		parts: message.parts,
		...(message.metadata === null ? {} : { metadata: message.metadata }),
	};
}

export async function appendMessage(sessionId: string, message: UIMessage) {
	try {
		return await getDatabase().$transaction(async (transaction) => {
			const session = await transaction.session.update({
				where: { id: sessionId },
				data: {
					nextMessageSequence: { increment: 1 },
				},
				select: { nextMessageSequence: true },
			});

			return transaction.message.create({
				data: {
					id: message.id,
					sessionId,
					role: message.role,
					parts: toInputJson(message.parts),
					...(message.metadata === undefined
						? {}
						: {
								metadata:
									message.metadata === null
										? Prisma.JsonNull
										: toInputJson(message.metadata),
							}),
					sequence: session.nextMessageSequence,
				},
			});
		});
	} catch (error) {
		if (hasPrismaCode(error)) {
			if (error.code === "P2025") throw new SessionNotFoundError();
			if (error.code === "P2002") throw new DuplicateMessageError();
		}

		throw error;
	}
}

export async function upsertMessage(sessionId: string, message: UIMessage) {
	const existing = await getDatabase().message.findUnique({
		where: { id: message.id },
		select: { sessionId: true },
	});

	if (existing) {
		if (existing.sessionId !== sessionId) {
			throw new DuplicateMessageError();
		}

		return getDatabase().message.update({
			where: { id: message.id },
			data: {
				role: message.role,
				parts: toInputJson(message.parts),
				metadata:
					message.metadata === undefined
						? undefined
						: message.metadata === null
							? Prisma.JsonNull
							: toInputJson(message.metadata),
			},
		});
	}

	return appendMessage(sessionId, message);
}
