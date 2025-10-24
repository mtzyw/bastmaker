# Repository Guidelines

## Project Structure & Module Organization
Keep Next.js App Router segments grouped under `app/segment` with adjacent server actions, UI, loaders, and route handlers. Colocate feature bundles like `ai-sidebar/`, `ai-model-dropdown/`, and `text-to-image-generator/` so assets and handlers ship together. Shared primitives belong in `components/`, cross-cutting utilities in `lib/`, and contracts in `types/` or `interface/`; hooks and stores live in `hooks/` and `stores/`. Content flows through `blogs/`, `content/`, and `docs/`, static assets through `public/`, locale strings in `i18n/`, and Supabase helpers in `supabase/`.

## Build, Test, and Development Commands
Run `pnpm install` after pulling to sync dependencies. `pnpm dev` serves the app at `http://localhost:3000`, while `pnpm build` compiles production assets and `pnpm start` runs the compiled bundle. `pnpm lint` enforces ESLint with Tailwind rules, and `pnpm analyze` toggles the bundle analyzer. Use `pnpm db:update` to push migrations and regenerate Supabase types, and `pnpm db:new-migration "add-users-table"` to scaffold a change.

## Coding Style & Naming Conventions
TypeScript runs in `strict` mode, so annotate props, async returns, and Supabase payloads. Favor `@/` aliases over deep relatives, keep Tailwind classes inline, and lean on `clsx` or `cva` for conditional styling. Name components `ComponentName.tsx`, hooks `useName.ts`, utilities `kebab-case.ts`, and providers `ProviderName.tsx`. Reserve comments for non-obvious flows and let types convey intent.

## Testing Guidelines
Unit coverage targets Vitest with React Testing Library. Mirror sources with `Component.test.tsx` files or consolidate shared specs under `__tests__/`. Run suites with `npx vitest run` or scope to one file such as `npx vitest run components/AvatarCard.test.tsx`. When touching Supabase logic, stage mock clients in `lib/` fixtures and assert schema-safe adapters.

## Commit & Pull Request Guidelines
Commits stay imperative with prefixes such as `feat:`, `fix:`, or `chore:`. PRs must link issues, summarize user-facing deltas, and attach screenshots or clips for visual work. List verification steps (`pnpm build`, `pnpm db:update`, etc.) and highlight any Supabase or env updates. Regenerate Supabase types before review and call out deferred tests.

## Security & Configuration Tips
Copy `.env.example` to `.env.local` and never commit secrets. Expose browser-safe config through the `NEXT_PUBLIC_` prefix and rotate Supabase keys in the dashboard. After schema edits, rerun `pnpm db:update` and prefer env toggles over hard-coded flags.
