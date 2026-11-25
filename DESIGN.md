---
name: ClientHub Workspace
description: Flat architectural client, project, and financial ledger workspace built with Swiss Cobalt accents and Cool-Zinc hairlines across Light and Dark modes.
colors:
  cobalt-signal: "#2563eb"
  cobalt-deep: "#1d4ed8"
  cobalt-tint: "#eff6ff"
  cobalt-hairline: "#bfdbfe"
  cobalt-ice: "#93c5fd"
  chrome-ground: "#f4f5f7"
  sidebar-surface: "#fafafb"
  canvas-paper: "#ffffff"
  subtle-well: "#f7f8fa"
  active-wash: "#eceff4"
  hairline-border: "#e4e6eb"
  hairline-strong: "#cbd1da"
  ink-primary: "#111827"
  ink-secondary: "#4b5563"
  ink-muted: "#596370"
  dark-chrome: "#0b0d11"
  dark-sidebar: "#101319"
  dark-canvas: "#141820"
  dark-subtle: "#1b202b"
  dark-active: "#232a38"
  dark-hairline: "#262d3b"
  dark-ink: "#f3f4f6"
  status-progress: "#2563eb"
  status-review: "#d97706"
  status-complete: "#16a34a"
  status-blocked: "#dc2626"
  status-backlog: "#6b7280"
typography:
  display:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0em"
  body:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Public Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt-signal}"
    textColor: "{colors.canvas-paper}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-deep}"
    textColor: "{colors.canvas-paper}"
  button-secondary:
    backgroundColor: "{colors.canvas-paper}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    height: "32px"
  button-secondary-hover:
    backgroundColor: "{colors.subtle-well}"
    textColor: "{colors.ink-primary}"
  input-field:
    backgroundColor: "{colors.canvas-paper}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "7px 10px"
    height: "34px"
  card-hairline:
    backgroundColor: "{colors.canvas-paper}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "16px"
  badge-semantic:
    backgroundColor: "{colors.cobalt-tint}"
    textColor: "{colors.cobalt-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 7px"
---

# Design System: ClientHub Workspace

## Overview

**Creative North Star: "The Architectural Ledger"**

ClientHub is a calm, high-density agency workspace designed so admins can track projects, tasks, client payments, expenses, and inquiries without visual noise. Rather than stacking floating cards with heavy drop shadows, the interface frames data inside crisp 1px structural hairlines against a quiet cool-neutral ground, keeping operational figures and task states legible at a glance.

The system pairs tight workspace density with restrained color discipline. Cool-Zinc neutrals establish three clear surface planes across Light and Dark modes—outer chrome, navigation sidebar, and main canvas—while a single Swiss Cobalt accent signals active controls, focus rings, and current navigation routes. Semantic hues (amber, green, red, neutral gray) appear strictly inside small square status indicators and WCAG AA badges rather than full-card decorations.

Every surface—the admin shell, client portal, and public contact intake form—shares the same geometric clarity: tabular numerals for currency and counts, inline editing flows without unnecessary modal detours, and geometric monogram initials in place of stock photography.

**Key Characteristics:**
- Flat-by-default surfaces separated by 1px Cool-Zinc hairlines (`--border`) rather than drop shadows.
- Three-tier workspace layering (`--bg-chrome` → `--bg-sidebar` → `--bg-canvas`) with explicit `html.dark` parity.
- Single Swiss Cobalt primary accent paired with 8px square status indicators (`status-sq`) and restrained semantic badges.
- Compact, high-legibility `Public Sans` typography with `tabular-nums` alignment on all financial and workload metrics.
- Inline editing and zero decorative clutter across admin, client portal, and public intake surfaces.

## Colors

The palette uses a single Swiss Cobalt accent anchored over tiered Cool-Zinc neutrals in both Light and Dark themes, keeping status hues strictly localized to small semantic indicators.

### Primary
- **Cobalt Signal** (`cobalt-signal`): Primary call-to-action fills, active focus outlines, active chart segments, Kanban drag borders, and brand monogram badges.
- **Cobalt Deep** (`cobalt-deep`): Hover and pressed states for primary buttons and active Light-mode link/badge text where AA contrast is required against soft fills.
- **Cobalt Tint & Hairline** (`cobalt-tint`, `cobalt-hairline`): Subtle active route highlights, light informational badges, and interactive drop-zone fills.
- **Cobalt Ice** (`cobalt-ice`): High-contrast active text and link accent token in Dark mode (`html.dark`).

### Neutral
- **Light Surface Hierarchy** (`chrome-ground`, `sidebar-surface`, `canvas-paper`, `subtle-well`, `active-wash`): Progresses cleanly from the outer shell background to sidebar tree, primary work canvas, inset summary strips, and selected navigation items.
- **Dark Surface Hierarchy** (`dark-chrome`, `dark-sidebar`, `dark-canvas`, `dark-subtle`, `dark-active`, `dark-hairline`): Deep slate-charcoal planes preserving clear step separation in Dark mode without pure `#000000` blackouts.
- **Hairline Borders & Ink** (`hairline-border`, `hairline-strong`, `ink-primary`, `ink-secondary`, `ink-muted`, `dark-ink`): Crisp structural dividers paired with cool charcoal ink for body copy, muted metadata labels, and crisp white/light-zinc typography on dark canvases.

