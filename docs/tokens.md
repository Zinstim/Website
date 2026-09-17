# TOKENS

Status: **PROPOSED**, except where noted as carried in.
Every value below has a reason. If a reason stops being true, change the value.

---

## COLOUR

One correction to the carried-in palette first.

**Bone `#EFEBE4` is being dropped.** Two reasons. It is a warm off-white, and zinc
is a cool bluish-white metal — so the base surface was arguing with the material
story. It is also within a few points of the warm cream that currently reads as
the default generated-website background. Replacing it with a cool light surface
fixes both at once and costs nothing.

| Token | Hex | Role | Share |
|---|---|---|---|
| `--obsidian` | `#0D0D0D` | Type on light. Full-bleed dark sections. | 25% |
| `--zinc-wash` | `#E9ECEE` | Page base. Cool, not cream. | 60% |
| `--zinc-silver` | `#D6DDE2` | The mark. Metal surfaces, rules, dividers. | 10% |
| `--flame-teal` | `#00E0B8` | Accent. Live states only. | under 5% |
| `--graphite` | `#6E7679` | Secondary text, captions, meta. | as needed |

**Rules**

- The mark is Zinc Silver on dark, Obsidian on light. **Never Flame Teal.** Carried in, still holds. *(16 Sep: it is now an inline vector trace. Under the cursor a liquid rises inside it and uncovers its own red carbon fibre — the original artwork revealed, not a colour painted on the mark, and only while it is pointed at.) The tab icon is the red artwork itself.)*
- **Red is the material the mark is made of, not a colour we paint with.** *(17 Sep, DECIDED.)* It appears as the artwork the reveal uncovers, the tab icon, a physical finish (one crimson thread, anodising, print on black) and photography of the object. Never a button, band, headline, link, badge, chart or category field. Reasons and measurements in `brand-book.html` §05; the crimson-led direction is rejected.
- **The ratio is 90 / 8 / 2** across a whole screen: night and metal, the live colour, the mark's red. Two red things at once means one of them is wrong.
- **Two surfaces.** Night (Obsidian) carries the brand: home, Origin, the drop, packaging, social. Day (Zinc Wash) carries the proof: size charts, lab panels, dose tables, policy, email. The live colour changes value with the surface, never hue — Flame Teal on Night, Elixir core on Day.
- Flame Teal only appears on Obsidian. On Zinc Wash it measures **1.4:1**, which is invisible. It is a dark-surface accent, not a brand colour.
- Obsidian on Zinc Wash runs about 17:1. Comfortable everywhere including small type.
- No gradients **on surfaces**. Zinc is a solid. A gradient on a button, a card or a band would be the first dishonest thing on the page. The one scoped exception is inside the elixir, below — a liquid is a volume with light travelling through it, and painted flat it is just a rectangle.

---

## COLOUR — THE ELIXIR

Status: **PROPOSED.** Awaiting sign-off.

The tokens above are zinc as **metal** — inert, cool, what it is on a shelf.
These are the same element **activated**: what two grams of a trace element
actually does once it is inside you. Same theme, second half.

The hue is read off the mood board (`assets/img/moodboard/`), which is near-black
and grey almost everywhere. Exactly one electric colour event sits in it — the
teal-green car against night asphalt. Red appears once, on ASRV, which is the
category default this repo already warns about, so it is deliberately not taken.

Teal also means no rival accent enters the system: Flame Teal was already the
single live-state colour, and the elixir is the depth behind it.

| Token | Hex | Role |
|---|---|---|
| `--elixir-void` | `#062821` | The substance at depth |
| `--elixir-deep` | `#0A4A3F` | Its body |
| `--elixir` | `#0B6B5C` | The core |
| `--elixir-lit` | `#12B394` | Where light enters it |
| `--elixir-glow` | `#5BF5D6` | The specular rim. Rarest, use least |

**Rules**

- A **dark-surface family**, more strictly than Flame Teal. Elixir Lit on Zinc Wash is **2.2:1** — fails at every size, large type included, and Glow is worse. *(17 Sep: the rule was written for Lit and above. The **core** `#0B6B5C` measures **5.4:1** on Zinc Wash and is the live colour on Day surfaces, small type included.)*
- Flame Teal on the elixir **at depth** (`--elixir-void`) reads **9.3:1**; on the core it is 3.8:1, so that pairing is display size only. It is not a second accent; it is the same accent with depth behind it.
- `--elixir-void` sits **1.2:1** against Obsidian on purpose — enough to give the fluid a body, little enough to stay abyssal. The first value measured 1.00, identical, and the liquid vanished into the band.
- Gradients are permitted **inside the liquid only** — see the amended rule above.

