# ZINSTIM — MASTER

Read this file first, every session, before anything else.

---

## 0. WHAT THIS IS

The single source of truth for the ZinStim brand and website. Everything below
is either decided, proposed, or open. Nothing gets built from a proposal.

**Brand:** ZinStim. Zinc + Stim. Fitness brand, Bangladesh-founded.
**Sells:** apparel, creatine and protein, accessories (watches, fitbands).
**Position:** a brand that sells confidence and tells a story. Product is the proof, not the pitch.
**Site style brief (from Kash):** breathing spacious minimalism, modern, cool font
effects, 3D introduced gradually.

---

## 1. OPERATING RULES

**R1 — Read before write.**
Read this file, then only the sub-file relevant to the task. Do not read
everything every time.

**R2 — Proposals live in files, decisions live in the log.**
Anything I invent is `PROPOSED`. It becomes `DECIDED` only when Kash says so,
and only then does it move into section 3 of this file. Never build off a
`PROPOSED` item.

**R3 — One file per layer. No new files without asking.**
The tree in section 2 is the whole structure. If something new is genuinely
needed, ask first and say what it replaces.

**R4 — Optimised output.**
Files are reference documents, not essays. Tables and specs over prose. No
restating what another file already says — link to it instead.

**R5 — Overwrite, don't accumulate.**
When a spec changes, edit the existing line. Do not append a new version below
the old one. History goes in the decision log, not in the spec.

**R6 — Previews are self-contained.**
`brand.css` and `nav.js` are canonical, but the HTML files inline a copy so they
open standalone — relative paths do not resolve in a preview pane. After editing
either canonical file, run `inline.py` to push the change into every
HTML file. Never hand-edit the inlined copies.

**R7 — Cleanup pass.**
At the end of a work session: empty `99-scratch/`, delete any file that no longer
has a job, confirm every `PROPOSED` item is either promoted or removed, update
"current state" below.

**R8 — No design defaults.**
Cream background + high-contrast serif + terracotta accent is the generic AI
house style. So is the rounded-card grid with identical shadows, and the
all-caps eyebrow label above every heading. If a choice could belong to any
brand, it does not belong to this one.

---

## 2. STRUCTURE

```
Zinstim/
├── ZINSTIM.md              you are here — rules, decisions, current state
├── theme.md                theme direction, nav naming, voice
├── tokens.md               the reasoning behind brand.css
├── components.md           nav capsule, three doors, divider
├── structure.md            pages, IA, section-by-section
├── brand.css               ← the system as code. single source of truth
├── nav.js                  nav behaviour, progressive enhancement
├── inline.py               build step — run after editing brand.css or nav.js
├── styleguide.html         live reference — open this to see everything
├── index.html              homepage
├── origin.html             the story page
├── elements.html           three doors — the range index
└── fuel.html               Fuel category page with lab panel
```

---

## 3. DECISION LOG

Only confirmed decisions. Newest at top.

