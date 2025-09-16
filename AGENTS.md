# Repository Guidelines

## Project Structure & Module Organization
- app: Next.js App Router routes, layouts, API routes.
- components: Reusable UI (PascalCase files/dirs).
- lib: Server/client utilities, Supabase types in `lib/supabase`.
- config, data, content, emails: Site/config data, MD/MDX content, email templates.
- hooks, stores: Custom React hooks and Zustand stores.
- public, styles, types: Static assets, Tailwind styles, global TypeScript types.
- supabase: Local project files and migrations.

## Build, Test, and Development Commands
- Install: `pnpm install` (preferred) or `npm install`.
- Dev server: `pnpm dev` → runs Next.js locally on http://localhost:3000.
- Build: `pnpm build` → production build; `pnpm start` to serve.
- Lint: `pnpm lint` → ESLint (Next core‑web‑vitals).
- Analyze bundle: `pnpm analyze` → enables `@next/bundle-analyzer`.
- Supabase: `pnpm db:push | db:pull | db:reset | db:new-migration | db:gen-types | db:update`.

## Coding Style & Naming Conventions
- Language: TypeScript (tsconfig `strict: true`). Prefer explicit types at module boundaries.
- Components: PascalCase (e.g., `UserCard.tsx`). Hooks: `useSomething.ts`.
- Files/dirs: kebab-case for non-components (e.g., `lib/format-date.ts`).
- Imports: use `@/*` base alias per `tsconfig.json`.
- Styling: Tailwind CSS; co-locate small UI helpers with components.
- Linting: Keep `react-hooks/exhaustive-deps` warnings clean during dev.

## Testing Guidelines
- Framework: None configured yet. For new tests, prefer Vitest + React Testing Library; Playwright for E2E.
- Location: `__tests__/` or alongside files; suffix `.test.ts(x)`.
- Scope: Unit-test pure utilities in `lib/`; smoke-test critical pages and API routes.

## Commit & Pull Request Guidelines
- Current history: short, descriptive messages (Chinese), not strict Conventional Commits.
- Recommended format: `feat|fix|chore|docs(scope): concise summary` in imperative mood.
- PRs should include: clear description, linked issues, before/after screenshots for UI, notes on env vars and DB migrations (if any), and test/QA steps.

## Security & Configuration Tips
- Env: Copy `.env.example` to `.env.local`. Never commit `.env.local`.
- Client vs server: Prefix browser-safe vars with `NEXT_PUBLIC_`. Keep secrets server-only.
- Supabase: After schema changes, run `pnpm db:update` to push and regenerate types.
- AI/External providers: Store API keys in env; avoid logging secrets.
