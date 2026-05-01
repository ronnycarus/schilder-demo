# Premium Painter Website — Scroll-Driven "Paint Reveal" Experience

> **Goal:** Build a high-end, award-worthy marketing site for a Dutch professional painter / decorator (`schilder`). The site must *feel* like the user is watching the page being **painted into existence**: rollers, brushes, and drips reveal content, switch palettes, and drive transitions on scroll, hover, and click.
>
> The narrative inspiration is **terminal-industries.com** — its sticky scroll storytelling, pinned video sequences, odometer counters, and bold typographic rhythm. We are *not* cloning it; we are **translating its scroll-driven 3D-feeling cinematic flow into a tactile, painterly metaphor**.

---

## 0. Working agreement

- Stack is fixed (see §3). Do **not** swap frameworks unless I approve.
- Build **phase by phase** (§11). After each phase: a 3–5 bullet status update + screenshot. Wait for "go" before next phase only on Phase 0 and Phase 6 (palette switcher); other phases can flow.
- Reduced-motion users must get a fully usable, beautiful **static** version. This is non-negotiable.
- Locale order: **Dutch (nl)** is primary. English (en) follows. All UI copy in Dutch first; ask me before inventing brand-specific copy.
- Do not commit external API keys, paid services, DNS changes, or production deploys without explicit approval.

---

## 1. Reference site analysis — terminal-industries.com

What that site actually does technically (so we know what to imitate in *spirit*):

1. **Pinned scroll sequences with prerendered video.** Each "benefit" section pins to viewport, then plays an MP4 frame-by-frame as scroll progresses. They ship two versions of every clip: `*_wide_*` (desktop) and `*_vert_*` (mobile/portrait). Hosted on Storyblok CDN.
2. **Odometer-style number counters** (rolling 0–9 digits) that tick as a section enters.
3. **Sticky stacked storytelling**: the hero scrolls into a sequence where headline morphs ("That's the YOS™ YOS™") while a video sequence plays underneath.
4. **Numbered benefit cards** (01, 02, 03, 04) with text that fades in beside a pinned visual — a classic GSAP `ScrollTrigger` + `pin: true` + scrub pattern.
5. **Clean typographic hero** — oversized display headline, lowercase serif/grot mix, very disciplined whitespace.
6. **Logo grids** that fade-and-stagger in.
7. **Smooth scroll** (likely Lenis or GSAP ScrollSmoother) feeding ScrollTrigger.
8. **Tech stack signals**: Next.js + Storyblok CMS, Vercel, GSAP for animation. No heavy WebGL — they fake 3D with prerendered video.

**Translation rule for our site:** wherever Terminal uses a *prerendered video clip*, we use a **paint reveal** (roller sweep, brush stroke, drip, splash) tied to the same scroll progress. Same cinematic rhythm — different metaphor.

---

## 2. The painter metaphor — visual language

Every interaction should answer "what would a painter do here?":

- **Section reveal** → a roller sweeps across, leaving content visible behind it.
- **Heading entry** → a brush stroke draws an underline / highlight.
- **Card hover** → a subtle drip forms at the bottom edge.
- **Click / page transition** → a paint splash radiates from the click point, then wipes the next view in.
- **Cursor** → replaced with a small angled brush that tilts based on movement velocity.
- **Palette switch** → a roller of the new color physically traverses the viewport and re-coats the site.
- **Loading / pending states** → drip animations instead of spinners.
- **Empty states** → a blank canvas texture with a "still drying" hand-lettered note.

Every metaphor must be implemented with respect — never cartoonish. Think *Aesop x Farrow & Ball*, not Looney Tunes.

---

## 3. Tech stack (locked)

- **Next.js 16** (App Router, Server Components where possible)
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS v4** + **shadcn/ui**
- **GSAP 3** + **ScrollTrigger** + **ScrollSmoother** (or Lenis if SSR-easier — your call, justify it)
- **Framer Motion** for component-level micro-interactions and `AnimatePresence` page transitions
- **@react-three/fiber** + **drei** — *only* for the optional 3D paint-can scene in Phase 6. Lazy-load with `next/dynamic`, no SSR.
- **next-intl** for nl/en
- **Sharp** for image optim, **next/image** everywhere
- **Lucide-react** for utility icons (used sparingly — most icons are custom hand-drawn SVG)
- **Zod** for form validation, **react-hook-form** for the offer form
- **Resend** for the contact form email (placeholder until I provide the API key)

