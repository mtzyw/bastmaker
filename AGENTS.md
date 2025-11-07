# Repository Guidelines

## Project Structure & Module Organization
- App Router lives under `app/`; colocate UI, server actions, and handlers in each segment (e.g., `app/dashboard/feature`).
- Feature bundles (`ai-sidebar/`, `ai-model-dropdown/`, `text-to-image-generator/`) own their assets, while shared UI sits in `components/`, hooks in `hooks/`, stores in `stores/`, and utilities in `lib/`.
- Types live in `types/` or `interface/`, config and localization in `config/` and `i18n/`, static content in `public/`, `blogs/`, `content/`, `docs/`, and Supabase migrations plus generated types in `supabase/` and `lib/supabase/`.

## Build, Test, and Development Commands
- `pnpm install` keeps dependencies in sync.
- `pnpm dev` serves `http://localhost:3000`; `pnpm build` compiles production output and `pnpm start` previews it.
- `pnpm lint` enforces the ESLint + Tailwind rules (`pnpm lint --fix` for autofix) and `pnpm analyze` builds with `ANALYZE=true`.
- Database workflow: `pnpm db:new-migration "add-feature"` → `pnpm db:update` (push schema + regenerate `lib/supabase/types.ts`); run `pnpm db:login` / `pnpm db:link` when swapping Supabase projects.

## Coding Style & Naming Conventions
- Strict TypeScript is required; annotate props, async returns, and Supabase payloads.
- Prefer the `@/` alias over deep relatives and keep server actions next to their consuming component.
- Tailwind classes stay inline; bring `clsx` or `cva` only for conditional variants.
- Name components `FeaturePanel.tsx`, hooks `useFeature.ts`, utilities `kebab-case.ts`, and follow ESLint defaults (2-space indent, trailing commas).

## Testing Guidelines
- Vitest with React Testing Library powers coverage; mirror the source tree with `Component.test.tsx` files or colocated `__tests__/`.
- `npx vitest run` executes the suite, and `npx vitest run components/Button.test.tsx` targets a single spec.
- Mock Supabase clients with `lib/` fixtures, rerun `pnpm db:update` after schema tweaks, and add regression tests for each new server action or adapter.

## Commit & Pull Request Guidelines
- Write imperative, prefixed commit messages (`feat: add dashboard filters`) and keep each commit focused.
- PRs link issues, summarize user-visible changes, attach UI screenshots, and mention migrations or env updates.
- Always list verification steps such as `pnpm build`, `pnpm lint`, or a targeted Vitest command so reviewers can replay checks.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`, keep secrets out of Git, and expose browser-safe values with `NEXT_PUBLIC_`.
- After adjusting Supabase schema, rerun `pnpm db:update` to refresh generated types and commit the diff.
- Prefer feature flags or configuration in `config/` over hard-coded switches, and rotate Supabase keys regularly in the dashboard.
