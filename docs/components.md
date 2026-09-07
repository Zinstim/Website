# COMPONENTS

Only the components that exist. This is not a library — it grows when something
is actually needed, not in anticipation.

---

## 1. NAV CAPSULE

The first thing on the site that rewards curiosity. It is a small demonstration
of the whole site's behaviour.

```
rest        ⌂              Origin   [ Elements ]

hover       ⌂        Origin  [ Wear │ Fuel │ Instruments ]
                                ▔▔▔▔  indicator follows cursor
```

**Behaviour**

| | |
|---|---|
| Rest | Capsule shows one word: Elements |
| Hover / focus | Capsule widens from its centre, revealing three children |
| Indicator | One pill, slides between children. Transform only — never animate width and position together, it reads as elastic and cheap |
| Collapse | Returns on mouse-leave or focus-out, after a short delay so a diagonal cursor path does not close it |
| Origin | Sits left of the capsule. Centred as a pair with it, per the brief. Note the Figma centres the capsule alone — the brief wins |
| Home | Icon only, far top-left, fixed. Never the word "Home" |

**Why expansion rather than a dropdown.** A dropdown covers the page and reads as
software. Expansion keeps the eye on a single object and makes the nav itself the
first reveal on the site. Same principle as everything below it.

**Accessibility**

- Hover-only is unreachable by keyboard. Focus triggers the identical expansion.
- Real `<nav>`, real links. Not divs with handlers.
- Reduced motion: the indicator jumps instead of sliding. Nothing is lost.
- The capsule must be operable and readable before any JavaScript loads.

---

## 2. THE THREE DOORS

The homepage section that sends people into the range. Built from the MacBook Air
frames in the Figma — three centred items with imagery scattered around them,
shifting per item.

```
              [ image ]

                  Wear
                  Fuel                    [ image ]
                  Instruments

   [ image ]
```

**Behaviour**

| | |
|---|---|
| Rest | Three words, centred, quiet. Imagery present but held back — dimmed, small, or partially cropped |
| Hover an item | The surrounding imagery changes to that category's. The other two words recede |
| Movement | Imagery shifts position, it does not fade-swap. The repositioning is the reveal |
| Click | Commits to the category page |

**Not a grid.** A grid says shop. This says choose. Three words with room around
them ask a question; nine thumbnails answer one nobody asked.

**Accessibility.** Keyboard focus produces the same state as hover. Imagery is
decorative and hidden from screen readers — the three words are the content.

---

## 3. DIVIDER

The Trevor Noah device. Type at a scale that stops the scroll.

| | |
|---|---|
| Type | Archivo Expanded, heavy. Edge to edge with minimal side margin |
| Leading | Tight. Lines nearly touching — the block should read as a shape first, words second |
| Space | `2xl` above and below. More than feels comfortable |
| Colour | Obsidian on Zinc Wash, or inverted for a full-bleed dark band |
| Motion | Reveals once on scroll into view. Never re-animates |
| Frequency | Four or five per page maximum. The fifteenth one is wallpaper |

**Content rule.** A divider is a claim, not a label. "Two grams" is a divider.
"Our Products" is a heading pretending to be one.

---

## NOT BUILT YET

Deliberately absent until there is a real need:

- Product card — waiting on whether launch is waitlist-only
- Waitlist form — needed for v1, spec it when the homepage is real
- Footer — trivial, do it last
- Any 3D — last, and only where it earns its weight

---

## QUALITY FLOOR

Applies to everything, stated once so it does not need repeating per component.

- Works down to mobile
- Visible keyboard focus on every interactive element
- `prefers-reduced-motion` honoured
- Contrast checked against the values in `tokens.md`, not eyeballed
- Readable and navigable before JavaScript loads