### Semantic Statuses
- **Progress / Active** (`status-progress`): In-progress tasks, active project markers, and neutral-to-active chart bars.
- **Review / Pending** (`status-review`): Review queue items, pending quotes, and caution indicators.
- **Complete / Paid** (`status-complete`): Paid invoices, completed deliverables, and active service states.
- **Blocked / Overdue** (`status-blocked`): Destructive actions, overdue deadlines, and validation errors.
- **Backlog / Muted** (`status-backlog`): Drafts, backlog items, and inactive records.

### Named Rules
**The One Accent Rule.** Swiss Cobalt is reserved for primary actions, active route emphasis, focus rings, and data highlights; cards, headers, and containers never carry decorative colored top borders or gradient banners.

**The Localized Semantics Rule.** Status colors live exclusively inside 8px square indicators (`status-sq`), compact badges, and chart legends—never as full-row or full-card background washes.

## Typography

**Display Font:** Public Sans (with `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` fallback)
**Body Font:** Public Sans (with `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` fallback)
**Numeric Treatment:** `font-variant-numeric: tabular-nums` enforced on all KPIs, invoice amounts, percentages, dates, and table columns.

**Character:** Humanist-grotesque neutrality engineered for clean tabular interfaces; tight negative tracking on headers balances effortlessly with open, legible 13px dense workspace rows and form controls.

### Hierarchy
- **Display** (`600`, `1.375rem` / `22px`, `lineHeight: 1.25`, `letterSpacing: -0.02em`): Primary workspace/portal titles and large KPI balance figures.
- **Headline** (`600`, `1rem` / `16px`, `lineHeight: 1.35`, `letterSpacing: -0.01em`): Page headers, modal titles, and major section headings (`h2`).
- **Title** (`600`, `0.875rem` / `14px`, `lineHeight: 1.4`): Sub-section headers, card group headings, and button text.
- **Body** (`400`, `0.8125rem` / `13px`, `lineHeight: 1.5`): Workspace tables, Kanban card titles, client timelines, and form inputs (`14px` comfortable reading scale on public portal and intake forms).
- **Label** (`600`, `0.6875rem` / `11px`, `lineHeight: 1.3`, `letterSpacing: 0.04em`): Section labels, badge text, column counts, and compact metadata headers.

### Named Rules
**The Sequential Heading Rule.** Pages enforce strict `h1` → `h2` → `h3` hierarchy with zero skipped heading levels so assistive navigation and scannable layout hierarchy stay predictable.

## Layout

The admin workspace uses a fixed-chrome shell anchored by a slim `44px` top utility bar containing workspace identity, keyboard-triggered global search (`Ctrl+K`), theme switcher (Light/Dark), and profile menu. Below it sits a collapsible `236px` left sidebar pairing core navigation (`Overview`, `Clients`, `Projects`, `Tasks`, `Inquiries`, `Services`, `Reports`) with an expandable live `Active Projects` tree linking directly to project tabs (`?tab=tasks`, `payments`, `expenses`, `files`, `comms`).

Main views adopt crisp hairline grids: Overview pairs a tabbed main column (`Summary`, `Projects`, `Clients`, `Inquiries`)—featuring a 3-up KPI row, 5-state Workload strip, side-by-side Revenue & Status charts, and Recent Activity—with a `288px` (`xl:w-72`) right contextual rail showing admin identity, timezone, live Financial Ledger, and project completion bars. Board views (`Projects` detail board and global `#/tasks` Kanban) render 4 columns side-by-side at `1280px+` (`lg:grid-cols-4`) and convert to snap-scrolling columns on mobile. Public surfaces (`portal.html` and `public-contact-form.html`) center single-column `max-w-4xl` / `max-w-2xl` architectural sheets over the neutral chrome ground. Touch targets scale to at least `44px` height on narrow (`< 640px`) viewports.

## Elevation & Depth

ClientHub uses **tonal plane separation and 1px structural hairlines instead of card drop shadows**. Grounded surfaces—KPI cards, Kanban columns, client tables, ledger summaries, and portal rows—sit flat against their parent plane at `box-shadow: none`, using background contrast (`--bg-chrome` vs `--bg-canvas` vs `--bg-subtle`) and `--border` dividers to establish visual order.

Floating layers (the `Ctrl+K` command dialog, user dropdown, confirm modals, and dark/light tooltips) are the sole exception, using a crisp `1px solid var(--border-strong)` frame paired with a restrained hairline ambient shadow (`0 10px 28px rgba(15, 23, 42, 0.08)` in Light mode; `0 12px 32px rgba(0, 0, 0, 0.45)` in Dark mode) so transient overlays separate cleanly from static hairlines.

