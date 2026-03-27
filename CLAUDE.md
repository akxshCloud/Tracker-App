# Life Tracker App — CLAUDE.md

## Project Overview
A native macOS desktop application (Tauri v2 + React + TypeScript) that serves as a personal life tracker / "second brain" — starting with a debt management dashboard. Built for a single user, no Apple Developer account needed. Distributed as a standalone .app with auto-updates via GitHub Releases.

## Current State (Last updated: 2026-03-27)

### Completed Features
- **Dashboard**: Home page with greeting, overview cards for all features, recent activity feed
- **Debt Dashboard**: Onboarding wizard, financial engine (avalanche/snowball), payoff charts, strategy comparison
- **Smart Insights**: What-if slider (Revolut-style drag), debt-free countdown, milestone tracker, interest burn warnings
- **Debt Management**: Add/edit/delete debts, record payments, edit budget from dashboard
- **Payment Schedule**: Month-by-month breakdown showing exactly what to pay, to whom, per strategy
- **Payment Reminders**: Native macOS notifications for overdue/due-today/due-soon payments
- **Background Notifications**: macOS Launch Agent runs daily at 9am even when app is closed (enable in Settings)
- **Habits Tracker**: Daily/specific-days/times-per-week habits, streak tracking, GitHub-style heat map calendar, completion animations
- **Goals Tracker**: Percentage/numeric/currency/boolean targets, milestones, progress history, countdown labels
- **App Shell**: Sidebar navigation (Dashboard, Debt Tracker, Payment Plan, Budget, Payment History, Habits, Goals, Settings)
- **Payment History**: All payments grouped by month with totals
- **Settings**: Data export/import (JSON), reset all data, background notification toggle
- **Standalone App**: Installed to /Applications, launches from Launchpad/Spotlight
- **Auto-Updater**: Silent background download, restart prompt. CI builds on version tags.
- **Budget Planner**: TrueLayer bank connection, auto-categorised transactions (needs/wants/savings/debt/income), monthly breakdown, budget limits per category with over-budget warnings
- **Smart Categorisation**: 200+ UK merchant patterns, fuzzy matching, user learning from corrections, confidence scoring
- **Review Flow**: Bell notification for uncategorised transactions, slide-out review panel, auto-categorise button
- **UI**: Premium blue fintech aesthetic (Revolut/Stripe inspired), dark mode, Geist fonts, framer-motion animations

### Roadmap (agreed 2026-03-27)
1. ~~Smart Payment Reminders~~ ✓
2. ~~TrueLayer Bank Connection + Budget Planner~~ ✓
3. ~~Habits Tracker~~ ✓
4. ~~Goals Tracker~~ ✓
5. ~~Dashboard~~ ✓
6. **Net Worth Tracker** — assets minus debts over time

## Tech Stack
- **Desktop Shell**: Tauri v2 (Rust-based, native macOS webview)
- **Frontend**: React 19 + TypeScript (strict)
- **Build Tool**: Vite 7
- **UI**: shadcn/ui + Tailwind CSS v4 + Geist fonts
- **Animations**: Framer Motion
- **Data**: SQLite (via Tauri SQL plugin — fully local, no server)
- **State Management**: Zustand
- **Charts/Viz**: Recharts
- **Testing**: Vitest (unit)
- **CI/CD**: GitHub Actions → builds on version tags → GitHub Releases → Tauri auto-updater

## Ground Rules — MANDATORY

