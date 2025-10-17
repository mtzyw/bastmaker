# Repository Guidelines

## Project Structure & Module Organization
- Keep App Router segments paired with their UI, loaders, and route handlers inside `app/`.
- Ship feature-specific assets beside peers (e.g., `ai-sidebar/`, `ai-model-dropdown/`, `text-to-image-generator/`).
- Shared primitives stay in `components/` (PascalCase), tokens in `styles/`, Tailwind config in `tailwind.config.ts`.
- Cross-cutting logic lives in `lib/`; contracts in `types/` or `interface/`; hooks and stores belong in `hooks/` and `stores/`.
- Publish authored content through `public/`, `blogs/`, `content/`, `docs/`, or `emails/`; localized strings reside in `i18n/`.

## Build, Test, and Development Commands
- `pnpm install` keeps dependencies in sync; rerun when `pnpm-lock.yaml` changes.
- `pnpm dev` launches the Next.js dev server on `http://localhost:3000`.
- `pnpm build` compiles the production bundle; pair with `pnpm start` for smoke tests.
- `pnpm analyze` inspects bundle weight; `pnpm lint` runs ESLint and Tailwind checks.
- `pnpm db:update` wraps Supabase schema sync; prefer it over direct `db:*` scripts.

## Coding Style & Naming Conventions
- TypeScript `strict` mode is enforced—annotate props, API payloads, and Supabase queries.
- Favor `@/` aliases over deep relative imports; keep Tailwind classes inline unless reuse demands extraction.
- Name components `ComponentName.tsx`, providers `ProviderName.tsx`, hooks `useName.ts`, utilities `kebab-case.ts`.
- Document only non-obvious helpers with concise comments; rely on type hints elsewhere.

## Testing Guidelines
- Vitest with React Testing Library powers unit coverage; mirror sources as `Component.test.tsx` or place shared specs in `__tests__/`.
- Target suites with `npx vitest run` or run a single file (`npx vitest run components/Foo.test.tsx`).
- Prioritize coverage for critical `app/` routes, `lib/` helpers, and Supabase integration surfaces; note gaps in PRs.

## Commit & Pull Request Guidelines
- Use imperative, prefix-based commits (`feat: add image grid uploader`, `fix: guard empty session`).
- PRs should link issues, summarize user-facing deltas, include UI screenshots for visual changes, and mention Supabase or env updates.
- List verification steps (commands executed, migrations run) and regenerate Supabase types before requesting review.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`; never commit secrets.
- Expose browser-config values via `NEXT_PUBLIC_` prefixes.
- Run `pnpm db:update` after schema edits to push migrations and refresh generated types.
