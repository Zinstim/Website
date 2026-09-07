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

- The mark is Zinc Silver on dark, Obsidian on light. **Never Flame Teal.** Carried in, still holds.
- Flame Teal only appears on Obsidian. On Zinc Wash it measures roughly 1.7:1, which is unreadable. It is a dark-surface accent, not a brand colour.
- Obsidian on Zinc Wash runs about 17:1. Comfortable everywhere including small type.
- No gradients. Zinc is a solid. A gradient would be the first dishonest thing on the page.

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
- No all-caps for labels. The most common tell of a templated page.
- No accenting a single word in a headline in a different colour. If the line needs help, rewrite the line.
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
