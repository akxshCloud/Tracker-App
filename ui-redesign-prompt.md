# Pulse — Full UI Redesign Prompt

## Overview

Rebrand the app from "Life Tracker" to **Pulse** and redesign the entire UI. The current dark fintech aesthetic (Revolut/Stripe inspired) needs to be replaced with a clean, spacious, Notion/Obsidian-inspired design system. The app should feel like a premium personal productivity tool — not a banking app.

**Inspiration references:** Notion's clean layout and sidebar, Obsidian's understated elegance, Stacks.ai's data-dense-but-clean dashboard cards.

### Rebranding
- Rename all references from "Life Tracker" to **Pulse** throughout the entire codebase — window title, sidebar header, settings, any hardcoded strings, `tauri.conf.json` bundle name, and anywhere else the old name appears.
- **Logo files are provided** in the project. Two SVG files:
  - `pulse-icon.svg` — the standalone icon mark (a pulse ring with heartbeat line in #2E7CF6 blue). Use this as:
    - The **macOS app icon** — convert to PNG at 512px and 1024px, generate the .icns bundle, and update `tauri.conf.json` to reference it.
    - The **favicon** and PWA manifest icons.
    - Any place the app icon appears standalone (dock, Spotlight, About dialog).
  - `pulse-logo-wordmark.svg` — the icon + "Pulse" text side by side. Use this as:
    - The **sidebar header logo** — place it at the top of the sidebar in the app identity area. The SVG includes `prefers-color-scheme` media queries so the wordmark text automatically adapts to light/dark mode.
- Place both SVG files in `src/assets/` (or the project's existing assets directory) and import them as React components or image sources as appropriate.

---

## 1. Theme System

### Light/Dark Mode with System Detection
- **Default to macOS system setting** (`prefers-color-scheme`). Detect on app load and watch for changes.
- Persist the user's manual override in SQLite settings table (key: `theme`, values: `system` | `light` | `dark`).
- Use CSS custom properties (variables) on `:root` for all colours. Toggle by applying a `data-theme="light"` or `data-theme="dark"` attribute on `<html>`.
- All components must reference these CSS variables — **no hardcoded colour values anywhere**.

### Toggle Location & Icon
- Place a **lightbulb icon toggle** at the **top of the sidebar**, right below the app logo/name area.
- Use a filled lightbulb icon (💡 style) for light mode and an outlined/off lightbulb for dark mode. Source from Lucide icons (`Lightbulb` / `LightbulbOff`).
- Clicking cycles through: System → Light → Dark → System. Show a subtle tooltip on hover indicating current mode (e.g. "Theme: System").

### Colour Palette

**Light mode:**
- Background: `#FFFFFF` (main content), `#F7F7F5` (sidebar/secondary surfaces — warm off-white like Notion)
- Card backgrounds: `#FFFFFF` with `1px solid #E8E8E4` borders (subtle, warm grey)
- Text: `#37352F` (primary — Notion's near-black), `#787774` (secondary), `#B4B4B0` (tertiary/placeholder)
- Accent: `#2E7CF6` (keep current blue — used for active nav, buttons, links, progress indicators)
- Success: `#28A745`, Warning: `#E8912D`, Danger: `#EB5757`
- Hover states: `#F1F1EF` (light grey wash)
- Dividers/borders: `#E8E8E4`

**Dark mode:**
- Background: `#191919` (main content — Notion dark, not pure black), `#202020` (sidebar)
- Card backgrounds: `#252525` with `1px solid #333333` borders
- Text: `#E8E8E3` (primary), `#9B9A97` (secondary), `#5A5A58` (tertiary)
- Accent: `#2E7CF6` (same blue across both modes)
- Success: `#28A745`, Warning: `#E8912D`, Danger: `#EB5757`
- Hover states: `#2F2F2F`
- Dividers/borders: `#333333`

---

## 2. Typography

- **Switch from Geist to Inter** — it's the same font Notion uses, excellent readability, variable font with great weight range. Load via `@fontsource/inter` (already npm-installable, no external CDN needed — keeps CSP clean).
- **Fallback stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Scale:**
  - Page titles / greeting: `24px`, weight `600`
  - Section headers: `16px`, weight `600`
  - Card titles: `14px`, weight `600`
  - Body text / values: `14px`, weight `400`
  - Labels / secondary: `12px`, weight `500`, use secondary text colour
  - Small / captions: `11px`, weight `400`
- **Letter spacing:** Slightly tight on headings (`-0.01em`), normal on body.
- **Line height:** `1.5` for body, `1.3` for headings.

---

## 3. Sidebar Redesign

Replace the current icon-only sidebar with a **full text-based sidebar** like Notion's.

### Structure (top to bottom):
1. **App identity area** — Use the `pulse-logo-wordmark.svg` (icon + "Pulse" text) as the sidebar header. Render it at roughly `160×40px`. Place the lightbulb theme toggle icon to its right. Subtle bottom border separating from nav.
2. **Primary navigation** — text labels with small Lucide icons (16px) to the left:
   - 🏠 Dashboard
   - 💳 Debt Tracker
   - 📅 Payment Plan
   - 💰 Budget
   - 📜 Payment History
   - ✅ Habits
   - 🎯 Goals
3. **Bottom section** (pinned to bottom):
   - ⚙️ Settings

### Sidebar Behaviour:
- Fixed width: `240px` in expanded state.
- Active nav item: blue accent text + very subtle blue-tinted background (`#2E7CF6` at 8% opacity).
- Hover: light background wash (`#F1F1EF` light / `#2F2F2F` dark).
- Icons should be `16px` Lucide icons, not emoji — use appropriate ones (Home, CreditCard, Calendar, Wallet, Receipt, CheckSquare, Target, Settings).
- No icon-only collapsed state needed — always show labels.

---

## 4. Dashboard Redesign

The dashboard is the home page. It should be **data-rich but clean** — every feature gets a summary card with real data, plus a recent activity feed and quick actions.

### Layout:
- **Greeting header:** "Good morning / afternoon / evening" with the current date below (`Sunday, 29 March 2026` — UK format). `24px 600` weight. No emoji.
- **Quick actions row:** A horizontal row of small pill buttons below the greeting: "Record payment", "Add habit", "Update goal", "Add debt". Subtle outlined style, blue accent on hover.
- **Cards grid:** Use a responsive grid — 2 columns on wide screens, 1 column on narrow. Cards should have consistent padding (`20px`), subtle border (not heavy drop shadows), and generous internal spacing.
- **Recent activity feed:** Below the cards grid. A vertical timeline of the last 10 actions across all features (payments, habit completions, goal updates). Each item shows: icon, description text, relative timestamp ("2h ago", "Yesterday"). Subtle left border accent line.

### Dashboard Cards:

**Debt Overview Card:**
- Title: "Debt Overview"
- Key stats in a horizontal row: Remaining (£X,XXX), Paid Off (X%), Debt-Free Date (DD/MM/YYYY), Monthly Interest (£XX.XX)
- Below the stats: a **small sparkline chart** showing the projected payoff curve (use Recharts `<AreaChart>` at ~80px height, no axes, just the filled curve in blue accent with low opacity fill).

**Budget This Month Card:**
- Title: "Budget — March 2026"
- Income vs Spending displayed clearly with values.
- A **horizontal stacked bar** showing spend categories as proportional coloured segments (needs/wants/savings/debt), with a thin line marker for budget limit.
- Net flow value at the bottom (green if positive, red if negative).

**Today's Habits Card:**
- Title: "Today's Habits"
- Completion ratio displayed as "3/5" with a circular progress ring (not the current 0/0 empty state — show the ring even at 0%).
- Below: a **mini 7-week heat map** (7 columns × 7 rows = 49 cells) showing recent completion density. Use green shades like GitHub's contribution graph.
- List today's habits with checkboxes inline (max 5, "show all →" link if more).

**Goals Progress Card:**
- Title: "Goals"
- List up to 4 active goals, each showing: goal name, thin **horizontal progress bar** (blue fill), percentage label, and target date countdown ("12 days left" / "3 months left").
- "View all →" link if more than 4.

---

## 5. Page-by-Page Redesign Guidelines

Apply these principles to **every** page consistently:

### Global Page Layout:
- Page title: `24px 600` weight, top-left aligned.
- Generous top padding (`32px`) and side padding (`40px` from sidebar edge).
- Max content width: `960px` (centred if viewport is wider, like Notion's content column).
- Section spacing: `32px` between major sections.
- Card spacing: `16px` gap in grids.

### Debt Tracker Page:
- Keep all existing functionality (onboarding wizard, strategy comparison, what-if slider, milestone tracker).
- Restyle cards with the new border-based card style (no heavy dark backgrounds).
- Charts (Recharts): update colour scheme to use the new accent blue + warm greys. Remove dark chart backgrounds — charts should sit naturally on the page background.
- What-if slider: style the slider track in accent blue, handle in white with subtle shadow.
- Strategy comparison: use subtle tab switching (underline active tab, not pill buttons).

### Payment Plan Page:
- Month-by-month breakdown table: style as a clean table with alternating row backgrounds (very subtle: `#FAFAF9` light / `#1E1E1E` dark). No heavy grid lines — use bottom borders only.
- Active month highlighted with blue left border.

### Budget Page:
- Category breakdown: clean list with coloured dot indicators, subtle progress bars for budget limits.
- Over-budget warnings: red accent, not aggressive — a small inline badge, not a full alert banner.
- TrueLayer connection status: small subtle badge in the page header area.
- Review panel (uncategorised transactions): slide-out sheet, clean list with categorise buttons.

### Payment History Page:
- Grouped by month with section headers.
- Each payment as a clean row: date, debt name, amount, optional note.
- Monthly total in the section header, right-aligned.

### Habits Page:
- Habit cards in a grid (2 columns).
- Each card: habit name, streak count with 🔥 indicator, small inline heat map row (last 7 days as dots), completion toggle button.
- The full GitHub-style heat map calendar should appear when you click into a habit detail view.
- Completion animation: keep Framer Motion but make it subtle (a gentle scale + opacity pulse, not flashy).

### Goals Page:
- Goal cards in a grid (2 columns).
- Each card: goal name, progress bar, current/target values, countdown label.
- Click into goal for detail sheet with milestones list, progress update history, and edit controls.

### Settings Page:
- Clean vertical list of setting groups (like macOS System Preferences / Notion settings).
- Groups: Data (export/import/reset), Notifications (background toggle), Theme (system/light/dark radio — this duplicates the sidebar toggle but gives a more explicit control).
- Destructive actions (reset data) in a clearly separated danger zone at the bottom with red-outlined button.

---

## 6. Component-Level Updates

### Cards:
- Border: `1px solid` using border CSS variable.
- Border radius: `8px`.
- Background: card background CSS variable.
- Padding: `20px`.
- **No box-shadow** in light mode (rely on borders). In dark mode, no shadow either.
- Hover state (where interactive): very subtle background shift.

### Buttons:
- **Primary:** Blue accent background, white text, `8px` radius, `14px` font, `500` weight. Hover: slightly darker blue.
- **Secondary/Outlined:** Transparent background, `1px solid` border colour, primary text colour. Hover: light background wash.
- **Ghost:** No border, no background. Hover: light background wash. Used for sidebar nav items and inline actions.
- **Danger:** Red outlined by default, red filled on hover/confirm.
- All buttons: `32px` min height, `12px 16px` padding.

### Inputs & Form Controls:
- Border: `1px solid` border variable, `8px` radius.
- Focus ring: `2px solid` accent blue, `2px` offset.
- Background: same as card background (not darker/lighter).
- Placeholder text: tertiary colour.

### Dialogs/Sheets:
- Use shadcn Sheet for slide-out panels, Dialog for confirmations.
- Overlay: `rgba(0,0,0,0.4)` light / `rgba(0,0,0,0.6)` dark.
- Dialog card: same card styling, `16px` padding, `12px` radius.

### Charts (Recharts):
- Remove all dark backgrounds from chart containers.
- Grid lines: very subtle (`#E8E8E4` light / `#333333` dark), dashed.
- Area fills: accent blue at 10% opacity.
- Line/bar colours: accent blue primary, secondary colours from the palette for comparison.
- Tooltip: card-styled tooltip with border, no heavy shadow.
- Axis labels: secondary text colour, `12px`.

### Animations (Framer Motion):
- Keep animations but make them **subtle and fast**:
  - Page transitions: `opacity` + slight `y` translate (8px), `200ms ease-out`.
  - Card entrances: staggered fade-in, `150ms` each.
  - Habit completion: gentle scale pulse (`1 → 1.05 → 1`), `300ms`.
  - Number changes (debt totals, progress): animate with `spring` config, `300ms`.
- No bouncy or exaggerated animations — everything should feel smooth and understated.

---

## 7. Implementation Order

Do this in sequence to avoid breaking the app:

1. **Rebranding + logo** — Rename all "Life Tracker" references to "Pulse". Add the logo SVG files to `src/assets/`. Convert `pulse-icon.svg` to PNG at 512px and 1024px for the macOS app icon (.icns), update `tauri.conf.json` bundle config to use the new icon. Update the window title to "Pulse".
2. **Theme infrastructure** — CSS variables, `data-theme` attribute, system detection, persisted preference, lightbulb toggle in sidebar.
3. **Typography** — Install Inter, update font stack, apply type scale globally.
4. **Sidebar** — Replace icon-only sidebar with text-based sidebar, use `pulse-logo-wordmark.svg` as sidebar header, add theme toggle.
5. **Global layout** — Page padding, max-width, spacing tokens.
6. **Dashboard** — Full rebuild with all cards (sparklines, heat map, progress bars, activity feed, quick actions).
7. **Debt Tracker + Payment Plan + Payment History** — Restyle existing components.
8. **Budget** — Restyle existing components.
9. **Habits** — Restyle cards, heat map, completion animations.
10. **Goals** — Restyle cards, progress bars, detail sheet.
11. **Settings** — Restyle layout.
12. **Final pass** — Ensure all shadcn/ui components inherit theme variables, fix any hardcoded colours, verify both modes look correct. Confirm "Life Tracker" no longer appears anywhere in the UI or config.

---

## 8. Important Constraints

- **Do not break existing functionality.** This is a visual-only refactor. All data, calculations, notifications, TrueLayer connection, auto-updater, and background services must continue working exactly as before.
- **No new dependencies** beyond `@fontsource/inter`. Everything else (shadcn/ui, Tailwind, Recharts, Framer Motion, Lucide) is already in the project.
- **Logo files** — `pulse-icon.svg` and `pulse-logo-wordmark.svg` are provided and must be used. Do not recreate or redesign the logo — use the SVGs as-is. For the macOS app icon, convert `pulse-icon.svg` to PNG (use a tool like `sharp` or `resvg` in a build script, or manually export at 512px and 1024px).
- **Respect the existing feature-based folder structure** — don't reorganise files. Update styles in place.
- **Tailwind v4** — the project uses Tailwind v4. Use its CSS variable integration. Define theme tokens in the CSS layer, not in tailwind.config.
- **CSP must stay intact** — no external font CDNs. `@fontsource/inter` bundles the font files locally.
- **Test both modes visually** after each step — every page should look correct in light AND dark before moving on.
- **UK localisation** — dates stay DD/MM/YYYY, currency stays £, terminology stays British.