| Date | Decision | Where it lives |
|---|---|---|
| 07 Sep | **The nav is sticky, and it needs its own opaque ground.** It travels over full-bleed obsidian bands, so without a background the obsidian nav type disappears into them. Hairline appears only once you have left the top (`is-stuck`, toggled in `site.js`). | `brand.css` §nav, `site.js` |
| 07 Sep | **The mark is the real artwork, used twice.** The nav's grammar is crossfade — the capsule label, the door faces — so the mark follows it: at rest the artwork is a **mask filled with `currentColor`** (so the silhouette is genuinely ours but the colour obeys the palette: Obsidian on light, Zinc Silver on dark), and on hover the artwork itself fades up, carbon and all. Reveal over display, on the smallest element on the page. Masking is the enhancement; without support the artwork simply shows at rest. | `brand.css` §nav, all pages |
| 07 Sep | **Source art is 244KB–1.9MB and glossy red, so it cannot be dropped in raw.** `ZinstimLogo.svg` is a 1.9MB PNG in an SVG wrapper. `z-emblem.svg` is real vector but a VTracer auto-trace of the render: 2,591 paths, **1,603 fill colours**, 302KB, no `viewBox`, coordinates to x −551 against a declared width of 960 — unusable at 25px and impossible to recolour. What ships is `assets/img/zinstim-mark.png`, the mark resampled to 128px, **23KB**. If a true outline export ever appears (1–2 paths, flat, one colour, proper viewBox), swap it in — the CSS will not need to change. | `assets/img/`, `brand.css` §nav |
| 07 Sep | **Rollcall tracking cannot go tighter than -.012em.** At 900 weight / 78 width the pair "rn" closes into an "m" at display size — "worn" was reading as "worm". Tracking is the fix; it also widens every line, which is why the size clamp came down with it. | `brand.css` §rollcall |
| 07 Sep | **The rollcall is sized by its longest phrase, not by "Confidence".** The slot masks with `overflow:hidden`, which clips sideways as well as down, so an over-long line is cut off mid-word rather than overflowing visibly. Mask height and the distance a word travels are the same custom property (`--slot-h`): a percentage throw resolves against the word's own line box, not the mask, which is how parked words end up peeking along the bottom edge. The hero uses `.shell--full` so display type is not held to the 66ch body measure. Measured clear at 1440 / 1024 / narrow. | `brand.css` §rollcall |
| 07 Sep | **`dotmark.js` sized its canvas from `parent.clientWidth`, which includes padding.** The canvas came out wider than the column it sits in, putting a horizontal scrollbar on every page at any viewport narrower than the shell's max-width. It now subtracts the padding, with `max-width:100%` in CSS as a second line of defence. The four pages that carried their own inline copy of the script were pointed at the shared file, so the fix reaches all of them and ~640 duplicated lines went with it. | `dotmark.js`, `brand.css`, all pages |
| 07 Sep | **Origin opens with the rollcall, and it cycles.** Full-bleed obsidian hero: "Confidence / is / …" where the third line turns through five payoffs. The About-Nike construction, built from our own type. It **opens on the motto** (built, not worn.\*) so the first line read is the one the brand stands on, holds each line 3.2s, and comes back round — roughly a 16s turn. Kash's call, overriding the "nothing loops" line in `tokens.md`; the pace is a reading pace, not a ticker, and it pauses off screen. The footnote is tied to the starred line and comes and goes with it. The four non-motto phrases are `aria-hidden`, so the H1 reads "Confidence is built, not worn." | `brand.css` §rollcall, `site.js`, `origin.html` |
| 07 Sep | **Pull-quote block — the trevornoah.com device.** Marks, one line at scale, hairline, stacked attribution. Reusable on any band, light or dark. **It does not colour a word:** that reference tints one word of the quote, and `tokens.md` forbids accenting a single word in a headline with colour, so emphasis is italic — already the house move. Attribution is self-referential (ZinStim / The Origin) and must stay that way; there are no third-party quotes to publish and inventing one would be the same failure as inventing lab figures. | `brand.css` §quote, `origin.html` |
| 07 Sep | **Motto: Confidence is built, not worn.** The brand line. "Not bought at checkout" is the footnote that explains it. | `origin.html` |
| 07 Sep | **The Dhaka section is cut from Origin.** "Why Dhaka" framed the brand around a location rather than around the argument. The three lab commitments it contained were kept and remounted under "When Fuel goes on sale", which is what they were actually about. Dhaka still appears in the global footer. | `origin.html` |
| 07 Sep | **Wear has its own page. `elements.html` is an index, not a category.** Every "Wear" link used to land on `elements.html`, so clicking Wear showed a page titled Elements and a nav reading Elements — the category and the chooser were the same file. `wear.html` now holds the apparel; `elements.html` stays as the three-door index. The categories are: **Wear = clothing · Fuel = supplements, the main line · Instruments = accessories.** | `wear.html`, `elements.html` |
| 07 Sep | **`instruments.html` says it is empty instead of faking a range.** It was a copy of `elements.html`, so the Instruments door led to the same chooser again. It is now a real page that states there is no supplier, no sample and no date, and links to the two doors that are open. Do not populate it with renders. | `instruments.html` |
| 07 Sep | **Instruments is back as a third door.** Kash's call, and it supersedes the 06 Sep cut below. `instruments.html` exists and is in every nav. The objection in that row still stands — there is no product behind the door yet — so treat the page as a placeholder, not a shipped category. | every page, `brand.css` |
| 07 Sep | **The face swap is a crossfade of two layers, not a font-family switch.** `font-family` cannot be transitioned, so each door carries its word twice — base in Archivo, alternate in the category's face — and hover crossfades them with a spring on the scale. Same construction the Aardvark reference uses. Reverting this to a single element with `:hover{font-family:…}` puts the hard cut back. | `brand.css` §doors |
| 07 Sep | **Door alternates use no new families.** Wear → Instrument Serif italic, Fuel → Space Mono, Instruments → Archivo pushed wide and light (`wdth 125 / wght 300`). The width axis already carries hierarchy everywhere else, so Instruments did not need a fourth font download. | `brand.css` §doors |
| 07 Sep | **Door cards are placeholders and their positions live in CSS.** Four per category, staggered in, positioned by `nth-child` in `brand.css` so no page carries a number. Drop an `<img>` inside a `.door-card` when photography exists. | `brand.css` §doors |
| 07 Sep | **"Wear", not "Worn", everywhere.** Five pages said Worn, `index.html` said Wear, `theme.md` decided Wear. Standardised on the logged name. | every page |
| 06 Sep | **Instruments cut from launch. Two categories: Wear and Fuel.** Nothing exists behind a third door — no product, no supplier, no sample. An empty category is the first promise the site cannot keep, on a brand whose argument is that it does not do that. Add it back when there is something to put in it. | `theme.md`, `elements.html` |
| 06 Sep | **The lab panel ships empty.** Results read "Pending" until an accredited independent lab returns a real batch. Fabricated numbers were removed. The supplier's own COA is also unusable — invalid Salmonella spec, "Complies" in place of figures, blank QC signature, limits 10x looser than their own TDS. | `fuel.html` |
| 06 Sep | **Runway product section.** Sticky centre track, garment travelling as you scroll, specs lighting one at a time, counter at the base. Scroll-driven, never autoplaying. | `brand.css` |
| 06 Sep | **Dotted wordmark closes every page.** Halftone ZINSTIM via `background-clip:text` — real text, not an image. | `brand.css` |
| 06 Sep | **Type: Archivo, not Instrument Serif.** Serif was elegant; the brand needs energy. Heavy+narrow display (900/78), body at 400/95. Width carries hierarchy, not a second typeface. | `brand.css`, `tokens.md` |
| 05 Sep | **Theme: TRACE.** The thing that matters most is the thing you never notice. | `theme.md` |
| 05 Sep | **Zinc is named once**, as a single divider, then never again. No atomic numbers, no lab language. | `theme.md` |
| 05 Sep | **Launch is story-first.** Waitlist only, nothing for sale. Removes the DGDA dependency entirely. | `theme.md` |
| 05 Sep | **Bangladesh first, diaspora second.** Bangla sits beside English with equal standing, not as a toggle. | `theme.md` |
| 05 Sep | Navs: **Origin** · **Elements** → **Wear** / **Fuel** | `theme.md` |
| 05 Sep | **No React.** Static multi-page plus cross-document view transitions. See note below. | `brand.css` |
| 05 Sep | **Section breaks cleave, they do not tear.** Zinc is brittle at room temperature and fractures along crystal planes, so the edge is angular and faceted rather than soft and fibrous. Trevor Noah's effect, derived from our own material. | `brand.css` |
| 05 Sep | **The teal dot means one thing: you are here.** Origin, or the collapsed capsule label. Never two at once. | `brand.css` |

