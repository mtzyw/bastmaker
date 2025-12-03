# Repository Guidelines

## Project Structure & Module Organization
The App Router lives in `app/`; colocate UI, server actions, and route handlers within each segment (e.g., `app/dashboard/feature`). Feature bundles such as `ai-sidebar/`, `ai-model-dropdown/`, and `text-to-image-generator/` own UI and hooks. Share cross-cutting primitives via `components/`, `hooks/`, `stores/`, and utility helpers in `lib/`. Static assets belong in `public/`, while docs live in `blogs/`, `content/`, and `docs/`; shared data stays in `data/` and `config/`. Supabase migrations, types, and SQL fixtures stay in `supabase/` and `lib/supabase/types.ts`.

## Build, Test, and Development Commands
- `pnpm install` syncs dependencies with the checked-in lockfile.
- `pnpm dev` launches the dev server at `http://localhost:3000`.
- `pnpm build` followed by `pnpm start` validates the production bundle.
- `pnpm lint` or `pnpm lint --fix` enforces ESLint plus Tailwind conventions.
- `pnpm analyze` compiles with `ANALYZE=true` for bundle inspection.
- `pnpm db:new-migration "add-feature"` then `pnpm db:update` manage Supabase schema and refresh generated types.

## Coding Style & Naming Conventions
Ship strict TypeScript: annotate props, async returns, and Supabase payloads. Prefer the `@/` alias instead of long relatives, and keep Tailwind classes inline unless variants warrant `clsx` or `cva`. Name React components `FeaturePanel.tsx`, hooks `useFeature.ts`, stores `useFeatureStore.ts`, utilities `kebab-case.ts`, and tests `Component.test.tsx`. ESLint enforces 2-space indentation, trailing commas, and import sorting; run `pnpm lint --fix` before pushing.

## Testing Guidelines
Vitest with React Testing Library covers components and stores. Mirror the source tree with colocated `Component.test.tsx` files or `__tests__/` folders. Run `npx vitest run` for the full suite, or target modules like `npx vitest run components/Button.test.tsx`. Mock Supabase via `lib/` fixtures, regenerate types after schema changes, and gate any new server action, adapter, or store mutation behind a regression test.

## Commit & Pull Request Guidelines
Write short, imperative commit messages prefixed with scope (e.g., `feat: add dashboard filters`). Keep each commit focused and include Supabase artifacts whenever schema changes occur. Pull requests must link issues, summarize user-visible impact, call out env or config changes, attach UI screenshots for visual tweaks, and list verification steps (`pnpm build`, `pnpm lint`, targeted Vitest commands) so reviewers can replay them.

## Security & Configuration Tips
Duplicate `.env.example` to `.env.local`, never commit secrets, and expose browser-safe keys with the `NEXT_PUBLIC_` prefix. Prefer `config/` feature toggles over one-off conditionals. After updating Supabase, run `pnpm db:update`, review `lib/supabase/types.ts`, and include migration files in the PR. Rotate Supabase API keys regularly and scrub logs before sharing debug output.
