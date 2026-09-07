# AGENTS

Read `docs/ZINSTIM.md` before touching anything. It holds the operating rules,
the decision log, and current state. Most "improvements" an agent might reach for
have already been tried and deliberately rejected — the log says why.

## Hard rules

- `assets/css/brand.css` is the only place design values live. Never hardcode a
  hex, size or duration in a page.
- Never re-inline CSS or JS into HTML. That was removed on purpose.
- No framework, no npm, no build step without a logged decision.
- Save UTF-8. A previous tool re-saved as Windows-1252 and destroyed every
  Bangla character on the site.
- Do not fabricate data. The lab panel in `fuel.html` reads "Pending" because no
  independent test exists yet. Inventing purity figures on a supplement page is
  the single worst thing that can be done in this repo.
- The nav is finished. See `docs/components.md` §1 before altering it.

## Before you commit

- Every page renders
- Nav works by keyboard, not just hover
- `prefers-reduced-motion` still honoured
- No console errors
- Add a row to the decision log in `docs/ZINSTIM.md` for anything non-obvious
