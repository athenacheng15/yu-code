# Repository Guidelines

## Project Structure & Module Organization

This is a Bun workspace monorepo. Runnable applications live in `apps/*`; future shared libraries should live in `packages/*`.

- `apps/server`: Bun-served Hono API. Source and tests are in `apps/server/src`.
- `apps/cli`: OpenTUI React CLI. Keep screens under `src/screens/<screen-name>` and reusable UI under `src/components/<domain>`.
- `packages`: reserved for shared workspace packages.
- `tsconfig.base.json`: shared TypeScript compiler options.
- `tsconfig.json`: root project references.

Generated files such as `dist/`, `node_modules/`, and `*.tsbuildinfo` should stay untracked.

## Build, Test, and Development Commands

Use Bun as both runtime and package manager.

```bash
bun install                 # install workspace dependencies
bun run dev:server          # run the Hono server in watch mode
bun run start:server        # run the Hono server
bun run dev:cli             # run the OpenTUI CLI in watch mode
bun run start:cli           # run the OpenTUI CLI
bun --filter @yu-code/server db:push # sync the Prisma schema to the dev DB
bun run --cwd apps/cli build # bundle the CLI entry to apps/cli/dist
bun test                    # run all Bun tests
bun run typecheck           # run TypeScript project references
```

Set `PORT=3001` or another value when port `3000` is already in use.

## Coding Style & Naming Conventions

Write TypeScript using ES modules. Keep app code under `src/`, use `.ts` for server files and `.tsx` for React/OpenTUI UI files. Use kebab-case file and folder names, for example `home-screen.tsx`, `ascii-logo.tsx`, and `prompt-textarea.tsx`; export PascalCase React components from those files.

Separate screen-level composition from reusable components. A screen should assemble the page or route state, while components should remain focused UI pieces grouped by domain. Prefer named exports for reusable app objects, such as the Hono `app`, and reserve default exports for framework entry shapes when required by Bun.

Follow the existing style in touched files. Keep imports explicit and use `.js` extensions for relative imports when required by `NodeNext`.

Avoid immediately invoked async function expressions such as `void (async () => { ... })()`. Define a named local async function and invoke it normally instead, for example `async function loadData() { ... }` followed by `void loadData()`.

## Hono Notes

Use the Hono skill first for API work; inspect installed `node_modules` types only when the skill docs do not answer an API detail.

Whenever possible, use Hono RPC for API requests between the server and CLI apps. Keep the server route chain typed with `AppType`, expose it from `@yu-code/server/app`, and consume it from the CLI through `hc<AppType>()` instead of hand-written `fetch` calls.

When a library needs a URL string for a Hono endpoint, derive it from the RPC client with `client.route.$url().toString()` rather than manually concatenating paths such as `${serverUrl}/route`.

Prefer Hono's zod validator (`@hono/zod-validator`). Read validated typed input via `c.req.valid('json')`.

## Validation Notes

Use Zod schemas to parse or validate object-shaped data at app boundaries, including client-side route state, persisted data, API payloads, and other unknown inputs. Avoid type assertions such as `location.state as SomeType` when a runtime schema can validate the shape instead.

## OpenTUI Notes

Use the OpenTUI skill first for TUI work; inspect installed `node_modules` types only when the skill docs do not answer an API detail.

OpenTUI React maps JSX to terminal renderables, not DOM elements. Its `<textarea>` is uncontrolled in the current version: do not model it as `value` plus `useState`. For submit-only behavior, keep a `ref` to `TextareaRenderable` and read `ref.current?.plainText` in `onSubmit`. Use `onContentChange` only when live mirrored state is actually needed.

## Testing Guidelines

Tests use Bun’s built-in test runner. Place tests near the code they cover with `*.test.ts` naming, for example `apps/server/src/app.test.ts`. Prefer testing Hono routes with `app.request()` so tests do not bind network ports.

Run `bun test` and before submitting changes.

## Commit & Pull Request Guidelines

Use the same format as the latest commits: short Conventional Commit-style subjects in the form `type: imperative summary`. Keep the summary lowercase and concise, for example `feat: add cli routing demo`, `fix: update cli script`, or `chore: refresh docs`.

Pull requests should include a short description, commands run, and any relevant issue links. For CLI or TUI changes, include a brief note about manual terminal testing.

## Security & Configuration Tips

Do not commit secrets or local `.env` files. Bun automatically loads environment files, so keep runtime configuration in environment variables such as `PORT`.
