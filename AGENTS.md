# Repository Guidelines

## Project Structure & Module Organization
- The App Router lives under `app/`; co-locate route-specific helpers or API handlers beside their segment.
- Shared UI primitives belong in `components/` with PascalCase filenames; feature-scoped utilities stay near their consumer, while cross-cutting logic sits in `lib/`.
- Place hooks under `hooks/`, Zustand stores in `stores/`, and markdown or localized content inside `blogs/`, `docs/`, `content/`, `data/`, `emails/`, or `i18n/`. Static assets and global styles stay in `public/` and `styles/`.

## Build, Test, and Development Commands
- `pnpm install` syncs dependencies; run after pulling new packages.
- `pnpm dev` starts the Next.js App Router at http://localhost:3000 for local QA.
- `pnpm build` compiles production bundles; follow with `pnpm start` for smoke tests.
- Guard performance budgets with `pnpm analyze`; enforce lint rules via `pnpm lint`.
- Database workflows rely on Supabase helpers: `pnpm db:push`, `db:pull`, `db:new-migration`, `db:reset`, `db:gen-types`, and the wrapper `pnpm db:update`.

## Coding Style & Naming Conventions
- TypeScript runs in `strict` mode; give explicit types for props, APIs, and Supabase payloads.
- Favor `@/` imports over deep relative paths; Tailwind classes stay inline until repetition justifies a shared component.
- Components, providers, and hooks follow `ComponentName.tsx`, `ProviderName.tsx`, and `useName.ts`; utilities default to kebab-case filenames.

## Testing Guidelines
- Vitest with React Testing Library powers unit coverage. Mirror source filenames (`Component.test.tsx`) or place suites in `__tests__/`.
- Run targeted suites with `npx vitest run`; add a `pnpm test` script before automation flows.
- Document any coverage gaps when filing PRs, prioritizing mission-critical routes under `app/` and brittle utilities in `lib/`.

## Commit & Pull Request Guidelines
- Write short, imperative commits (e.g., `fix: guard empty session`); prefixes such as `feat`, `fix`, `chore`, and `docs(scope): summary` match existing history.
- Pull requests must link issues, describe user-facing changes, attach screenshots for UI updates, and flag Supabase or environment impacts.
- List verification steps (commands run, migrations applied) and regenerate Supabase types before requesting review.

## Security & Configuration Tips
- Start from `.env.example`, copy to `.env.local`, and keep secrets out of version control.
- Prefix browser-safe settings with `NEXT_PUBLIC_`; keep Supabase service keys server-side.
- After schema changes, run `pnpm db:update` to push migrations, refresh generated types, and avoid drift.
