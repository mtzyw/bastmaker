# Repository Guidelines

## Project Structure & Module Organization
- `app/` houses the Next.js App Router; keep route-specific UI, loaders, and API handlers beside their segment. Feature folders such as `ai-sidebar/` and `text-to-image-generator/` own their local helpers.
- Shared UI primitives live in `components/` (PascalCase files), with design tokens in `styles/` and Tailwind config in `tailwind.config.ts`.
- Cross-cutting logic sits in `lib/` and typed interfaces in `types/` and `interface/`. Hooks belong in `hooks/`, Zustand stores in `stores/`, and Supabase workflows in `supabase/`.
- Static assets stay in `public/`; authored content uses `blogs/`, `content/`, `docs/`, `emails/`, and localized strings in `i18n/`.

## Build, Test, and Development Commands
- `pnpm install` syncs dependencies; rerun after pulling lockfile changes.
- `pnpm dev` starts the App Router at `http://localhost:3000`; use for local QA.
- `pnpm build` creates the production bundle; follow with `pnpm start` for smoke tests.
- `pnpm analyze` inspects bundle size; `pnpm lint` enforces ESLint and Tailwind rules.
- Supabase helpers: `pnpm db:push`, `pnpm db:pull`, `pnpm db:new-migration`, `pnpm db:reset`, `pnpm db:gen-types`, or the wrapper `pnpm db:update`.

## Coding Style & Naming Conventions
- TypeScript runs in `strict` mode; annotate props, API payloads, and Supabase queries explicitly.
- Favor `@/` aliases instead of deep relatives. Keep Tailwind classes inline until repetition justifies extraction.
- Components, providers, and hooks follow `ComponentName.tsx`, `ProviderName.tsx`, and `useName.ts`. Utilities default to kebab-case filenames.

## Testing Guidelines
- Vitest with React Testing Library powers unit suites. Mirror source files (`Component.test.tsx`) or use `__tests__/`.
- Run targeted suites with `npx vitest run`; add a `pnpm test` script before automation.
- Document coverage gaps for critical `app/` routes and brittle utilities in `lib/`.

## Commit & Pull Request Guidelines
- Write short, imperative commits (`feat: add sidebar layout`, `fix: guard empty session`). Prefixes such as `feat`, `fix`, `chore`, and `docs(scope): summary` match current history.
- Pull requests must link issues, describe user-facing changes, attach UI screenshots, and flag Supabase or environment impacts.
- List verification steps (commands run, migrations executed) and regenerate Supabase types before requesting review.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`; never commit secrets. Browser-safe keys require the `NEXT_PUBLIC_` prefix.
- After schema changes, run `pnpm db:update` to push migrations and refresh generated types to avoid drift.
