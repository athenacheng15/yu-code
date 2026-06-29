import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@yu-code/database";

let database: PrismaClient | undefined;

export function getDatabase() {
	const connectionString = Bun.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL is required");
	}

	database ??= new PrismaClient({
		adapter: new PrismaPg({ connectionString }),
	});

	return database;
}
