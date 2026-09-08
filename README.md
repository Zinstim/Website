# ZinStim Website

ZinStim is a static, multi-page brand website for a Bangladesh-founded fitness and wellness brand. The site is intentionally framework-free, with a strong emphasis on editorial storytelling, minimal design, and smooth navigation interactions.

This repository contains the live marketing site, design system, documentation, and GitHub Pages deployment setup.

## Overview

- Static HTML site with no build toolchain
- Design tokens and visual system defined in one stylesheet
- Vanilla JavaScript for progressive enhancement and nav behavior
- GitHub Pages deployment via a workflow in `.github/workflows/pages.yml`
- Brand and product storytelling structured around Origin, Elements, and category pages

## Tech Stack

- HTML5
- CSS custom properties and responsive design
- Vanilla JavaScript
- GitHub Pages
- No React, no npm, no framework required

The project deliberately avoids a frontend framework because the site is mostly static storytelling and marketing content. The design system and decision rationale are documented in `docs/ZINSTIM.md`.

## Repository Structure

```text
.
├── .github/
│   └── workflows/
│       └── pages.yml
├── assets/
│   ├── css/
│   │   └── brand.css
│   └── js/
│       ├── nav.js
│       └── site.js
├── docs/
│   ├── ZINSTIM.md
│   ├── structure.md
│   ├── theme.md
│   ├── tokens.md
│   └── components.md
├── AGENTS.md
├── index.html
├── origin.html
├── elements.html
├── wear.html
├── fuel.html
├── instruments.html
├── styleguide.html
├── dotmark.js
├── ZinstimLogo.png
├── ZinstimLogo.svg
├── ZinstimLogo_cropped.png
├── ZinstimLogo_mark.png
├── README.md
├── .editorconfig
└── .gitignore
```

## What each important file does

### `index.html`
Main landing page. Controls the hero, the three-door navigation section, the runway product story, and the waitlist CTA.

### `origin.html`
The brand story. Opens with the **rollcall** hero — "Confidence / is / …" where the third line turns through five payoffs on a slow cycle, and closes with the **pull-quote** block.

Things about the rollcall that are easy to break:

- **The motto is first in the DOM on purpose.** The hero opens on *built, not worn.* so the first line anyone reads is the one the brand stands on. Reordering the spans changes what the page says first.
- **It holds 3.2s per line** — about a 16-second turn. That is a reading pace, not a ticker. It pauses when scrolled off screen.
- **The four non-motto phrases are `aria-hidden`.** Without that the `<h1>` is read aloud as one run-on sentence. Only the motto is content.
- **The footnote is tied to the starred line** via `data-note`, so it appears and leaves with it rather than sitting under an unrelated phrase.

### The `.quote` block
A reusable pull-quote: marks, one line at scale, hairline, attribution. Drop it on any band — it flips its own greys on light. Keep quotes under ~18 words. Emphasis is **italic, never a colour** — see the decision log.

### `elements.html`
The range **index** — not a category. Three full-viewport door bands that send you into Wear, Fuel or Instruments. Nothing is sold here; it is a chooser.

### The three categories

| Page | Category | Contains |
|---|---|---|
| `wear.html` | Clothing | Drop 01 — Training Tee, Floor Short |
| `fuel.html` | Supplements — the main line | Creatine monohydrate, plus the lab panel |
| `instruments.html` | Accessories | Nothing yet. Deliberately empty. |

### `wear.html`
Apparel. Uses the shared `.kit` grid, so the two pieces here and the ones on the homepage are the same component with the same specs.

### `fuel.html`
The supplement line and the published lab panel. **The lab table ships empty on purpose** — see the decision log before touching it.

### `instruments.html`
Accessories — watches and fitbands. There is no supplier, no sample and no date, so the page says exactly that and points at the two doors that are open. Do not fill it with renders of products that do not exist.

### `assets/css/brand.css`
This is the single source of truth for the design system. It defines:

- color palette
- type scales and font settings
- spacing tokens
- motion timing and easing
- navigation styles
- layout patterns
- reveal/scroll animation behavior

### `assets/js/nav.js`
Handles the interactive navigation capsule, hover/focus behavior, and current-page state for the primary nav.

### `assets/js/site.js`
Everything else that responds to the reader: the page-load settle, scroll reveals, the doors hover/focus controller, the runway scroll track, and the marquee.

### `dotmark.js`
The interactive ZINSTIM wordmark that closes each page. A canvas particle field that reads the letterforms as pixels and repels from the cursor. It only animates while on screen, to save battery.

**Every page must load both `nav.js` and `site.js`.** If a page drops `nav.js` the nav capsule silently stops opening — it degrades to plain links rather than throwing an error, so it is easy to miss.

### `docs/ZINSTIM.md`
The master brand and site design brief. Read this first. It includes the rules, branding rationale, decision log, and current state.

### `.github/workflows/pages.yml`
GitHub Actions workflow for deploying the static site to GitHub Pages.

## How the site is set up

This is a static multi-page website rather than a framework app:

