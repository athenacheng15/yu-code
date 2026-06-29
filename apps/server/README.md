# Server database setup

The database package owns the Prisma schema, generated client, and stable
database exports. The server owns the database connection. The CLI consumes
shared API contracts and Hono RPC types; it does not import Prisma types.

1. Create a managed Prisma Postgres database in Prisma Console.
2. Set `DATABASE_URL` in `apps/server/.env` for server runtime.
3. Set the same `DATABASE_URL` in `packages/database/.env` for Prisma schema
   commands. Use the database's direct TCP connection string, such as
   `postgres://...:5432/postgres?sslmode=verify-full`, rather than a
   `prisma+postgres://` URL.
4. Push the schema to the development database and generate the client:

   ```bash
   bun --filter @yu-code/database db:push
   bun --filter @yu-code/database db:generate
   ```

For schema development, edit `packages/database/prisma/schema.prisma`, then run
`bun --filter @yu-code/database db:push` and
`bun --filter @yu-code/database db:generate`. This project intentionally uses
`prisma db push` for development and does not maintain migration files.
