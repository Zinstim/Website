# ZinStim — Website

Static site. No build step. Clone it and open `index.html`.

## Structure

| Path | What |
|---|---|
| `*.html` | Pages, served from root |
| `assets/css/brand.css` | The design system. Single source of truth. |
| `assets/js/` | Nav behaviour and shared page scripts |
| `docs/` | Brand system, decision log, component specs |
| `styleguide.html` | Live reference for the whole system |

## Working on it

No install, no server needed. Edit and refresh.
For view transitions and correct path resolution, serve locally:

    python -m http.server 8000

Read `docs/ZINSTIM.md` first. Read `AGENTS.md` if you are an AI.

## Stack

Static HTML, CSS custom properties, vanilla JS. Cross-document view transitions
for navigation. No framework — see `docs/ZINSTIM.md` §5 for why.