**Rejected, so they don't come back around:** *The Work* (strong but Nike owns
that ground, and it isn't specific to ZinStim). *Signal* (positions you against
Whoop and Oura with a creatine tub — revisit only if accessories ever lead).

### Carried in from earlier brand work
- Logo mark: swept blade-form Z, single closed path, legible at 16px
- Zinc Silver `#D6DDE2` · Obsidian `#0D0D0D` · Flame Teal `#00E0B8`
- Mark never appears in Flame Teal. On light surfaces it flips to Obsidian.
- **Bone `#EFEBE4` dropped** — warm, argued with the material story, and sat too
  close to the default generated-page cream. Replaced by Zinc Wash `#E9ECEE`.
  Reasoning in `tokens.md`.

---

## 4. CURRENT STATE

**Done**
- Figma reviewed. Nav prototype and critique stickies captured in `structure.md`.
- Theme decided: Trace. `theme.md` trimmed to the chosen direction only.
- Tokens written — colour, type, space, motion. `tokens.md`.
- Components specced — nav capsule, three doors, divider. `components.md`.
- Site IA and page structure in `structure.md`.

**Waiting on Kash**
1. Approve the type call — one width-variable family per script (Archivo / Anek Bangla)
2. Approve dropping Bone for Zinc Wash
3. Pick the divider line — three candidates in `02-system/tokens.md`, recommendation noted

