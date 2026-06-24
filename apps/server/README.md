# Server database setup

The server owns the Prisma schema, generated client, and database connection.
The CLI consumes shared API contracts and Hono RPC types; it does not import
Prisma types.

1. Create a managed Prisma Postgres database in Prisma Console.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to the database's direct
   TCP connection string. Use the `postgres://...:5432/postgres?sslmode=verify-full`
   URL rather than a `prisma+postgres://` URL.
3. Push the schema to the development database and generate the client:

   ```bash
   bun run db:push
   bun run db:generate
   ```

For schema development, edit `prisma/schema.prisma`, then run
`bun run db:push` and `bun run db:generate`. This project intentionally uses
`prisma db push` for development and does not maintain migration files.