### Named Rules
**The Flat-By-Default Rule.** Rested workspace cards, list containers, and portal sections carry zero box-shadow; elevation is reserved exclusively for transient floating popovers, command palettes, and modal dialogs.

## Shapes

The geometry follows a disciplined, square-shouldered enterprise scale: tight `4px` (`rounded.sm`) corners on semantic badges, checkboxes, and dense filter chips; `6px` (`rounded.md`) on buttons, inputs, sidebar navigation rows, and the geometric `CH` monogram mark; and `8px` (`rounded.lg`) on workspace cards, Kanban columns, and modal surfaces. Over-rounded `16px+` pill cards and decorative blob silhouettes are avoided across the product.

A defining geometric signature is the **8×8px rounded-2px status square** (`status-sq`), which replaces bouncing or pulsing circular dots across Workload strips, service availability toggles, Kanban headers, and client portal status banners.

## Components

Every component favors crisp 1px borders, predictable keyboard focus outlines (`2px solid var(--accent)` with `2px` offset), and minimal visual ornament.

### Buttons
- **Shape:** Subtle crisp rectangle (`6px` radius), `32px` minimum desktop height (`44px` minimum on mobile).
- **Primary:** Solid Swiss Cobalt (`cobalt-signal`) fill with pure white label text and `6px 12px` compact padding.
- **Hover / Focus:** Shifts to `cobalt-deep` on hover with `150ms` ease transition; `:focus-visible` renders a `2px` cobalt outline outside the button edge.
- **Secondary / Ghost / Danger:** `canvas-paper` fill with `1px solid var(--border-strong)` for secondary actions; transparent background shifting to `--bg-subtle` for ghost toolbar toggles; muted hairline outline shifting to semantic red fill/border for destructive confirms.

### Chips & Semantic Badges
- **Style:** Compact `4px` radius capsules with `2px 7px` padding and uppercase or `11px` `600`-weight typography paired optionally with an `8px` square status glyph.
- **State:** WCAG AA semantic foreground/background pairs across both Light and Dark themes (`badge-neutral`, `badge-blue`, `badge-amber`, `badge-green`, `badge-red`).

### Cards / Containers
- **Corner Style:** `8px` hairline rectangle (`rounded.lg`).
- **Background:** `--bg-canvas` on `--bg-chrome` or `--bg-subtle` contrast wells for grouped sub-strips.
- **Shadow Strategy:** None (`box-shadow: none`); bounded purely by `1px solid var(--border)`.
- **Internal Padding:** `16px` (`p-4`) on standard cards and portal sheets; `12px` (`p-3`) inside dense Kanban cards and summary strip tiles.

### Inputs / Fields
- **Style:** `1px solid var(--border-strong)`, `--bg-canvas` surface (`color-scheme: dark` enabled on `html.dark` so native `<select>` menus match), `6px` radius, `34px` height (`44px` on mobile).
- **Focus:** Border shifts to `cobalt-signal` with an accessible focus ring and paired visible `<label for>` bindings.
- **Error / Disabled:** Semantic red border highlight on invalid submit states; muted `--bg-subtle` fill with `0.55` opacity when disabled.

### Navigation
- **Topbar & Sidebar:** `44px` chrome header + collapsible `236px` sidebar rail (`13px` links, active item fills with `--bg-active` and bold primary ink, project tree indents cleanly under expandable chevrons). Mobile switches cleanly to a slide-over drawer.

### Status Square Indicator (`status-sq`)
- **Geometry:** Fixed `8px × 8px` block with `2px` corner radius and zero animation (`prefers-reduced-motion` compliant), paired inline next to state labels and metric counters.

## Do's and Don'ts

### Do:
- **Do** enforce `tabular-nums` on every price, balance, task total, and timeline date across admin and portal views.
- **Do** separate adjacent containers using `1px solid var(--border)` hairlines and surface value steps (`--bg-chrome` vs `--bg-canvas`) rather than shadow depth.
- **Do** preserve `html.dark` parity across all custom inputs, `<select>` options, Chart.js canvas labels, and semantic badges.
- **Do** use visible `<label for>` bindings and keyboard-accessible `<a>` / `<button>` semantics for every interactive element.
- **Do** use geometric `CH` monogram badges and single/two-letter initial avatars everywhere an identity mark is needed.

### Don't:
- **Don't** add drop shadows (`shadow-sm` / `shadow-lg`), gradient header banners, or `rounded-2xl` / `16px+` radii to workspace cards or Kanban boards.
- **Don't** add decorative colored top borders (`border-t-4`) or saturated full-row washes to indicate status.
- **Don't** replace real or zeroed metrics with placeholder testimonials, stock photography, or pulsing status dots (`animate-pulse`).
- **Don't** leave inline click handlers on `<div>` / `<td>` without native `<a>` or `<button>` semantics.
