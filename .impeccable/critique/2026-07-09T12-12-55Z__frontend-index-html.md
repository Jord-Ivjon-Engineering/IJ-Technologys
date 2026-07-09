---
target: website mobile view
total_score: 23
p0_count: 2
p1_count: 2
timestamp: 2026-07-09T12-12-55Z
slug: frontend-index-html
---
Method: dual-agent (A: 7c4bfc55-2260-4634-bcf2-78ae48a62cb0 · B: de826464-b706-4006-824d-ea4d2dbbc688)

# Mobile-Only Critique — IJ Technologys Landing Page

**Target:** `frontend/index.html` at ~375px, one-handed phone use  
**Question:** Is everything optimized for mobile? Should anything change?

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 2 | Form feedback is solid; projects orbit gives no card index or progress |
| 2 | Match system / real world | 2 | SME copy is right; mouse/wheel hints and mailto-for-phone feel wrong on phones |
| 3 | User control and freedom | 2 | 380vh sticky projects section is a scroll trap; orbit cards are not tappable |
| 4 | Consistency and standards | 3 | Nav, language, and form patterns are coherent; spectacle vs. plain-language split |
| 5 | Error prevention | 3 | Contact form validates early, saves drafts, pre-fills package choice |
| 6 | Recognition rather than recall | 2 | Users must discover scroll-to-rotate; no visible "you selected Pro" state |
| 7 | Flexibility and efficiency of use | 3 | Contact FAB, bilingual toggle, multiple CTAs — but no click-to-call |
| 8 | Aesthetic and minimalist design | 1 | Triple WebGL + 380vh orbit + marquees overwhelm a 6–7″ screen |
| 9 | Error recovery | 3 | Bilingual field errors with fallback email in failure copy |
| 10 | Help and documentation | 2 | Contact steps exist but are `aria-hidden`; no mobile-specific guidance |
| **Total** | | **23/40** | **Acceptable — significant mobile improvements needed** |

---

## Anti-Patterns Verdict

**LLM assessment:** On mobile, the page still reads as a dark-neon agency template before it reads as a trustworthy local studio. Default dark theme, cyan glow, Three.js spectacle, and desktop interaction copy ("Move your mouse to explore") undermine the PRODUCT.md promise of confidence over spectacle. What saves it: plain bilingual SME copy, real € pricing, named regional clients, and a solid contact form.

**Deterministic scan:** CLI found 1 warning (`single-font`) — **false positive**; page uses Manrope, Libre Baskerville, and JetBrains Mono. Browser overlay found **61 issues** (41 low-contrast, 12 ai-color-palette, 5 thin-border-wide-shadow, 2 dark-glow, 1 tiny-text on `.hero3d .hint` at 11.5px). Mobile-actionable from overlay: contrast failures on small screens, tiny hero hint text.

**Browser inspection:** Tested at mobile viewport on live server. No horizontal overflow. Pricing and contact stack well. Header crowded; theme/lang buttons below 44px. Burger menu structure sound. Placeholder i18n gap confirmed in Albanian mode.

---

## Overall Impression

The **conversion path is mobile-ready** — pricing stacks cleanly, the contact form is thumb-friendly with draft persistence, and the floating Contact button is well placed. The **middle of the page is not mobile-ready** — the 380vh projects orbit, triple WebGL canvases, and desktop-only interaction hints create friction, battery drain, and bounce risk for the exact audience PRODUCT.md describes: busy owners deciding on a phone between customers.

**Single biggest opportunity:** Replace the scroll-jacked 3D projects spectacle with a simple, tappable mobile portfolio — keep the proof, drop the performance tax.

---

## What's Working

1. **Pricing section** — At ≤1020px, plans collapse to a single centered column with full-width CTAs (~55px tap height). Pro highlight scans instantly. This is genuinely mobile-first layout.

2. **Contact form** — Fields stack at ≤560px; inputs are ~48px tall with proper `type` and `autocomplete`; drafts persist to `localStorage` on every keystroke — critical for interrupted mobile users.

3. **Persistent conversion affordance** — `.contact-fab` at `bottom: 20px; right: 20px` keeps contact one tap away without reopening the burger menu.

---

## Priority Issues

