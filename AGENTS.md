# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes, layouts, and API endpoints.
- `components/`: Shared UI in PascalCase; co-locate small helpers when needed.
- `lib/`, `hooks/`, `stores/`: Typed utilities, Supabase bindings (`lib/supabase/`), React hooks, and Zustand state.
- `config/`, `data/`, `content/`, `blogs/`, `docs/`, `emails/`, `i18n/`: Site configuration, MD/MDX sources, docs, and localized assets.
- `public/`, `styles/`, `types/`: Static assets, Tailwind layers, and shared TypeScript definitions.
- `supabase/`: Local migrations and metadata; sync changes before deploying.
- `actions/`, `text-to-image-generator/`: Workflow scripts and AI tooling consumed by app routes.

## Build, Test, and Development Commands
- `pnpm install`: Install dependencies (preferred).
- `pnpm dev`: Launch the local Next.js server at http://localhost:3000.
- `pnpm build` → `pnpm start`: Produce and serve the production bundle.
- `pnpm lint`: Run ESLint with the Next.js core-web-vitals config.
- `pnpm analyze`: Open the bundle analyzer to review client payloads.
- Supabase workflows: `pnpm db:push | db:pull | db:reset | db:new-migration | db:gen-types | db:update`.

## Coding Style & Naming Conventions
- TypeScript runs in `strict` mode; add explicit types at API and component boundaries.
- Components and providers use PascalCase files; hooks follow `use<Name>.ts`; other modules stay kebab-case (e.g., `lib/format-date.ts`).
- Import via the `@/` alias instead of deep relative paths.
- Tailwind utilities live inline in JSX; extract repeated groups into reusable components.
- Resolve `react-hooks/exhaustive-deps` warnings promptly, especially around Supabase clients.

## Testing Guidelines
- Preferred stack: Vitest + React Testing Library for units, Playwright for E2E once introduced.
- Place specs in `__tests__/` or beside the source file with a `.test.ts(x)` suffix.
- Cover critical flows in `app/` routes and pure logic in `lib/`; note remaining gaps in PRs.

## Commit & Pull Request Guidelines
- Commits stay short and descriptive (history mixes English and Chinese); Conventional Commits are optional.
- Recommended prefix: `feat|fix|chore|docs(scope): summary` in imperative voice.
- PRs should link issues, summarize changes, attach UI screenshots for visible updates, note env/DB impacts, and list verification steps.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`; never commit secrets.
- Prefix client-safe env vars with `NEXT_PUBLIC_`; keep Supabase keys server-side when possible.
- After schema edits, run `pnpm db:update` to push migrations and refresh generated types.
- Avoid logging API keys or sensitive payloads in shared analytics or console output.