Performance budget: Lighthouse mobile ≥ 90, LCP < 2.5s, CLS < 0.05, JS < 250 KB on first load (excluding 3D scene which is route-split).

---

## 4. Visual identity

> This is a **portfolio demo** for robbycarus.com — fictional brand. Everything below is invented to best showcase the paint-reveal animation system. Override anything that doesn't land. Items marked **[invented]** are my call; items marked **[confirm]** want sign-off before lock.

### 4.1 Brand — *Studio Kalk* **[invented]**
- **Name**: `Studio Kalk` — "kalk" = lime/chalk, referencing limewash (kalkverf), the on-trend premium finish in Dutch interiors. Single-word, confident, hard consonants → easy to design a wordmark around.
- **Tagline (nl)**: *Een rustig huis begint met de juiste verf.*
- **Tagline (en)**: *A calm home starts with the right paint.*
- **Persona**: small Utrecht-based atelier, est. 2014, ~240 projects delivered. One master schilder + a small crew. Specializes in limewash, fine woodwork, and high-end residential interiors.
- **Tone**: **understated craft**. Why: the spec's reference points (*Aesop × Farrow & Ball*) reward restraint, the Dutch market reads "premium" as showy, and a quiet voice lets the paint-reveal animation moments do the talking. Copy avoids superlatives, prefers declarative sentences, addresses the reader as `je` (informal) rather than `u`.

### 4.2 Palette — locked: *Hollandse Meesters* **[locked 2026-05-01]**

Three palette directions considered. **Option B** locked as the build default — chosen because this is a portfolio demo whose primary job is showcasing paint-reveal animations: B has the highest contrast for roller-sweep punch, and the Delft Blue / Saffraan / Carmijn triad is recognizably Dutch rather than generically earthy. C and A retained as documented alternates and demoed live by the §6.5 palette switcher.

**Option B — Hollandse Meesters** *(default)* — Dutch art-history homage. Maximum contrast against the plaster wall = maximum animation drama.

| Role | Name | Hex |
|---|---|---|
| Wall / canvas | Plaster White | `#F2EDE2` |
| Ink | Vantablack | `#0A0A0C` |
| Primary roller | Delft Blue | `#1F3F6E` |
| Accent roller | Saffraan | `#E5A735` |
| Deep accent | Carmijn | `#A23A2E` |
| Earth tone (sparingly) | Omberbruin | `#5E4632` |
| Drip | semi-transparent layers of the above |

**Option C — Kalk Modern** *(alt — earth-tone, residential-interior leaning)*: Limewash White `#F1ECE0` / Steenkool `#1B1C1F` / Mosgroen `#5C6E4A` / Klei Terracotta `#C26B47` / Stoffig Blauw `#7B95A8` / Eierdooier `#E8C16D`.

**Option A — Atelier Studio** *(alt — warm, dramatic forest-green reveal)*: Bone Linen `#EDE6D3` / Charcoal `#1A1A1F` / Deep Forest `#2B3F32` / Burnt Sienna `#B85935` / Soft Ochre `#D9A55C`.

### 4.3 Type **[invented]**
- **Display**: `Cabinet Grotesk` (Bold/Extrabold) — confident, slightly idiosyncratic, holds up at hero scale better than Boldonse for body-near-display sizes.
- **Body**: `Inter` (variable) — proven legibility, broad weight range, ships fast via `next/font`.
- **Hand-drawn accent**: `Caveat` — used **only** for color-can labels, palette names, marginalia. Never headlines, never body.

### 4.4 Texture **[invented]**
A subtle tileable canvas grain at ~5% opacity, multiply blend, over the whole page. Plus a faint horizontal banding (~2%) that mimics roller marks on a wall. Both should be almost subliminal — felt, not seen.

---

## 5. Build a reusable "paint primitives" library first

Before writing any page, build `/components/paint/*`. Every page reuses these:

