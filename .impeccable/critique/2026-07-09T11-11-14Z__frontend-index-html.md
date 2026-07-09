---
target: this landing page
total_score: 21
p0_count: 2
p1_count: 2
timestamp: 2026-07-09T11-11-14Z
slug: frontend-index-html
---
Method: dual-agent (A: 12e0d32c-7576-4c86-8025-539ce8fb1245 · B: 2fff3796-322f-44ed-9cd0-0278aad69b37)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Form status works; nav has no active section; counters can show 0 before IO; orbit progress is vague |
| 2 | Match System / Real World | 2 | Package copy is SME-friendly; “Spin our projects,” orbit globe, and code chrome speak agency-to-agency |
| 3 | User Control and Freedom | 3 | Anchors and burger work; ~430vh sticky projects stage traps scroll with weak escape |
| 4 | Consistency and Standards | 2 | Internally consistent as neon agency; conflicts with PRODUCT.md confidence/premium-local intent |
| 5 | Error Prevention | 2 | Client validation exists; no package prefill into contact; placeholder phone; Premium has no price range |
| 6 | Recognition Rather Than Recall | 2 | Orbit projects hard to inspect; no case links; package choice not carried into the form |
| 7 | Flexibility and Efficiency | 2 | Bilingual + mailto/tel help; primary path still long scroll + spectacle; no hero Contact CTA |
| 8 | Aesthetic and Minimalist Design | 1 | Particle + 3D + globe + marquee + glass cards = spectacle over content |
| 9 | Error Recovery | 3 | Clear bilingual fail/ok; field invalid borders; no per-field error text |
| 10 | Help and Documentation | 2 | Reply-within-a-day line; no FAQ / next-step / VAT-hosting clarity at pricing |
| **Total** | | **21/40** | **Acceptable — significant improvements needed** |

#### Anti-Patterns Verdict

**LLM assessment:** Yes — immediately readable as AI/agency-template dark neon. Syne display face, `.grad-text` everywhere, uppercase `.eyebrow` on every section, hero-metric stats, particle/glow chrome, glass cards, identical plan/testimonial grids, picsum/pravatar stock proof, and “Spin our projects” spectacle framing. This matches PRODUCT.md’s anti-reference of generic dark neon / purple-glow SaaS.

**Deterministic scan:** CLI exit 2 with 2 findings on `frontend/index.html`: `single-font` (Syne) and `em-dash-overuse` (11 em-dashes). Live browser detector found 79 findings across 12 rules (notably `ai-color-palette` ×29, `low-contrast` ×28, `repeated-section-kickers` ×6, `gradient-text` ×4, `dark-glow` ×3). Detector and LLM strongly agree on gradient text, repeated kickers, dark glow, and AI palette. CLI under-reported vs live (static HTML scan misses computed styles). Fan-out on palette/contrast counts is noisy but directionally real.

**Visual overlays:** Injection succeeded on a tab titled `[Human] IJ Technologys detect overlay` with 61 overlays active during Assessment B. Live detect server (port 8401) was stopped after capture.

#### Overall Impression

Pricing honesty and bilingual contact are the only moments that feel like a capable local studio. Everything above the fold sells neon spectacle instead of confidence — the opposite of PRODUCT.md. Biggest opportunity: replace fake-looking proof and dark-neon chrome with calm, scannable work and a direct path to contact.

#### What's Working

1. **Pricing** — Clear €290 / €690 / Custom, timelines, “Most chosen” on Pro, CTAs to contact.
2. **Bilingual path** — Real EN/SQ toggle and bilingual form status messages.
3. **Contact form mechanics** — Labels, validation, live region, sending/disabled, success/fail copy.

#### Priority Issues

**[P0] Aesthetic contradicts brand intent (dark neon + Syne + gradient text + particle chrome)**
- **Why it matters:** Local SME owners seeking a trustworthy partner get an AI-agency template, not “clear · capable · premium.”
- **Fix:** Rebuild toward a calm, brand-committed surface; drop Syne; kill `.grad-text`; mute/remove particle field; accents sparingly.
- **Suggested command:** `/impeccable quieter` then `/impeccable colorize` / `/impeccable typeset`

**[P0] Proof looks fake (picsum projects, pravatar clients, empty alts, placeholder phone)**
- **Why it matters:** Conversion depends on “businesses like mine”; stock proof destroys confidence where PRODUCT.md says show the work.
- **Fix:** Real screenshots, honest cases, real phone; meaningful `alt` text.
- **Suggested command:** `/impeccable harden` (trust/content) + content swap

**[P1] Projects orbit is a trust/UX trap (`430vh` sticky, “scroll to spin”)**
- **Why it matters:** Busy owners won’t invest scroll time; mobile hides card body copy at ≤560px.
- **Fix:** Scannable case list/grid; optional light motion; keep descriptions on mobile.
- **Suggested command:** `/impeccable layout` / `/impeccable distill`

**[P1] Hero primary path misses the goal**
- **Why it matters:** Goal is contact/package; primary is “See what we offer,” secondary is “Spin our projects.”
- **Fix:** Primary → Contact or “Start with Pro”; secondary → Pricing/Work; drop spin framing.
- **Suggested command:** `/impeccable clarify` / `/impeccable distill`

**[P2] Contact high-stakes gaps**
- **Why it matters:** No package context after “Go Pro”; generic invalid message; placeholder tel.
- **Fix:** Prefill from plan CTA; per-field errors; real contact details; “what happens next.”
- **Suggested command:** `/impeccable harden` / `/impeccable clarify`

#### Persona Red Flags

**Jordan (First-Timer):** Unclear first action (“dreams” H1 + “Spin our projects”); orbit unexplained; “Get measured” metaphor without plain “free consult”; form invalid is one generic status with invisible 10-char message rule.

**Riley (Stress Tester):** Stats can show 0 before counter IO; picsum/pravatar/placeholder phone; marquee duplicates testimonials in DOM; `.reveal { opacity:0 }` can stay blank if IO fails; “Go Pro” doesn’t carry package into the form.

**Casey (Distracted Mobile):** Long hero before CTAs; sticky orbit tax; card descriptions hidden ≤560px; no persistent Contact chip; form draft not preserved on interruption.

**Lira (local guesthouse owner — project persona):** Dark neon + code tags feel like agency flex; Alpet Stay stock photo undercuts trust; Pro package is relevant but “animations” outrank bookings clarity; footer phone looks fake.

#### Minor Observations

- No current-section nav indicator; weak global `:focus-visible`
- Placeholder/muted contrast likely fails WCAG AA on particle backgrounds (detector: many `low-contrast`)
- Reduced-motion CSS helps; WebGL still initializes (weight on low-end phones)
- Suit van photo fights tailor metaphor; heading skip h1→h3 / h2→h4 (detector)
- Em-dash cadence in body copy (CLI)

#### Questions to Consider

1. If you removed the particle field, globe, and 3D card, would a restaurant owner trust you more — and why are those still above the fold?
2. Would you show this to a guesthouse owner and say “this is how careful we are,” or apologize for the glow first?
3. What single real project screenshot would you bet the business on — and why isn’t it the hero?
4. If Pro is “Most chosen,” why doesn’t the hero CTA say “Start with Pro” or “Book a free call”?
5. Is the cartoon desk the real personality — and if so, why is everything around it dressed as neon SaaS?
