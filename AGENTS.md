# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Next.js App Router pages, layouts, and API routes; colocate route-level utilities under the same segment when practical.
- `components/` exposes shared UI primitives in PascalCase files, while feature-scoped helpers can live beside the component.
- `lib/`, `hooks/`, and `stores/` centralize typed utilities, custom React hooks, and Zustand state; Supabase clients stay under `lib/supabase/`.
- Content sources (`blogs/`, `docs/`, `content/`, `data/`, `emails/`, `i18n/`) drive markdown-driven pages and localized assets.
- Styling and assets remain in `styles/`, `public/`, and `types/`; automation lives in `actions/` and `text-to-image-generator/`.
- Database migrations and generated metadata are versioned in `supabase/`; sync before deploying shared environments.

## Build, Test, and Development Commands
- `pnpm install` resolves dependencies; use the lockfile already committed.
- `pnpm dev` boots the local server on http://localhost:3000 with hot reload.
- `pnpm build` followed by `pnpm start` verifies the production bundle locally.
- `pnpm lint` enforces the Next.js core-web-vitals ESLint ruleset.
- `pnpm analyze` opens the bundle analyzer for client payload review.
- Supabase workflows: `pnpm db:push`, `db:pull`, `db:new-migration`, `db:reset`, `db:gen-types`, `db:update`.

## Coding Style & Naming Conventions
- TypeScript runs in `strict` mode; declare explicit types at public boundaries and Supabase responses.
- Components, providers, and hooks follow `ComponentName.tsx`, `ProviderName.tsx`, and `useName.ts`; utilities default to kebab-case.
- Prefer the `@/` alias over deep relative imports.
- Tailwind utilities live inline; extract repeated clusters into reusable components or config tokens.
- Resolve `react-hooks/exhaustive-deps` warnings immediately, especially around Supabase queries.

## Testing Guidelines
- Use Vitest with React Testing Library for units; place files in `__tests__/` or `<module>.test.ts(x)`.
- Capture mission-critical flows in `app/` routes and pure logic in `lib/`.
- Document remaining gaps in PR descriptions and ensure required suites pass.

## Commit & Pull Request Guidelines
- Keep commits short and imperative; history mixes English and Chinese, so favor clarity over strict Conventional Commits.
- Recommended prefixes: `feat|fix|chore|docs(scope): summary`.
- PRs should link issues, summarize changes, attach UI screenshots when altering visuals, note env/DB impacts, and list verification steps.

## Security & Configuration Tips
- Duplicate `.env.example` into `.env.local`; never commit secrets or production credentials.
- Prefix client-safe variables with `NEXT_PUBLIC_` and keep Supabase service keys server-side.
- After schema edits, run `pnpm db:update` to push migrations and refresh generated types.
- Avoid logging sensitive payloads in analytics, server logs, or shared channels.