| Component | What it does | Tech |
|---|---|---|
| `<BrushStroke />` | SVG path with `stroke-dashoffset` animated by GSAP. Accepts `direction`, `duration`, `trigger`, `color`. | SVG + GSAP |
| `<RollerSweep />` | Long horizontal element pinned across a section. Behind it, a CSS `clip-path: inset()` reveals the painted region. Driven by ScrollTrigger scrub. | SVG/CSS + ScrollTrigger |
| `<Drip />` | SVG drip with elastic-ease height tween. Spawns on hover or scroll-in. | SVG + GSAP |
| `<PaintSplash />` | Multi-blob radial splash, used for click feedback and page transitions. Origin = click point. | SVG + Framer Motion |
| `<BrushCursor />` | Custom cursor; tilts via `atan2(dy, dx)` of pointer velocity. Hides on touch devices. | DOM + rAF |
| `<PaintMask />` | Reusable `mask-image` wrapper that uses an SVG brush-stroke shape as the reveal mask. Animates `mask-size` or `mask-position` on scroll. | CSS mask + ScrollTrigger |
| `<CanvasTexture />` | Background grain + faint wall imperfection layer. SSR-safe. | CSS only |
| `<DripCounter />` | Replacement for Terminal's odometer: digits "drip" up into place instead of rolling. | SVG + GSAP |

**All primitives must accept `reducedMotion` prop and degrade to a static painted state when true. Wire to `useReducedMotion()` once at the layout level.**

Build a small **/sandbox** route in dev only, showing every primitive in isolation. This becomes our QA surface.

---

## 6. Section-by-section spec (homepage)

### 6.1 Hero — "the first stroke"
- Page loads showing a **blank plaster canvas** (Plaster White `#F2EDE2`) with the *Studio Kalk* wordmark top-left rendered as the very last brush stroke (drawn in over ~600 ms after mount).
- A **roller** swings down from top-left and drags diagonally across the hero, painting it Delft Blue (`#1F3F6E`). The roller is an SVG (Phase 1) and optionally upgraded to a 3D model (Phase 6+).
- As the painted area expands, the headline fades in *only inside the painted region* (CSS mask synced to roller position).
- Headline: oversized, two-line. Copy **[invented]**:
  > **Een rustig huis begint met de juiste verf.**
  > Binnen, buiten — en alles wat ertussen ligt.
- Sub-CTA row: `Vraag offerte aan` (primary) + `Bekijk projecten` (ghost).
- Below the fold a **DripCounter** shows `Sinds 2014` and `240+ projecten` **[invented]** — replacing Terminal's odometer. Numbers drip up into place when scrolled into view.

### 6.2 Services — "alternating strokes"
- Six service cards **[locked 2026-05-01]**:
  1. `Binnenschilderwerk`
  2. `Buitenschilderwerk`
  3. `Kalkverf & limewash`
  4. `Houtwerk & restauratie`
  5. `Behangwerk`
  6. `Kleuradvies aan huis`
  > Dropped the original spec's `Spuitwerk` and `Sauswerk` — too commercial/industrial for the Studio Kalk persona. Replaced with `Kalkverf & limewash` (on-brand specialism) and `Kleuradvies aan huis` (premium consult that justifies the price tier and gives a top-of-funnel CTA distinct from the offer form).
- Cards reveal via `<PaintMask />` driven by ScrollTrigger. **Odd cards reveal left→right, even reveal right→left** — alternating roller direction creates rhythm.
- Number badge `01`–`06` per card, hand-drawn SVG with `stroke-dashoffset` draw-on.
- Hover: a single drip forms at the card's bottom edge and stretches ~30 px before easing back. Card lifts 4 px.

### 6.3 Process — "the pinned wall" (Terminal-style sticky scene)
- This is the centerpiece. Replicates Terminal's pinned benefit pattern.
- Section pins for ~400vh. Inside: 4 stages — `Inspectie → Voorbereiding → Schilderen → Oplevering`.
- Background "wall" color changes between stages — a roller fixed to the right edge of the viewport visibly re-paints the wall as scroll progresses. Use ScrollTrigger `scrub: 1`.
- Each stage shows a number (`01`–`04`), a heading, a 2–3 sentence description, and a hand-drawn icon. Text fades in / out per stage; the wall color is the *continuous* element.
- Mobile: unpin and stack; replace the background sweep with sequential card reveals.

### 6.4 Portfolio — "masked reveals"
- Grid of 9–12 project cards. Each project image is masked behind a **unique** brush-stroke SVG path (build a library of ~6 stroke shapes and rotate).
- On scroll into view: mask scales/translates so the image emerges as if painted on. Stagger 80 ms.
- Click → modal with full case (lightbox-style, with paint-splash open transition).

