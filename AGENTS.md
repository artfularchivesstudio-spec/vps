# Repository Guidelines

## Project Structure & Module Organization
- `website/`: Next.js app. Routes live in `src/app`, shared UI in `src/components`, logic in `src/lib`, data layers in `prisma/` and `supabase/functions/`, assets in `public/`.
- Tests live in `website/tests/` (Playwright + snapshots) and `website/src/__tests__/` (Vitest); mirror feature folders for clarity.
- `api-gateway/`: Strapi gateway with the CMS in `strapi/`, automation scripts in `scripts/`, and export helpers in `supabase-export/`.
- `python-sdk/`: Bundled Python 3.12 runtime; extend only via new modules in `lib/`.

## Build, Test, and Development Commands
- `cd website && npm run dev` starts the Next dev server (needs `.env.local`).
- `npm run build && npm run start` builds then serves the production bundle.
- `npm run lint` runs Next/ESLint; append `-- --fix` to auto-correct.
- `npm run test` executes Vitest; `npm run test:e2e` runs Playwright (seed Supabase and keep Strapi running).
- `cd api-gateway/strapi && npm run develop` launches Strapi; `npm run build`/`npm run start` mimic production.

## Coding Style & Naming Conventions
- TypeScript-first with 2-space indentation; rely on ESLint and editor format-on-save.
- Components use `PascalCase`, hooks `useCamelCase`; prefer named exports for shared modules.
- Tailwind classes live in JSX; reserve CSS modules for scoped edge cases.
- Supabase edge functions in `supabase/functions` keep camelCase filenames and default exports.

## Testing Guidelines
- Unit tests belong in `src/__tests__` using `*.test.ts[x]`; mirror source structure.
- Snapshot suites stay in `tests/snapshots`; refresh with `npm run test:snap` and review `.snap` diffs.
- Playwright specs in `tests/e2e` follow `<feature>-flow.test.ts`; cover new user journeys.
- Strapi schema or migration changes need manual validation notes in PRs until automated coverage exists.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) and keep subjects ≤72 characters; emojis optional but sparing.
- Group related changes per commit and update `CHANGELOG.md` when user-facing behavior shifts.
- PRs require summary, testing log (`npm run lint`, `npm run test`, etc.), linked issues, and screenshots/GIFs for UI updates.
- Run lint, unit, and E2E suites before requesting review or triggering deploy scripts.

## Security & Configuration Tips
- Document new env vars in `website/.env.local.example`; keep real secrets out of git.
- Scrub Supabase dumps in `website/database/` before sharing.
- Load Strapi config from `process.env` in `api-gateway/strapi/config` to support all environments.
