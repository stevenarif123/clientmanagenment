# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Freelance web/software builders and small agency administrators managing active client accounts, multi-milestone projects, payments, project expenses, incoming contact inquiries, and live client progress portals. Secondary external audiences are invited project clients (viewing a read-only token-gated progress portal) and prospective leads (submitting project inquiries through the public contact form).

## Product Purpose

ClientHub centralizes daily operational client work in one PHP + SQLite web workspace: tracking leads from initial contact inquiry to client conversion, breaking contracted projects into milestone tasks (List and Kanban board), recording payments and project expenses with accurate net margin reporting, logging communications and file deliverables, and exposing real-time execution and billing status to clients without requiring client accounts.

## Positioning

A self-hosted, single-folder PHP + SQLite operational workspace designed for agencies and AI-assisted solo operators (with REST + `X-API-Key` endpoints alongside the admin UI) that combines internal Kanban/project financial control with zero-login token-based client progress portals and inline editing instead of heavy modal chains.

## Operating Context

Daily browser workspace used on desktop workstations and mobile devices (for quick status updates, Kanban drag-and-drop, and client WhatsApp/email follow-up). Supports root and subfolder deployments (`/client/`). Admin workspace and Client Portal use English operational labels; the public inquiry form serves Indonesian prospective leads in Bahasa Indonesia.

## Capabilities and Constraints

- Backend stack: PHP 8 + SQLite (`index.php` router, `.htaccess` / `router.php`, session Bearer auth and `X-API-Key` support). Frontend stack: static HTML + Tailwind CSS CDN + Vue 3 CDN + Axios + Chart.js + SortableJS with zero build bundler required.
- Preserved UX behaviors: inline editing inside Project Detail tabs (Tasks, Payments, Expenses, Communications, Files); preview-only drag/filter Global Task Board (`#/tasks`); List-only Public Client Portal (`portal.html`); subfolder-safe URL resolution.
- Legacy `backend/` and `frontend/` directories remain out of scope and untouched.
- Production packaging (`package-production.ps1`) strips CLI scripts and internal documentation from `ClientHub-Ready-Upload.zip`.

## Brand Commitments

- Brand name: **ClientHub** with geometric `CH` monogram and initial-based client/admin avatars only (no stock photos or unapproved custom artwork).
- Pinned visual direction from owner: dense Plane-inspired operational workspace structure (slim utility topbar with working global search, collapsible left sidebar with live active projects tree, crisp 1px borders without heavy card shadows, Light + Dark mode toggle defaulting to Light, Swiss Cobalt `#2563EB` accent with Cool-Zinc neutrals, and `Public Sans` workhorse typography).

## Evidence on Hand

- Live SQLite data in `data/database.sqlite` via `/api/reports/dashboard`, `/api/clients`, `/api/projects`, `/api/tasks/board`, `/api/submissions`, `/api/services`, `/api/portal/{token}`.
- Absence: no customer testimonials, commercial pricing tiers, third-party SaaS integrations, or SLA claims exist in this self-hosted tool; none may be fabricated.

## Product Principles

1. **Operational clarity over ornament**: Scannable hierarchies, aligned tabular numbers, and 1px structural boundaries outrank decorative cards or shadows.
2. **Inline flow over modal friction**: Task edits, payments, expenses, and logs stay inline within their active context.
3. **Resilient across modes and breakpoints**: Light and Dark themes, desktop and mobile viewports, and loading/empty/error states hold equal engineering rigor.
4. **Honest real-time state**: Every count, progress bar, and chart reflects persisted SQLite records with no invented figures.

## Accessibility & Inclusion

WCAG AA contrast across both Light and Dark themes (minimum 4.5:1 normal text, 3:1 large text/graphics), full keyboard navigation (`Tab`, `Enter`, `Escape` on overlays/modals), visible focus rings, `prefers-reduced-motion` compliance, and minimum 44px mobile touch targets.