### 6.5 Color palette switcher — "live re-coat" *(showcase moment)*
- Six paint cans displayed horizontally **[invented labels]**, drawn from across all three palette directions so the switcher doubles as a live tour of the alternates:
  1. `Delft Blue` *(default — Hollandse Meesters)*
  2. `Saffraan` *(Hollandse Meesters)*
  3. `Carmijn` *(Hollandse Meesters)*
  4. `Mosgroen` *(Kalk Modern alt)*
  5. `Geroost Siena` *(Atelier Studio alt — Burnt Sienna in NL)*
  6. `Stoffig Blauw` *(Kalk Modern alt)*
- Each labeled in `Caveat` hand-script.
- Click a can → a roller of that color enters from off-screen and physically sweeps across the viewport, replacing the site's accent color in its wake.
- Palette persists in `localStorage`. Default returns after 24h or on explicit reset.
- Phase 6+: paint cans are real 3D models (`@react-three/fiber`) with mouse parallax + click animation. Until then, use illustrated 2D cans.

### 6.6 Testimonials — "tape on the wall"
- Quote cards rendered as if **taped to a wall** with painter's tape. Tape corners peel slightly on hover.
- Customer photo masked with a drip-shaped silhouette.
- Three quotes; auto-rotate disabled by default (respect attention). Mark all entries with `<!-- DEMO -->` in source.
- Fictional testimonials **[locked 2026-05-01]**:

  1. > "Drie weken werk, geen vlekken op de vloer, geen haast in de afwerking. Precies wat we hoopten."
     > — *Marieke, Utrecht — grachtpand interieur in kalkverf*

  2. > "Afspraak op dinsdag, oplevering vrijdag. Het houtwerk ziet eruit alsof het er altijd al bij hoorde."
     > — *Bram, Haarlem — kozijnen en binnendeuren*

  3. > "Vooraf doordacht, achteraf opgeruimd. Dat is wat ik wilde."
     > — *Anouk, Amsterdam — slaapkamer en hal*

### 6.7 Contact / CTA — "the splash"
- Full-bleed section, dark background.
- Big headline: `Klaar voor een nieuwe kleur?`
- Form: name, email, phone, project type (select), message. `react-hook-form` + Zod, posts to a Next.js Route Handler that calls Resend.
- Each input's underline is **drawn in by a tiny brush** when focused (GSAP, 200 ms).
- Submit button click → full-screen `<PaintSplash />` from button origin, then "thank you" view fades in inside the splash's painted area.

### 6.8 Footer
- Minimal. Linen background. Hand-painted-looking divider stroke. No animation — let the eye rest.
- Fictional company details **[locked 2026-05-01]**. Wrap every line below in `<!-- DEMO -->` markers in source so a future find/replace can swap them wholesale:
  - **Address**: `Studio Kalk · Oudegracht 247, 3511 NL Utrecht`
  - **KvK**: `[DEMO] 76234891`
  - **BTW**: `[DEMO] NL004621987B01`
  - **Phone**: `[DEMO] +31 30 218 4732`
  - **Email**: `[DEMO] hallo@studiokalk.nl`
  - **Socials**: Instagram + LinkedIn only, both linking to `#` for now (no Pinterest, no other channels).

---

## 7. Page transitions

Use Framer Motion `AnimatePresence` at the layout level:
- Exit: paint splash from the last clicked element (capture coords on click).
- Enter: new page fades up inside the painted region of the splash.
- Duration cap: 700 ms. Respect reduced motion → instant cross-fade.

---

## 8. Pages to build

1. `/` — Homepage (above)
2. `/diensten` — Services index + per-service detail (`/diensten/[slug]`)
3. `/projecten` — Portfolio grid + detail (`/projecten/[slug]`)
4. `/over-ons` — Story, team photo, certifications
5. `/contact` — Form + map + phone
6. `/offerte` — Multi-step quote wizard (3 steps with brush-drawn progress bar)

CMS layer: **stub for now** with typed JSON in `/content`. Architect the data layer cleanly so I can swap to Sanity or Storyblok later without rewriting components.

---

## 9. Accessibility (hard requirements)

