# SITE STRUCTURE

Nav names below use Direction A. If another direction wins, swap the words —
the structure does not change.

---

## WHAT THE FIGMA ALREADY ESTABLISHES

Pulled from the file, so it is not lost.

**Nav prototype (Desktop 1–4)**
A 795px capsule containing three items — Wearables, Product, Accessories — with a
highlight pill that slides between them. Four frames show the pill parked at
left, at Wearables, at Product, and at Accessories. Story sits outside the
capsule to its left.

The capsule is centred in the 1440 frame. Story is not. The brief says both
should be centred, so the group needs to be centred as a unit instead. Spec below
reflects the brief, not the Figma.

**Hover-reveal prototype (MacBook Air 1–2)**
Three items stacked and centred, with three images floating at different
positions around them. Two frames with the images in different spots — this is a
hover state where the surrounding imagery shifts per item. This is the
interaction to build.

**What Kash and Fahim said they liked, verbatim from the stickies**
- The scroll effect of a box opening and showcasing items
- Product reveals treated "as if it's a treasure that needs to be seen through in detail"
- 3D hooks people and makes them want to know what the item is
- The font fade, and the transition effects
- Subtle hover that "brings up interest in what this is" and informs what the tab is about
- Sections where you hover and items are placed around

Consistent theme across all of it: **reveal over display.** Nothing should be
fully visible at rest. That is the organising interaction principle for the site.

---

## NAVIGATION

```
┌──────────────────────────────────────────────────────────────┐
│  ⌂                    Origin    [ Elements ]                 │
└──────────────────────────────────────────────────────────────┘
                                       │ hover
                                       ▼
┌──────────────────────────────────────────────────────────────┐
│  ⌂          Origin  [ Wear  │  Fuel  │  Instruments ]        │
└──────────────────────────────────────────────────────────────┘
                          ^^^^ sliding indicator follows cursor
```

| Element | Spec |
|---|---|
| Home | Icon only, far top-left, fixed. Never a word. |
| Origin + Elements | Centred as a group, not individually |
| Elements | Capsule. Collapsed at rest, expands on hover to reveal three children |
| Indicator | Single pill, slides between children. One element, transform only |
| Expansion | Width animates. Everything else holds position — the capsule grows outward from centre so Origin does not jump |
| Mobile | Capsule becomes a stacked sheet. No sliding indicator |

**Why expand-on-hover rather than a dropdown:** a dropdown covers the page and
reads as software. Expansion keeps the eye on one object and makes the nav itself
the first thing on the site that rewards curiosity. Same principle as the rest of
the site.

**Accessibility, non-negotiable**
- Hover-only means unreachable by keyboard. Focus must trigger the same expansion.
- Indicator movement respects `prefers-reduced-motion` — it jumps instead of slides.
- Capsule is a real nav landmark with real links, not divs with click handlers.

---

## PAGES

### Home
The whole job is one question: what is this, and why should I keep scrolling.

| Section | Content | Interaction |
|---|---|---|
| Hero | One line, very large. No product shot. No button. | Type settles once on load. Nothing else moves. |
| The claim | "Two grams." Full-bleed type as a divider. | Reveals on scroll |
| Three ways in | Wear / Fuel / Instruments as three doors | Hover shifts surrounding imagery — the MacBook Air prototype |
| Origin teaser | Two sentences and a link. Not the whole story. | Static |
| Footer | Waitlist, socials, legal | — |

Deliberately no product grid on the homepage. A grid says shop. The brief says
story. Products live one click away where they get room to breathe.

### Origin
Long-form, scroll-driven. The Trevor Noah reference belongs here more than
anywhere — oversized type as section dividers, sparse imagery, a lot of air.

Beats: where the name comes from · what zinc actually does · why Bangladesh ·
what we refuse to do · who is behind it.

The last one matters. Four named founders with faces is a real trust asset in a
market where counterfeits are the customer's main worry.

### Elements — index
Three doors. Not a grid. Each door is a full viewport band that responds to
hover, then commits on click.

### Elements — Wear / Fuel / Instruments
Per category. Small number of products, each with room. Reveal-on-scroll rather
than a wall of thumbnails.

**Fuel needs a section the others do not:** published third-party lab results.
Numeric heavy metals, not "complies". Full panel, plainly laid out. In a market
where the loudest competitor argument is "other brands source from unverified
suppliers", publishing the actual numbers is the strongest thing on the site.
Treat it as a design feature, not a compliance footnote.

### Product detail
Single product. Large. The Aardvark unboxing reference lives here — the reveal on
scroll, the object turning, the detail worth looking at closely.

---

## BUILD ORDER

1. Nav — it is the hardest interaction and everything else sits under it
2. Home hero and the claim divider — proves the type system works at scale
3. Three-doors hover section — proves the reveal principle
4. Origin — proves the site can hold long-form
5. Elements index and one category
6. Product detail
7. 3D, last, only where it earns its weight

Do not start 3D early. It is the thing most likely to eat the schedule and least
likely to matter if the typography is wrong.

---

## OPEN QUESTIONS

- Is this a shop or a lookbook at launch? Apparel can transact now. Fuel cannot
  sell legally until DGDA clears, which is months away. That gap has to be
  designed for, not discovered later.
- Does Instruments exist as a category yet, or is it a placeholder? An empty nav
  slot at launch is worse than two categories.
- Which product is the hero on day one? Apparel is the only one that can ship.