**Done (06 Sep)**
- Elements index — two door bands, full viewport each
- Fuel category page with the lab panel in its pending state
- Runway product section and dotted wordmark on the homepage
- Local and chat versions merged into this single flat folder

**Next**
- Real photography to replace the plate placeholders and the SVG tee
- Product detail page — the Aardvark reveal belongs there
- Commission the first independent lab panel, then fill `fuel.html`
- 3D last, and only where it earns its weight

**Fixed in the merge, worth knowing about**
- `elements.html` had an unterminated `<style>` block — everything between the
  page CSS and `</head>` was being parsed as CSS. Closed.
- `fuel.html` shipped invented lab results with "Pass" on every row, and the
  marquee was advertising the invented assay figure. Both removed.
- `.cleave--light` had its fill and background swapped, producing a hard seam
  instead of a fracture. Fixed.
- The `Elements` capsule label was a decorative `aria-hidden` `<span>` with no
  `href` on every page — there was no way to click through to `elements.html`
  itself, only to `Wear`/`Fuel` inside it. Now a real link. `fuel.html`'s
  current-page script also rewrote the label text to "Fuel" without updating
  its `href`, so the visible label pointed at the wrong page — fixed alongside it.

---

## 5. STACK

**No React.** An SPA does not make this site faster, it front-loads the cost.
React plus ReactDOM is roughly 40–50KB gzipped before a line of our own code,
and nothing renders until it downloads and executes. A story-first launch site
gets one or two page views per visitor, so we would pay that on the load that
matters most and never collect the benefit. Bangladesh-first means mobile data
and mid-range Android, which makes it worse. And a brand nobody has heard of
needs to be findable, which client rendering makes harder than it needs to be.

**What we use instead.** Static multi-page, with:

```css
@view-transition { navigation: auto; }
```

Cross-document view transitions fire on same-origin navigation when both pages
opt in. The nav carries `view-transition-name: primary-nav`, so it survives the
page load instead of re-mounting and re-animating — which was the real problem
worth solving. Supported in Chrome 126+, Edge 126+, Safari 18.2+ and iOS 18.2+.
Firefox has not shipped it and gets a normal page load; nothing breaks, because
it is purely a progressive enhancement.

Add speculation rules to prefetch on hover and navigation is effectively
instant.

**If we want component authoring** — so the nav is not copy-pasted into six HTML
files — the answer is **Astro**, not React. It ships static HTML with near-zero
JS, has view transitions built in, and a React component can still be dropped in
later if one specific feature genuinely needs client state.

React becomes correct when there is real client state: a cart, an account, a
configurator. We have none of those, and story-first with a waitlist is the most
static site imaginable.

---

## 6. KNOWN TENSIONS

Flagging these because they will cause churn if left unresolved.

**MUTANT and Under Armour do not match the brief.**
MUTANT is loud, dark, chrome, aggressive. Under Armour is athletic-corporate.
Neither is spacious minimalism. The Awwwards references (illoca, Trevor Noah,
Aardvark) are editorial, playful, experimental — a different world entirely.
Pick a lane. The Awwwards lane is the more distinctive one and matches the
stated brief; MUTANT is the category default.

**The KORA file is the generic default.**
`Shop · Drop 01 — KORA.html` uses cream `#EDE7DB`, serif display, clay accent.
That is the exact combination that reads as AI-generated right now. Useful as a
structural reference for markup. Do not carry its look into ZinStim.

**The AI try-on idea is a product, not a feature.**
The Figma stickies describe photo upload, AI generation, ad-subsidised
subscription, and a self-maintaining agent. That is a separate build with its own
cost model. Park it. It does not belong in v1 of a brand site.
