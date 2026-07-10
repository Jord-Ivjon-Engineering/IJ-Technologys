---
target: CRM dashboard
total_score: 21
p0_count: 1
p1_count: 3
timestamp: 2026-07-10T18-12-19Z
slug: apps-crm-src-pages-dashboard-js
---
Method: dual-agent (A: 84b0e66c-27ec-4bbc-9309-f7b94c451621 · B: 235cfb4f-4aee-46ef-af8a-7b63eba80ea5)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No skeleton/loading during `fetchDashboard()`; stale data on re-entry |
| 2 | Match System / Real World | 3 | Plain labels; "Coming soon" activity panel and Unicode nav glyphs feel dev-facing |
| 3 | User Control and Freedom | 3 | Sidebar always available; no trap states on read-only dashboard |
| 4 | Consistency and Standards | 2 | Projects rows clickable, submission rows not; lists vs DataTable elsewhere |
| 5 | Error Prevention | 2 | "Total revenue" shows monthly data; `unreadInbox` falls back to `newLeads` in API |
| 6 | Recognition Rather Than Recall | 2 | Eight equal KPIs with no urgency grouping or drill-down |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts, KPI click-through, or bulk triage |
| 8 | Aesthetic and Minimalist Design | 2 | KPI wall + four equal panels + placeholder = no hierarchy |
| 9 | Error Recovery | 3 | `errorBlock` on fetch failure; no retry button |
| 10 | Help and Documentation | 1 | No contextual help; activity placeholder offers no alternative |
| **Total** | | **21/40** | **Acceptable** — significant improvements needed |

## Anti-Patterns Verdict

**LLM assessment:** Functional admin baseline dressed in IJ green — not screaming "AI made this," but hitting product-register tells: 8-tile hero-metric KPI grid, uppercase tracked micro-labels on every KPI and nav group, identical card grids, and a "Coming soon" panel in prime real estate. A craft-conscious power user would pause, not trust immediately.

**Deterministic scan:** CLI detector returned **0 findings** across `dashboard.js`, shell, KpiCard, `index.html`, and all of `apps/crm/src`. Browser overlay could not reach the authenticated dashboard (auth redirect to `/login.html`); 3 runtime findings on the login gate (low-contrast teal label/button, thin-border-wide-shadow) are out of scope for the CRM dashboard itself.

## Overall Impression

The CRM dashboard is a competent scaffold with a calm, on-brand palette — but it fails its core job of giving studio staff a confident morning overview. Eight equal KPI tiles compete for attention, the most actionable content (inbox submissions) isn't clickable, and a placeholder activity panel signals "unfinished" every login. The single biggest opportunity: collapse the KPI wall into a prioritized triage strip with one clear "what needs attention today" answer.

## What's Working

1. **Restrained palette** — `#046e58` accent on values and active nav only; light canvas stays calm without dark-mode or gradient clichés.
2. **Specific empty states** — "No recent submissions." and "No upcoming deadlines." are human, not generic "No data."
3. **Legible shell IA** — Nav grouped Overview / Work / Website / Insights with text labels and clear active state.

## Priority Issues

### [P0] Misleading KPI semantics
- **Why:** Staff may confuse monthly revenue for total, or see duplicate leads/inbox counts (`unreadInbox` falls back to `newLeads` in `api.js`).
- **Fix:** Align labels to period ("Revenue this month"); fix API mapping; use `KpiCard` `sub` prop for time context.
- **Suggested command:** `/impeccable clarify apps/crm/src/pages/dashboard.js`

### [P1] KPI wall with no hierarchy
- **Why:** Eight identical big-number cards defeat "at a glance" — violates hero-metric and identical-card-grid bans.
- **Fix:** Surface 3–4 attention metrics above fold; differentiate urgent items (badge, tint, size); link rest to Finance.
- **Suggested command:** `/impeccable distill apps/crm/src/pages/dashboard.js`

### [P1] No data-fetch loading state
- **Why:** Async fetch with no skeleton — user sees empty/stale shell on slow network.
- **Fix:** Skeleton KPI cards + list placeholders during `fetchDashboard()`.
- **Suggested command:** `/impeccable harden apps/crm/src/pages/dashboard.js`

### [P1] Inconsistent list click affordances
- **Why:** Projects due soon navigate on click; recent submissions don't — breaks morning triage flow.
- **Fix:** Make submission rows clickable → inbox detail or `/inbox` with highlight.
- **Suggested command:** `/impeccable polish apps/crm/src/pages/dashboard.js`

### [P2] Placeholder activity panel wastes prime space
- **Why:** "Coming soon" in a 2×2 panel grid erodes trust daily.
- **Fix:** Remove until real data exists, or show interim activity from existing API fields.
- **Suggested command:** `/impeccable onboard apps/crm/src/pages/dashboard.js`

## Persona Red Flags

**Alex (Power User):** KPIs are dead ends — no drill-down to Finance/Inbox/Projects. No keyboard shortcuts or refresh indicator. Submission rows require manual Inbox navigation. Quick links are the only accelerators.

**Sam (Accessibility):** Clickable project rows are `<div onClick>` — not keyboard-focusable. No `:focus-visible` on nav, buttons, or logout (only `.crm-input:focus` styled). Burger lacks `aria-expanded`. KPI labels at `#888` / `0.78rem` ≈ 3.5:1 contrast — below AA for small text.

## Minor Observations

- `.crm-card-muted` uses `opacity: 0.85` without disabled semantics.
- Topbar `actions` slot unused on dashboard — missed contextual primary action.
- Mobile stacks 8 KPIs before actionable panels — long scroll to due-soon list.
- `KpiCard` supports `sub` and `trend` but dashboard never uses them.
- Nav active `border-left: 3px` is conventional sidebar selection — acceptable, not card side-stripe abuse.

## Questions to Consider

- What if the dashboard had one "Morning triage" strip instead of eight KPI tiles?
- Should financial KPIs live exclusively on `/finance`, freeing the dashboard for operational signals?
- If Activity feed isn't ready, why is it visible at all?