---

## TYPE

**One family, pushed to both extremes. Heavy and narrow for display.**

Two earlier passes were wrong and the corrections are worth keeping. The first
reached for a wide grotesque — but two grams of zinc is *concentrated*, not
spread out, so display had to compress rather than expand. The second reached for
a high-contrast serif, which is elegant, and elegance is not the same thing as
energy. The brand needs to hit.

| Role | Setting | Why |
|---|---|---|
| Display | **Archivo**, `wght 900` / `wdth 78` | Heavy and narrow. Dense by construction, loud at scale. |
| Head | Archivo, `wght 800` / `wdth 82` | Same voice, one step down. |
| Body | Archivo, `wght 400` / `wdth 95` | One family across the whole site — width carries hierarchy, not a second typeface. |
| Bangla | **Anek Bangla**, `wght 700` / `wdth 84` | Also width-variable, so the compression logic crosses scripts. |

Most sites pair a display face with a body face, which usually produces two
typefaces having a polite disagreement. One variable family at its extremes is
more disciplined and gives both scripts a shared rule.

**Rules**

- Body line length under 70 characters. Long measures are what make white space read as neglect rather than intent.
- No all-caps in Archivo. *(17 Sep: uppercase survives only in Space Mono at small sizes, where it reads as instrument lettering — specimen tags, spec tables, batch lines. All-caps display type is the most common tell of a templated page.)*
- No accenting a single word in a headline in a different colour. If the line needs help, rewrite the line. *(16 Sep, one exception: the liquid system. Colour may arrive as the substance filling type — a title's resting level, Origin's rolling line, a stressed phrase — never as a static painted accent.)*
- Bangla sits beside English, not beneath it as a translation. Equal standing, because Bangladesh is the first audience.

---

## SPACE

Sparse is the whole point, so the scale is wide and there are few steps. Too many
steps and everything drifts toward the middle.

| Step | Use |
|---|---|
| `xs` | Inside a control |
| `sm` | Between related lines |
| `md` | Between elements in a group |
| `lg` | Between groups |
| `xl` | Between sections |
| `2xl` | Around a divider moment — deliberately more than feels comfortable |

The `2xl` step is doing the real work. A divider line needs enough air around it
that nothing else competes. If it feels like too much, it is probably right.

---

## MOTION

**One principle: reveal over display.** Taken directly from the Figma stickies —
the box that opens, the treasure seen through in detail, the hover that makes you
want to know what the thing is. Nothing on this site is fully visible at rest.

| Rule | |
|---|---|
| Motion answers the cursor | Hover, focus, and click get a response. Those are the moments motion belongs. |
| One page-load moment, not many | A single settling gesture on load. Fade-and-slide-up on every section as you scroll is the generated-page default. |
| Nothing loops | No ambient drifting, pulsing, or floating. It reads as decoration and undermines the restraint. |
| Scroll can stand in for the cursor | Where a page tells a story, the reader's scroll may drive the substance (Origin's reading pours). On a device that cannot hover, the middle of the screen stands in for the cursor: the component crossing it takes its hover state. Progress, never playback: it moves only as the reader moves and runs back when they scroll back. Without JavaScript, or with reduced motion, every section shows its finished state. |
| Reduced motion is honoured | `prefers-reduced-motion` removes movement, never removes information. |

**Timing:** fast enough that it feels like a response, slow enough to read as
deliberate. Ease-out for things arriving, ease-in-out for things moving between
two known positions.

---

## THE ONE MOMENT

Zinc gets named once on the entire site. It is a divider, full-bleed, and it is
the only place the brand explains itself.

Candidates:

1. *Your body holds two grams of zinc. Everything runs on it.*
2. *Two grams. That is the whole supply.*
3. *You carry two grams of it. You have never once thought about it.*

**Recommend 3.** One and two state a fact. Three makes a point — the thing that
matters most is the thing you never notice — and that is the actual brand
argument, not the chemistry.

After this, zinc is never mentioned again. No atomic numbers, no periodic table,
no lab language anywhere else on the site.