### Git Workflow
1. **All features go in their own branches** — branch from `main` using `feature/<name>`, `fix/<name>`, or `chore/<name>` naming.
2. **Never push directly to `main`** — all changes must go through a PR.
3. **PR and code review must be completed before merging** — use the code-review agent to review all PRs before merge. Never skip this.
4. **Write meaningful commit messages** — follow conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`). **Never add "Co-Authored-By: Claude" or any AI attribution.**
5. **Never delete feature branches** — keep all branches as historical record.

### CLAUDE.md Maintenance
6. **Update this file after every major feature merge into main** — reflect new features, changed architecture, updated commands, or new conventions.
7. **Update between releases too** — if important decisions, context changes, or new patterns emerge during development, update this file immediately.

### Quality & Testing
8. **End-to-end testing before pushing** — run the full test suite and verify the app works before pushing any branch.
9. **Test every feature visually** — verify UI renders correctly before merging.
10. **No broken builds on main** — if tests fail, fix before merging.
11. **Type safety** — strict TypeScript, no `any` unless absolutely unavoidable.

### Communication & Process
12. **Always use AskUserQuestion tool** — never ask questions inline in text responses.
13. **Plan with user before UI changes** — don't assume what the user wants. Discuss first via AskUserQuestion.
14. **Run everything autonomously** — don't ask the user to run commands separately. Just do it.
15. **Dark mode by default** — this is a personal dashboard app, dark theme is primary.

### Release Process
16. **Release after each major feature** — bump version in package.json, tauri.conf.json, and Cargo.toml.
17. **Tag and push** — `git tag vX.Y.Z && git push origin vX.Y.Z`. GitHub Actions handles the build.
18. **Never manually rebuild and copy to Applications** — the auto-updater handles updates. The app self-updates on launch.

### Architecture
19. **Feature-based folder structure** — each feature gets its own directory under `src/features/`.
20. **Shared components in `src/components/`** — reusable UI components live here.
21. **Database migrations tracked** — all schema changes go through migration files in lib.rs.
22. **Keep it simple** — this is a personal app. Don't over-engineer.

## Project Structure
```
src/
  features/
    dashboard/            # Home page aggregating all features
      activity.ts         # Recent activity feed (SQL aggregation)
      components/         # DashboardPage, GreetingHeader
    debt/                 # Debt tracking (dashboard, calculations, notifications)
      components/
        dashboard/        # Dashboard cards, charts, dialogs
        onboarding/       # Welcome wizard steps
      calculations.ts     # Financial engine (avalanche, snowball, projections)
      notifications.ts    # Payment reminder logic
      store.ts            # Zustand state management
      db.ts               # SQLite CRUD operations
      types.ts            # TypeScript types
    habits/               # Habit tracking with streaks
      components/         # HabitsPage, HabitCard, HabitCalendar, dialogs
      calculations.ts     # Streak logic, heat map data, completion rates
      store.ts            # Zustand store
      db.ts               # SQLite CRUD + toggle completions
      types.ts            # Habit, HabitCompletion, categories, frequencies
    goals/                # Goal tracking with milestones
      components/         # GoalsPage, GoalCard, GoalDetailSheet, dialogs
      calculations.ts     # Progress %, countdown, completion detection
      store.ts            # Zustand store
      db.ts               # SQLite CRUD + milestones + progress updates
      types.ts            # Goal, GoalMilestone, GoalUpdate, target types
    budget/               # Budget planner with TrueLayer bank connection
    settings/             # Settings page, data export/import, launch agent
  components/             # Shared UI (Sidebar, UpdateChecker, ProgressRing, shadcn/ui)
  lib/                    # Utilities (cn, formatCurrency, formatDate, database, router, colors)
  styles/                 # Global CSS, Tailwind theme, custom utilities
src-tauri/
  src/lib.rs              # Rust backend, plugin registration, DB migrations
  tauri.conf.json         # App config, updater endpoint, bundle settings
  capabilities/           # Permission scoping for plugins
```

## Localisation
- **Currency: GBP (£)** — user is UK-based. All monetary values use British Pounds.
- **Date format: DD/MM/YYYY** (UK standard). Parse YYYY-MM-DD strings as local time (not UTC) to avoid BST off-by-one.
- **UK financial terminology** — "current account" not "checking account", APR per FCA standards.

## Database Schema
```sql
debts (id, name, category, original_balance, current_balance, interest_rate, minimum_payment, due_day, notes, created_at, updated_at)
payments (id, debt_id, amount, payment_date, notes, created_at)
settings (key, value) — stores onboarding_complete, monthly_budget
habits (id, name, description, icon, color, frequency_type, frequency_value, category, sort_order, archived, created_at, updated_at)
habit_completions (id, habit_id, completed_date, notes, created_at) — UNIQUE(habit_id, completed_date)
goals (id, name, description, category, icon, color, target_type, target_value, current_value, unit, target_date, started_at, completed_at, archived, sort_order, created_at, updated_at)
goal_milestones (id, goal_id, name, target_value, completed_at, sort_order, created_at)
goal_updates (id, goal_id, previous_value, new_value, notes, update_date, created_at)
```

## Key Technical Decisions
- **Debt entries are manual** — user adds/edits debts themselves.
- **Income and expenses will come from TrueLayer bank connection** — not manual entry.
- **updateDebt uses CASE WHEN** for original_balance (not MAX(), which is invalid in SQLite UPDATE SET).
- **Launch Agent uses launchctl bootstrap/bootout** (not deprecated load/unload) for macOS 12+ compatibility.
- **Notification script sanitises debt names** (strips `"`, `\`, backticks, `$`) before passing to osascript to prevent shell injection.
- **CSP enabled** — `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:`

## Commands
- `npm run tauri dev` — Start dev server with hot reload
- `npm run tauri build` — Production build (.app + .dmg)
- `npm run test` — Run Vitest unit tests
- `npx tsc --noEmit` — Type-check
- `git tag vX.Y.Z && git push origin vX.Y.Z` — Trigger release build

## Version History
- **v0.1.0** — Initial scaffold
- **v0.2.0** — Debt dashboard, insights, payment recording, app shell, UI overhaul, payment schedule, edit/delete debts, standalone app + auto-updater
- **v0.3.0** — Payment reminders (native macOS notifications), background notifications (Launch Agent), What-if slider redesign
- **v0.4.0** — Budget planner with TrueLayer bank connection, auto-categorisation, monthly breakdown
- **v0.5.0** — Smart categorisation engine (200+ UK merchants, user learning, fuzzy matching), budget limits per category, uncategorised review flow with bell notification
- **v0.6.0** — Habits tracker (streaks, heat map calendar, completion animations), Goals tracker (milestones, progress history, 4 target types), Dashboard home page (aggregated overview, activity feed)