1. Each HTML file is served directly from the root folder.
2. Shared styling lives in `assets/css/brand.css`.
3. Shared interaction behavior lives in `assets/js/nav.js` and other script files.
4. Cross-document view transitions are enabled via CSS to keep navigation smooth when switching pages.
5. GitHub Pages publishes the repository root directly.

The project is built around a system-first design philosophy. Instead of using a JavaScript framework for a mostly static site, the code focuses on performance, simplicity, and clean brand storytelling.

## The two interactions worth understanding

Most of the site is plain markup. Two pieces are not, and both get broken by well-meaning edits.

### The nav capsule

At rest the nav shows one word. On hover or focus it widens from its centre into a dark pill holding Wear, Fuel and Instruments. Origin fades out so the capsule can expand without pushing anything.

The important part: **focus does everything hover does.** Hover-only would make the nav unreachable by keyboard. `nav.js` is progressive enhancement — the links work before it loads.

### The doors (homepage)

Hovering a category does two things at once:

1. **The word changes typeface.** `font-family` cannot be transitioned, so each door carries its word *twice* — a base copy in Archivo and an alternate copy in the face belonging to that category — stacked on top of each other. Hover crossfades between the two layers and springs the scale. Collapsing this back to a single element with `:hover { font-family: … }` reintroduces the hard, glitchy cut.
2. **That category's cards arrive.** Four per category, fading up from nothing with a stagger, into positions that belong to that category alone.

Faces: Wear → Instrument Serif italic, Fuel → Space Mono, Instruments → Archivo pushed wide and light. No fourth font is downloaded — the width axis carries it.

The cards are **empty placeholders**; there is no photography in the repo yet. When there is, put an image inside a card and it fills it automatically:

```html
<span class="door-card"><img src="assets/img/tee-01.jpg" alt=""></span>
```

Card positions live in `brand.css` (via `nth-child`), not in the page, so no page carries a layout number.

## Things that have broken before

Worth reading before an edit, because each of these has actually happened:

- **A page dropped `nav.js`** and the capsule stopped animating on that page only. Nothing errors; it just goes inert.
- **Inline `<style>`/`<script>` blocks drifted** out of sync with `brand.css` and `site.js`. The inline copy wins over the stylesheet, so the shared fix appears to do nothing. Keep CSS and JS in `assets/`.
- **A literal `` `n `` was written into five pages** by a PowerShell script that meant to write a newline, and rendered as visible text.
- **The runway went blank for most of its scroll** because `site.js` cycled three products while the page contained one.
- **Fabricated lab numbers** were published on `fuel.html`. They were removed. Do not put figures back until a real accredited lab returns a batch.

## Local development

Because this is a static site, you do not need npm install or a build step.

### Option 1: Open directly
Open `index.html` in a browser.

### Option 2: Serve locally for best results
Run:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

This is recommended because page-to-page view transitions and relative path behavior are more reliable when served from a local web server.

## Deployment

Hosted on GitHub Pages, published by `.github/workflows/pages.yml`. Every push to `main` uploads the repository root as-is and deploys it — there is no build step.

**Repository:** `Zinstim/Website`
**Live URL:** `https://zinstim.github.io/Website/`

To publish a change:

```bash
git add -A
git commit -m "your message"
git push
```

Then watch the run under the repository's **Actions** tab. A deploy takes roughly a minute.

One-time setup, if Pages has never been switched on for this repo: go to **Settings → Pages** and set **Source** to **GitHub Actions** (not "Deploy from a branch"). The workflow cannot publish until that is set, and it will fail with a permissions error instead.

Because the site is served from a subpath (`/Website/`), every link and asset reference must stay **relative** — `assets/css/brand.css`, not `/assets/css/brand.css`. A leading slash resolves to `zinstim.github.io/assets/…` and 404s. To serve from the domain root instead, rename the repository to `Zinstim.github.io`.

## Important project guidelines

Before editing the site, read these files in order:

1. `docs/ZINSTIM.md`
2. The relevant section in `docs/structure.md`, `docs/theme.md`, `docs/tokens.md`, or `docs/components.md`
3. `AGENTS.md` for repo-specific rules and constraints

Some key rules from the project documentation:

- `brand.css` is the single source of truth for design values
- Do not invent product claims or fake lab data
- No framework without an explicit decision to add one
- Keep the static, minimal and brand-first approach intact

## Editing workflow

If you are updating visual styling:

- edit `assets/css/brand.css`

If you are updating navigation behavior:

- edit `assets/js/nav.js`

If you are updating page structure or storytelling:

- edit the corresponding HTML file and keep the design system consistent

## Notes

This project is intentionally minimal and opinionated. It is not a generic website template; it is a curated brand experience optimized for a particular visual and editorial identity.

The design rationale is intentionally documented rather than hidden in code so future edits stay aligned with the brand direction.

## License and usage

This project is a repository for the ZinStim website. Use it as a reference for the current live brand implementation and site structure. If you are contributing, follow the documentation and design rules already outlined in the repo.

## Quick start

```bash
git clone https://github.com/Zinstim/Website.git
cd Website
python -m http.server 8000
```

Then open the site in your browser and start editing the HTML and CSS.
