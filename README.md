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
├── fuel.html
├── instruments.html
├── styleguide.html
├── ZinstimLogo.png
├── ZinstimLogo.svg
├── ZinstimLogo_cropped.png
├── ZinstimLogo_mark.png
├── README.md
└── .gitignore
```

## What each important file does

### `index.html`
Main landing page. Controls the hero, the three-door navigation section, the runway product story, and the waitlist CTA.

### `origin.html`
Brand story page explaining the origin, material concept, and company positioning.

### `elements.html`
Category landing page that organizes the product story into brand sections like Wear and Fuel.

### `fuel.html`
Supplement/product page with the pending lab panel and product education formatting.

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

The repo is configured for GitHub Pages using the workflow in `.github/workflows/pages.yml`.

When changes are pushed to the main branch, GitHub Actions publishes the site.

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
git clone <repo-url>
cd Zinstim
python -m http.server 8000
```

Then open the site in your browser and start editing the HTML and CSS.
