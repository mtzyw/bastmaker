# Repository Guidelines

## Project Structure & Module Organization
This Next.js app uses the App Router in `app/`; colocate route UI, loaders, and API handlers with their segment folders to keep data dependencies obvious. Feature workspaces such as `ai-sidebar/`, `ai-model-dropdown/`, and `text-to-image-generator/` own their local helpers and assets; favor adding new features beside existing peers. Shared primitives and layout scaffolding live in `components/` (PascalCase files), while tokens sit in `styles/` and Tailwind config in `tailwind.config.ts`. Place cross-cutting utilities in `lib/`, typed contracts in `types/` or `interface/`, hooks in `hooks/`, stores in `stores/`, and Supabase tasks in `supabase/`. Static or authored content belongs in `public/`, `blogs/`, `content/`, `docs/`, `emails/`, and localized strings in `i18n/`.

## Build, Test, and Development Commands
- `pnpm install`: sync dependencies; rerun after lockfile changes.
- `pnpm dev`: start the Next.js dev server at `http://localhost:3000` for QA.
- `pnpm build`: generate the production bundle; follow with `pnpm start` for smoke checks.
- `pnpm analyze`: inspect bundle size; `pnpm lint`: run ESLint and Tailwind rules.
- Supabase workflow: `pnpm db:update` wraps `db:push`, `db:pull`, `db:new-migration`, `db:reset`, and `db:gen-types` for schema alignment.

## Coding Style & Naming Conventions
TypeScript runs in `strict` mode; annotate props, API payloads, and Supabase queries explicitly. Prefer `@/` imports over deep relatives, keep Tailwind classes inline until repetition justifies extraction, and document complex helpers with short comments. Files follow `ComponentName.tsx`, `ProviderName.tsx`, `useName.ts`, and kebab-case utilities.

## Testing Guidelines
Vitest with React Testing Library backs unit coverage. Mirror source filenames (`Component.test.tsx`) or use `__tests__/` for shared utilities. Run targeted suites with `npx vitest run`; add a `pnpm test` script before automation. Call out coverage gaps for critical `app/` routes or brittle logic in `lib/`.

## Commit & Pull Request Guidelines
Write imperative commits such as `feat: add sidebar layout` or `fix: guard empty session`; keep prefixes consistent with history (`feat`, `fix`, `chore`, `docs(scope)`). Pull requests should link issues, summarize user-facing changes, attach UI screenshots when relevant, and note Supabase or environment impacts. Always list verification steps (commands run, migrations executed) and regenerate Supabase types before requesting review.

## Security & Configuration Tips
Copy `.env.example` to `.env.local`, never commit credentials, and expose browser keys via `NEXT_PUBLIC_` prefixes. After schema edits, run `pnpm db:update` to push migrations and refresh generated types.
