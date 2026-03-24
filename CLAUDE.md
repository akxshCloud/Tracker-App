# Life Tracker App — CLAUDE.md

## Project Overview
A native macOS desktop application (Tauri v2 + React + TypeScript) that serves as a personal life tracker / "second brain" — starting with a debt management dashboard. Built for a single user, no Apple Developer account needed.

## Current State (Last updated: 2026-03-24)
- **Debt Dashboard**: Fully working — onboarding wizard, financial engine (avalanche/snowball), charts, strategy comparison
- **Smart Insights**: What-if simulator, debt-free countdown, milestone tracker, interest burn warnings
- **Debt Management**: Record payments, add debts, edit budget — all from dashboard
- **App Shell**: Sidebar navigation, payment history page, settings with data export/import/reset
- **All 5 phases complete.** Future features: habits tracker, goals tracker, main dashboard overview

## Tech Stack
- **Desktop Shell**: Tauri v2 (Rust-based, native macOS webview)
- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI**: shadcn/ui + Tailwind CSS + Geist fonts
- **Data**: SQLite (via Tauri SQL plugin — fully local, no server)
- **State Management**: Zustand
- **Charts/Viz**: Recharts
- **Testing**: Vitest (unit) + Playwright (E2E)

## Ground Rules — MANDATORY

### Git Workflow
1. **All features go in their own branches** — branch from `main` using `feature/<name>`, `fix/<name>`, or `chore/<name>` naming.
2. **Never push directly to `main`** — all changes must go through a PR.
3. **PR and code review must be completed before merging** — use the code-review agent/skill to review all PRs before merge.
4. **Write meaningful commit messages** — follow conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`). **Never add "Co-Authored-By: Claude" or any AI attribution to commit messages.**
5. **Never delete feature branches** — keep all branches as a historical record of development. Do not delete after merge.

### CLAUDE.md Maintenance
6. **Update this file after every major feature merge into main** — reflect new features, changed architecture, updated commands, or new conventions.
7. **Update between releases too** — if important decisions, context changes, or new patterns emerge during development, update this file immediately rather than waiting for a merge.

### Quality & Testing
8. **End-to-end testing before pushing** — run the full test suite and verify the app works before pushing any branch.
9. **Test every feature visually** — use agent-browser or manual verification to confirm UI renders correctly.
10. **No broken builds on main** — if tests fail, fix before merging.
11. **Type safety** — strict TypeScript, no `any` unless absolutely unavoidable.

### Development Process
12. **Use available MCP servers and plugins** — leverage Figma, Notion, Vercel, Supabase, Playwright MCP servers for tasks where applicable.
13. **Use all available skills/plugins** — code review, verification, browser testing, etc.
14. **Plan before building** — discuss approach with user before implementing non-trivial features.
15. **Dark mode by default** — this is a personal dashboard app, dark theme is primary.

### Auto-Rebuild
16. **Hot reload is always on** — Vite + Tauri dev server handles this. No manual restart needed during development.
17. **Tauri auto-rebuilds on Rust changes** — configured via `tauri.conf.json` watch settings.

### Architecture
18. **Feature-based folder structure** — each feature (debt, habits, goals, etc.) gets its own directory under `src/features/`.
19. **Shared components in `src/components/`** — reusable UI components live here.
20. **Database migrations tracked** — all schema changes go through migration files.
21. **Keep it simple** — this is a personal app. Don't over-engineer. Build what's needed now.

## Project Structure
```
src/
  features/
    debt/           # Debt tracking dashboard (first feature)
    dashboard/      # Main overview dashboard
  components/       # Shared UI components (shadcn/ui based)
  lib/              # Utilities, database helpers
  hooks/            # Custom React hooks
  styles/           # Global styles, Tailwind config
src-tauri/
  src/              # Rust backend (Tauri commands, DB access)
  migrations/       # SQLite migrations
```

## Localisation
- **Currency: GBP (£)** — user is UK-based. All monetary values, formatting, and symbols must use British Pounds. Never default to USD.
- Date format: DD/MM/YYYY (UK standard)

## Debt Feature — Financial Context
The app includes a **welcome/onboarding flow** that collects the user's actual debt details on first launch. Never hardcode or assume financial numbers — everything comes from user input.

The debt dashboard must model:
- **Avalanche method** (pay high interest first — mathematically optimal)
- **Snowball method** (pay smallest balance first — psychologically motivating)
- Payment scheduling and projections
- Interest accrual calculations
- Visual progress tracking

## Commands
- `npm run dev` — Start Vite + Tauri dev server (hot reload enabled)
- `npm run build` — Production build
- `npm run test` — Run Vitest unit tests
- `npm run test:e2e` — Run Playwright E2E tests
- `npm run tauri dev` — Start Tauri dev mode
- `npm run tauri build` — Build native .app bundle