### [P0] Projects section is a mobile scroll trap
- **What:** `.projects-wrap` is `380vh` tall with a sticky full-viewport stage. Users spend ~4 screen-heights in one section with no tap-to-inspect and non-interactive globe.
- **Why it matters:** Busy phone users will bail before reaching pricing or contact — the highest bounce-risk zone on the page.
- **Fix:** On mobile, replace orbit scroll-jacking with a vertical swipeable card list or static grid; reduce section height to ~1–2 viewports.
- **Suggested command:** `/impeccable adapt frontend`

### [P0] Triple WebGL + default dark theme on cellular
- **What:** Three active canvases (`#bgCanvas`, `#cardCanvas`, `#globeCanvas`) plus Three.js CDN; dark theme is the default.
- **Why it matters:** GPU/battery drain, warm phone, janky scroll — contradicts "Mobile-first and fast loading" in the Basic plan copy.
- **Fix:** Disable or drastically simplify WebGL below 1020px; default to light theme; lazy-init scenes only when in view.
- **Suggested command:** `/impeccable optimize frontend`

### [P1] Desktop interaction copy on touch devices
- **What:** `.hero3d .hint` says "Move your mouse to explore"; `#scrollHint` shows a mouse-wheel icon; projects subhead says "Scroll to rotate the globe."
- **Why it matters:** Signals the site wasn't built for phones — damaging for a studio selling mobile-first websites.
- **Fix:** Hide or swap hints on touch/`max-width: 1020px`; use swipe/scroll language instead.
- **Suggested command:** `/impeccable clarify frontend`

### [P1] Header controls fail one-handed ergonomics
- **What:** `#themeToggle` is 40×40px; lang buttons are ~28–30px tall at ≤560px; all sit top-right beside a 52px logo.
- **Why it matters:** Hard to reach one-handed; undersized lang toggle means Albanian-first users may never switch from default ENG.
- **Fix:** Enlarge lang/theme to ≥44px; consider moving lang into mobile menu; detect locale for default language.
- **Suggested command:** `/impeccable adapt frontend`

### [P2] Phone contact is email-gated, not one-tap call
- **What:** Footer "Phone" links to `mailto:hello@ijtechnologys.com?subject=Call%20request` instead of `tel:`.
- **Why it matters:** Mobile users between customers expect tap-to-call, not compose-email.
- **Fix:** Add `tel:` link (or prominent call CTA) alongside email.
- **Suggested command:** `/impeccable harden frontend`

### [P2] Testimonial marquee is touch-hostile
- **What:** `.tcard` is 340px wide (wider than 375px viewport); animation only pauses on `:hover`.
- **Why it matters:** Users cannot reliably read or stop testimonials on touch devices.
- **Fix:** Stack testimonials vertically on mobile, or add swipe control with pause.
- **Suggested command:** `/impeccable adapt frontend`

---

## Persona Red Flags

**Jordan (First-Timer):** Hero CTA presumes Pro (€690) before Basic is understood. Projects orbit has no plain "what to do" instruction. Unsplash thumbnails don't read as regional proof. Mouse hint undermines mobile-first claim.

**Casey (Distracted Mobile User):** Must survive 380vh projects scroll to reach pricing if scrolling linearly. Infinite marquees add visual noise. Draft save works but no "draft restored" confirmation. Contact FAB competes with iOS home indicator at `bottom: 20px` with no safe-area padding.

**Elena (Local Albanian SME Owner):** Page defaults to ENG; ALB toggle is tiny and top-right. Dark neon + monospace tags feel agency, not local partner. No click-to-call for 2-minute gaps between customers. Premium "From €1,490" may feel open-ended.

---

## Minor Observations

- No `safe-area-inset` handling for notch/home indicator on fixed header and contact FAB
- Placeholders don't update when language switches (labels do)
- `.contact-steps` is `aria-hidden="true"` — screen reader users miss reassurance
- `.pcard .tag` at 10px and `.plan .flag` at 11px are hard to scan on small screens
- `body { overflow-x: hidden }` masks overflow rather than preventing it
- Desk SVG animation in "How we work" adds visual noise without aiding mobile comprehension

---

## Questions to Consider

1. If a guesthouse owner opens this on 4G while a customer waits, does the 380vh projects section earn trust — or spend the trust the hero just built?

2. The Basic plan promises "Mobile-first and fast loading" — does Three.js plus three WebGL canvases before the contact form constitute proof, or contradiction?

3. Is bilingual-by-default actually bilingual-by-default on a first mobile visit, or bilingual-if-you-notice-a-28px-top-right-toggle?
