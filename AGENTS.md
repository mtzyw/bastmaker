# Repository Guidelines

## Project Structure & Module Organization
The App Router lives in `app/`; place UI, server actions, and route handlers inside each segment like `app/dashboard/feature`. Feature bundles such as `ai-sidebar/`, `ai-model-dropdown/`, and `text-to-image-generator/` encapsulate feature logic. Shared primitives belong in `components/`, hooks in `hooks/`, stores in `stores/`, and utilities in `lib/`. Static content lives in `public/`, `blogs/`, `content/`, and `docs/`, while Supabase migrations plus generated clients sit under `supabase/` and `lib/supabase/`.

## Build, Test, and Development Commands
- `pnpm install` ­– sync dependencies and lockfile.
- `pnpm dev` – start the Next.js dev server on `http://localhost:3000`.
- `pnpm build` / `pnpm start` – produce and preview the production bundle.
- `pnpm lint` (or `pnpm lint --fix`) – enforce ESLint + Tailwind style rules.
- `pnpm analyze` – compile with `ANALYZE=true` for bundle inspection.
- `pnpm db:new-migration "add-feature"` → `pnpm db:update` – manage Supabase schema and regenerate `lib/supabase/types.ts`.

## Coding Style & Naming Conventions
Use strict TypeScript everywhere; annotate props, async returns, and Supabase payloads. Prefer the `@/` alias to avoid brittle relative paths, and colocate server actions with their consuming components. Keep Tailwind classes inline, only introducing `clsx` or `cva` for variant-heavy UI. Follow the repo naming patterns: React components `FeaturePanel.tsx`, hooks `useFeature.ts`, stores `useFeatureStore.ts`, and utilities in `kebab-case.ts`. ESLint enforces 2-space indentation and trailing commas.

## Testing Guidelines
Vitest with React Testing Library backs the suite. Mirror the source tree with `Component.test.tsx` or colocated `__tests__/`. Run `npx vitest run` for the full suite, or target files such as `npx vitest run components/Button.test.tsx`. Mock Supabase clients with `lib/` fixtures, rerun `pnpm db:update` after schema changes, and add regression tests whenever you ship a server action, adapter, or store mutation.

## Commit & Pull Request Guidelines
Write short, imperative commit messages prefixed by scope (e.g., `feat: add dashboard filters`). Keep each commit focused on one change. Pull requests must link issues, outline user-facing impact, mention schema or env updates, attach UI screenshots when visual changes occur, and list verification steps such as `pnpm build`, `pnpm lint`, or targeted Vitest commands so reviewers can reproduce results.

## Security & Configuration Tips
Copy `.env.example` to `.env.local` and never commit secrets; browser-safe keys must be prefixed with `NEXT_PUBLIC_`. When Supabase schema shifts, run `pnpm db:update`, review `lib/supabase/types.ts`, and commit the diff with any migration files. Prefer feature flags or `config/` toggles over hard-coded switches, and rotate Supabase keys regularly through the dashboard.