- `prefers-reduced-motion: reduce` → all paint animations replaced with instant static states. Site must remain visually rich (use already-painted SVG variants).
- Keyboard navigation: all interactive elements reachable, focus rings styled as a **drawn brush rectangle** (custom `:focus-visible` outline).
- Color contrast WCAG AA min, AAA for body text.
- Form errors announced via `aria-live`.
- Custom cursor never replaces `:focus` indicators.
- Touch devices: cursor disabled, hover effects re-mapped to in-view reveals.
- All decorative SVG: `aria-hidden="true"`. Meaningful SVG: `<title>` + `role="img"`.

---

## 10. File structure

```
/app
  /[locale]
    layout.tsx                  // ScrollSmoother + i18n provider + cursor
    page.tsx                    // homepage composes section components
    /diensten/page.tsx
    /diensten/[slug]/page.tsx
    /projecten/page.tsx
    /projecten/[slug]/page.tsx
    /over-ons/page.tsx
    /contact/page.tsx
    /offerte/page.tsx
  api/
    contact/route.ts            // Resend
/components
  /paint                        // §5 primitives
  /sections                     // Hero, Services, Process, Portfolio, Palette, Testimonials, ContactCTA, Footer
  /ui                           // shadcn components (overridden styles)
/content
  services.ts, projects.ts, testimonials.ts, palettes.ts
/lib
  gsap.ts                       // plugin registration, smoother instance
  cursor.ts
  i18n.ts
/messages
  nl.json, en.json
/public
  /strokes/*.svg                // brush stroke library
  /textures/canvas.webp, paper.webp
  /models/paint-can.glb         // Phase 6+
/sandbox                        // dev-only primitive QA route
```

---

## 11. Phased delivery

**Phase 0 — Foundation** *(approval gate before continuing)*
- Initialize Next.js 16 / TS / Tailwind v4 / shadcn / next-intl
- Set up GSAP, ScrollSmoother, Lenis decision documented
- Implement `<CanvasTexture />`, `<BrushCursor />`, `useReducedMotion`
- Build `/sandbox` route
- Output: a blank canvas page with cursor + texture working, deployed to a Vercel preview

**Phase 1 — Paint primitives**
- All §5 components implemented with reduced-motion fallbacks
- Document each in `/sandbox` with three states: idle, animating, reduced-motion

**Phase 2 — Hero**
- Full hero section with roller sweep + DripCounter + headline mask reveal

**Phase 3 — Services + Process**
- Services grid with alternating reveals
- Pinned Process scene with continuous wall re-paint (the showcase scroll moment)

**Phase 4 — Portfolio + Testimonials**
- Masked grid + lightbox + tape testimonials

**Phase 5 — Contact + Footer + page transitions**
- Form + Resend integration (waits for API key)
- AnimatePresence splash transitions between routes

**Phase 6 — 3D paint can palette switcher** *(approval gate — confirm scope)*
- React Three Fiber scene, lazy-loaded
- Replace 2D cans with 3D model

**Phase 7 — i18n + content**
- All copy in nl.json + en.json
- Wire all text through `useTranslations`

**Phase 8 — Performance + a11y pass**
- Lighthouse, axe, manual reduced-motion + keyboard test
- Fix anything below targets in §3

**Phase 9 — Production polish**
- Meta, OG images (use a brush-stroke OG template), sitemap, robots
- Privacy / cookies (Dutch market — minimal banner, no consent wall unless analytics added)

---

## 12. Output expectations after each phase

After **every** phase, post:
1. What was built (3–5 bullets)
2. Screenshot or short screen recording link
3. Anything that diverged from this spec + why
4. What's blocking the next phase, if anything

Keep code in PRs / branches per phase: `phase-0-foundation`, `phase-1-primitives`, etc.

---

## 13. What this site must *not* be

- Not a Webflow/Wix-feeling stock template
- Not a generic "construction company" theme
- Not over-animated. Restraint is the point. Every motion earns its place.
- Not slow. If the painter metaphor ever conflicts with performance, performance wins.
- Not inaccessible. If the painter metaphor ever conflicts with a11y, a11y wins.

---

## 14. Start here

Begin with Phase 0. After scaffolding, show me:
- The blank canvas page on a Vercel preview
- A working `<BrushCursor />`
- The `/sandbox` route empty but routable
- Your decision (Lenis vs ScrollSmoother) with one sentence of reasoning

Then wait for "go" before Phase 1.
