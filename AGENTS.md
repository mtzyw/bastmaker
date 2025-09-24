# Repository Guidelines

## Project Structure & Module Organization
Routes, layouts, and API handlers live in `app/`; keep segment-level helpers beside the route. Shared UI primitives belong in `components/` with PascalCase filenames, while feature-only utilities can sit next to their consumer. Cross-cutting logic sits in `lib/`, custom hooks in `hooks/`, and Zustand stores in `stores/`. Markdown-driven copy ships from `blogs/`, `docs/`, `content/`, `data/`, and `emails/`; localized assets live in `i18n/`. Static assets and global styles stay in `public/` and `styles/`. Automation workflows reside in `actions/` and `text-to-image-generator/`. Version every Supabase change under `supabase/` before deploying shared environments.

## Build, Test, and Development Commands
Run `pnpm install` to sync dependencies. Use `pnpm dev` for the App Router preview at `http://localhost:3000`. `pnpm build` compiles the production bundle, and `pnpm start` smoke-tests it locally. Guard performance budgets with `pnpm analyze`, and enforce lint rules via `pnpm lint`. Database workflows rely on Supabase helpers: `pnpm db:push`, `db:pull`, `db:new-migration`, `db:reset`, `db:gen-types`, and the wrapper `pnpm db:update`.

## Coding Style & Naming Conventions
TypeScript runs in `strict` mode—public APIs, React props, and Supabase payloads need explicit types. Components, providers, and hooks follow `ComponentName.tsx`, `ProviderName.tsx`, and `useName.ts`; utilities default to kebab-case. Prefer the `@/` alias instead of long relative paths. Tailwind classes stay inline; extract repeated clusters into shared components or config tokens. Resolve `react-hooks/exhaustive-deps` warnings immediately, especially around Supabase effects.

## Testing Guidelines
Vitest with React Testing Library drives unit coverage. Co-locate specs in `__tests__/` or mirror the source filename (`Component.test.tsx`). Run targeted suites with `npx vitest run` (add a `pnpm test` script when automation is needed) and record gaps in pull request notes. Prioritize mission-critical flows under `app/` routes and regression-prone utilities in `lib/`.

## Commit & Pull Request Guidelines
Write short, imperative commits; the history mixes English and Chinese, so clarity beats strict Conventional Commit formatting. Preferred prefixes include `feat`, `fix`, `chore`, and `docs(scope): summary`. Pull requests should link issues, outline user-facing changes, attach relevant UI screenshots, flag environment or Supabase impacts, and list verification steps. Regenerate Supabase types before requesting review when schema changes land.

## Security & Configuration Tips
Start from `.env.example` and populate `.env.local`; never commit real credentials. Prefix browser-safe settings with `NEXT_PUBLIC_`, keeping Supabase service keys server-side. After editing the schema, run `pnpm db:update` to push migrations and refresh generated types. Avoid logging sensitive payloads in analytics, server logs, or shared channels.
