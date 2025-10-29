# Repository Guidelines

## Project Structure & Module Organization
- The app router lives under `app/`, with each feature bundling UI, server actions, and handlers inside its route segment (for example, `app/dashboard/`).
- Feature-specific modules stay colocated: `ai-sidebar/`, `ai-model-dropdown/`, and `text-to-image-generator/`.
- Reusable UI sits in `components/`, hooks in `hooks/`, state stores in `stores/`, and shared utilities in `lib/`.
- Contract types belong in `types/` or `interface/`; static assets and markdown content reside in `public/`, `blogs/`, `content/`, or `docs/` as appropriate.

## Build, Test, and Development Commands
- `pnpm install` syncs dependencies after pulling changes.
- `pnpm dev` runs the Next.js dev server on `http://localhost:3000`.
- `pnpm build` creates the production bundle; follow with `pnpm start` to serve it locally.
- `pnpm lint` applies ESLint and Tailwind rules; `pnpm analyze` opens the bundle analyzer.
- Database migrations use `pnpm db:new-migration "add-feature"` and `pnpm db:update` to apply schema updates and regenerate Supabase types.

## Coding Style & Naming Conventions
- TypeScript runs in `strict` mode—annotate props, async returns, and Supabase payloads.
- Prefer the `@/` alias over deep relative imports; keep Tailwind classes inline, introducing `clsx` or `cva` only for conditional styling.
- Name components `ComponentName.tsx`, hooks `useThing.ts`, utilities `kebab-case.ts`, and colocate server actions with their consuming component.

## Testing Guidelines
- Vitest with React Testing Library powers unit coverage; mirror the source structure using `Component.test.tsx` or `__tests__/`.
- Run the full suite with `npx vitest run` or target a spec (`npx vitest run components/Button.test.tsx`).
- Mock Supabase via fixtures in `lib/` and ensure adapters remain type-safe after schema changes.

## Commit & Pull Request Guidelines
- Use imperative commit messages prefixed with `feat:`, `fix:`, `chore:`, etc.
- PRs should link issues, summarize user-facing changes, include screenshots for UI work, and note migrations or env updates.
- Provide verification steps such as `pnpm build`, `pnpm lint`, or focused vitest runs.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local` and keep secrets out of version control; expose browser-safe values with `NEXT_PUBLIC_`.
- After schema edits, always run `pnpm db:update` to refresh generated types.
- Favor configuration flags over hard-coded switches, and rotate Supabase keys via the dashboard.
