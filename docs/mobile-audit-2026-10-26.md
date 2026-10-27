# ZinStim — mobile audit, 26 Oct 2026

Three independent agents audited every page across ten phone viewports.
1,763 screenshots, 26 videos, every finding carrying a selector, a
viewport and a number. This merges them, resolves the overlaps, and
ranks what to do.

| Cohort | Viewports | Findings file |
|---|---|---|
| A — small & old | 320×568, 360×640, 375×667 | `audit/findings/A-small-old.md` |
| B — current iPhone | 393×852, 402×874, 430×932, + landscape | `audit/findings/B-iphone.md` |
| C — Samsung & Android | 360×780, 384×854, 412×915, 480×1040 | `audit/findings/C-android.md` |

**Method limit, stated once.** These are emulated viewports in current
Chromium. Layout, sizing, contrast and logic measure faithfully. Real
iOS Safari behaviour does not — the collapsing URL bar under `100svh`,
the software keyboard, synthetic hover on tap, `env()` in standalone
mode. Everything that needs a real handset is listed at the end rather
than guessed at.

---

## The headline

**In portrait, on a modern phone, this is a good phone site.** Somebody
thought hard about what hover should become: the doors are re-driven by
an IntersectionObserver so the scroll points for you, the gallery riffle
becomes a scrub bar, the liquid fills park at half under `hover:none`,
the mark lights when you open the menu. None of that is a fallback; it
is a translation, and in two places it is better than the desktop.

**Three things stop a sale**, and two of them I introduced today.

**One number breaks the layout everywhere**: the assumption that the
root font stays 16px. Android users routinely run 1.15–1.3×, and at
1.15× the bag's Remove button leaves the screen.

---

> **Verified 26 Oct by a sixth agent that re-tested every blocker from
> scratch, instructed to refute.** Two headline claims did not survive,
> one blocker was downgraded, and a fault nobody had found turned up.
> Corrections are inline and marked **VERIFIED** / **REFUTED**; the full
> verdict is in `audit/findings/V1-verification.md`.
>
> **One caution that applies to the whole document.** Two merged figures
> (BL-2's `scrollHeight 613`, BL-3's `295px`) turned out to be artifacts
> of the sandbox having Google Fonts blocked — they reproduce *exactly*
> when the real type is missing. Any other number here that depends on
> text wrapping deserves a re-read before it is acted on.

## Blockers

### BL-1 · Remove leaves the screen at Android font scaling
**→ DOWNGRADED TO SERIOUS.** The geometry is exact — right edge 369.9px,
+9.9px past the drawer, `elementFromPoint` returns `div.drawer__in`. But
`.drawer__list` carries `overflow-x:auto` (forced by its `overflow-y:auto`)
with **38 / 88 / 156px of real horizontal scroll**, so a finger swipe
reaches Remove and a tap removes the line at every scale. It is bad —
you have to discover a hidden sideways scroll inside a bag line — but it
does not block a purchase.
>
> **And my method note was wrong.** I wrote that Playwright's `.tap()`
> falsely reports success on clipped elements. It doesn't: it ran
> `scrollIntoViewIfNeeded`, set `scrollLeft` to 38, and dispatched at
> x=304.5 where the hit test genuinely passes. `.tap()` succeeded because
> the button really is reachable. Struck.
*Cohort C. 360×780 at 1.15×, 384/412 at 1.30×, 480 at 1.50×. 2/2 runs.*

`.line__ctl` is `justify-content:space-between` inside
`.line{grid-template-columns:4.5rem minmax(0,1fr)}`. The thumbnail track
grows with the root font (72→82.8→93.6→108px) while the viewport does
not; the text track shrinks (189→164→140→107px) while the flex children
inside it grow. Flex items don't shrink below content, so the row spills
and `.drawer__in` clips it with no horizontal scroll anywhere.

| root | `[data-rm]` right edge | past the drawer | hit test at centre |
|---|---|---|---|
| 16px | 336px | −24px | the button ✅ |
| 18.4px (1.15×) | 369.9px | **+9.9px** | `div.drawer__in` ❌ |
| 20.8px (1.30×) | 417.3px | **+57.3px** | nothing, off screen ❌ |
| 24px (1.50×) | 480.5px | **+120.5px** | nothing; `+` also out ❌ |

Blocker because `−` is deliberately disabled at quantity 1, so Remove is
the only way a line leaves the bag. Add the wrong size on a phone with
large text and there is no way to correct it.

**Mine.** I built `.line__ctl` today and tested it at one font size.

> Method note worth keeping: Playwright's `.tap()` reports **success** on
> this button at every scale, because it dispatches at computed
> coordinates whether or not the element is clipped. The `elementFromPoint`
> hit test is the real evidence. Don't trust `.tap()` for reachability.

### BL-2 · Landscape iPhone: Place order cannot be reached by touch
*Cohort B. 852×393, 874×402, 932×430. 2/2 runs each.*

`[data-checkout-go]` sits at y 480–530 against a 393–430px viewport.
**VERIFIED.** `.drawer` is `overflow-y:hidden` with `scrollHeight` **591**
(613 was a fonts-blocked artifact) vs `clientHeight 393–430`; `.drawer__in` and `.drawer__foot` are
`overflow:visible`; the only `overflow-y:auto` box, `.drawer__list`, is
0px tall by then. A 600px wheel, a 250px drag and tapping each reachable
field all leave `scrollTop` at 0. City and Postcode are off-screen too.

`Tab` *does* scroll it — a hardware keyboard gets through, a finger
never does.

Needs a real device to grade finally: iOS's keyboard accessory arrows
may focus-scroll past it. That decides whether this is "awkward" or
"cannot buy". It is a blocker until someone checks.

### BL-3 · Pressing Checkout hides what you are buying — in portrait too
*Cohort B. 2/2 runs each.*

`.drawer__foot` grows when the form appears and crushes
`.drawer__list` (`flex:1 1 auto; min-height:0`):

**VERIFIED**, one row corrected: 430×932 is **316.7px**, not 295 — the
295 figure reproduces exactly with fonts blocked, where the note wraps to
two lines and steals 21.3px.

| Viewport | bag list height | of a 152px line |
|---|---|---|
| 430×932 portrait | 316.7px | fine |
| 402×874 portrait | **75px** | half a line |
| 393×852 portrait | **53px** | a third |
| all three landscape | **0px** | invisible |

On an iPhone 15 — the commonest iPhone there is — you type your address
while the thing you are buying is a 53px sliver. In landscape the drawer
reads *Your bag → Close → Subtotal ৳1,380* with no item at all.

Cohort B's words, and they are right: "the bag line itself is excellent
right up until the instant you press the button."

---

## Serious

### S-1 · Nothing is actually modal
*All three cohorts. Nav sheet, bag drawer, lock dialogs.*

Open any of them, scroll, and the shop moves underneath: 600px (A),
500px (B), 375–505px by touch and wheel (C). `documentElement` and
`body` keep `overflow:visible`; `<dialog>.showModal()` does not block
document scroll and nothing else does.

The nav sheet is worse than the others on two counts:
- It leaves a live gutter beside it. `elementFromPoint` there returns
  `a.door`, and a real finger tap navigates — the menu is open and you
  land on a page you did not choose. **VERIFIED at all 10 viewports**;
  the width is a constant **80px** up to 402, then 84 / 102 / 152px.
  Never 36.
- **No focus trap.** Ten `Tab` presses never reach a sheet link; focus
  walks the page behind, scrolling it as it goes (this is what moved
  `scrollY` to 4406 in cohort A's run). The sheet's four destinations are
  keyboard-unreachable while it is open.

And the design *signals* a scrim it does not implement — the hero behind
the sheet is visibly blurred, which reads as "the page is held". It
isn't.

The drawer's own focus cycle is nearly right (Close → + → Remove →
Checkout → body → Close), one cosmetic stop on `body`.

### S-2 · The bag button is an empty outline on every phone
*All three cohorts, every page, all 24 page×viewport loads in A alone.*

`.bag` measures **30.8 × 40** empty, 50.8 × 40 with a line. Below 760px
`.bag__label` is made screen-reader-only and `.bag__count` stays
`display:none` until `.is-full`. **There is no icon.** The result is a
featureless pill at 1.47:1 against the masthead — the most important
control in a shop, rendered as a blank oval, on every page.

The CSS comment reasons "the label goes, so the bag is 51px". That is
only true once the count appears. Empty, it is 30.8px wide and says
nothing.

### S-3 · Font scaling drives the nav label into the logo
**→ HEADLINE REFUTED. Keep as MINOR.** The numbers are perfect to the
decimal — but they measure the **toggle's box**, not its ink. The label's
own rect never reaches `.home` until root 24px, and the screenshots show
"Instru…" / "Inst…" with clear space beside the mark. `.home` is also
`3rem`, not px-sized as stated. What is real: the label truncates harder
as the root grows. What is not real: a collision at 1.15× or 1.30×.

*Cohort C. From 1.15× on instruments, every page by 1.30×.*

The cap I added today to fix the 320px collision —
`@media (max-width:420px){ .navtoggle{max-width:calc(100% - 136px)} }` —
uses a **px constant sized for a 16px root** against a toggle whose own
box is rem-driven. As the root grows the label outgrows the cap and
meets the absolutely-positioned, px-sized `.home`.

| root | instruments label | home ↔ toggle |
|---|---|---|
| 16px | fits | +24.4px clear |
| 18.4px (1.15×) | truncated | **overlap 2 × 55.2px** |
| 20.8px (1.30×) | truncated | **overlap 20 × 62.4px, all 8 pages** |

**Mine too**, and the same root cause as BL-1: a px number guarding a
rem-sized box.

### S-4 · The 421px cliff
*Cohort C.*

`.cardgrid` is `repeat(auto-fit,minmax(15rem,20rem))` with a
`max-width:420px` override to `minmax(0,1fr)`. At 421 the override
lifts, `auto-fit` yields one track capped at 20rem = 320px, and it stays
320px until a second track fits at **712** (the audit said 759).
**VERIFIED**, with one correction: the stranding never returns to zero —
it runs 8px → 47px above 712 rather than closing.

| width | card width | stranded |
|---|---|---|
| 420 | 372px | 0 |
| **421** | **320px** | 53px |
| **480** | 320px | **112px — 26% of the screen** |
| **712** | 320 + 320 | 8px |

The card also loses 65px of *height* going one pixel wider. `.kit` does
the same (371→372→352). A 480px Android shows a 320px card with a black
column beside it — measurably worse than the same page one pixel
narrower.

### S-5 · Landscape iPhones fall out of the phone layout entirely
*Cohort B.*

874 and 932 are **wider than the 860px breakpoint**, so `.navtoggle` and
`.navsheet` go `display:none` and the desktop hover capsule takes over
on a touch device. `nav.js` closes the group on `mouseleave` with no
touch equivalent, so it opens and shuts before the reveal finishes.
Same boundary: `@media (min-width:761px){.buybar{display:none!important}}`
means **no buy bar in any landscape** — Add to bag exists only at the
top of the page.

Footer links still reach every page, so this is serious, not a blocker.
Real-device caveat: iOS keeps synthetic hover on a tapped element, so
the capsule may well stay open on glass.

### S-6 · The title sequence never fits a landscape iPhone
*Cohort B.*

`.seq{height:100svh;min-height:30rem}` — 30rem = 480px, larger than any
landscape iPhone viewport. The card runs **148–176px past the fold** and
`.seq__word` never comes into view: the lockup reads "INST" with the
rest cut off. The one piece of theatre on the site doesn't finish.

### S-7 · The gallery has one control, and you can't see it
*Cohorts B and C.*

The only control is `[data-flick-scrub]`. Tapping the photo: nothing.
Swiping the photo across its full width: nothing. The one gesture a
phone user will make does nothing, and the control that works is a
48px strip measuring **1.38:1** against the page behind it. Most people
will see four frames as one photograph.

In landscape the photo (502–572px) plus its strip cannot be on screen
with each other at all under any scroll position. You scrub blind or
you look blind.

Credit where due: the strip itself is well built — `role="slider"`,
`aria-valuenow/min/max`, arrow keys, `touch-action:pan-y`, 48px tall.

### S-8 · 320×568 is where the design's generosity runs out
*Cohort A. 360 and 375 are clean.*

Three things that fit at 360 stop fitting at 320, and all three resolve
by cutting a word in half:

| | overrun | result |
|---|---|---|
| bag line `.line__ctl` | +27px | Remove reads **"Rer"**; 11 of 23 columns dead |
| nav label (instruments) | +31px | **"Instru"** |
| lock dialog | 33–84px hidden | **"Tell me when it lan"**, no scroll affordance |

The lock dialog is the cruellest: the box fits the viewport, so nothing
*looks* wrong — the content simply overruns it, and the thing that falls
off is the join-the-list link on a page whose entire purpose is joining
the list.

### S-9 · Contrast
*All three cohorts, measured from painted pixels, not the cascade.*

Both A and C independently threw out ~12 false positives first: text
painted by `background-clip:text` or `-webkit-text-stroke` computes as
1:1 to an ancestor walk. Measured properly, the big headlines **pass**
(WEAR 14.08:1, INSTRUMENTS 13.21:1, `.pour__line` 5.96:1). The real
failures:

| Ratio | Req | Selector | Where |
|---|---|---|---|
| **1.19** | 4.5 | `.flick__meta` "01/04" | piece — silver on white cloth |
| **2.90** | 4.5 | `.swatchbtn .t-meta` selected | piece |
| **3.03** | 4.5 | `.shout__quiet` | origin |
| **3.91** | 4.5 | `.navsheet__link` sub-items | **3 of the 4 nav destinations** |
| 3.84–4.19 | 4.5 | `.piece__code`, `.piece__spec`, `.make__n`, `.drop__rail`, `.fuel-tub figcaption`, `.manifesto__quiet` | systemic |

The last row is **one near-miss, not six**: `--graphite #6E7679` on
`--obsidian #0D0D0D` is the site's small-secondary pair and lands 0.31
short. Lifting it to about `#747C7F` clears every one at once.

`order.html` has **zero** contrast failures at every viewport.

### S-10 · Tap targets under 44×44
*Identical at all viewports — rem/px driven, not viewport driven.*

| Selector | Measured | Where |
|---|---|---|
| `button.bag` empty | **30.8 × 40** | every page |
| `a` "← Wear" | **45.8 × 15** | piece |
| `a.soon__join` | **116.1 × 21.3** | the lock dialog's conversion link |
| `button.swatchbtn` | 79.5–80.3 × **36.1** | piece |
| `button.drawer__close` | 55.6 × **33.6** | drawer |
| `button.line__step` | **40 × 40** | drawer |
| `button.line__rm` | 47.6 × **37.3** | drawer |

Passing: size buttons 48×46.8, `.navsheet__link` 188.8×44, footer links
exactly 44×44, `.navtoggle` ×48, checkout inputs ×46.8, `.btn` ×50.

### S-11 · `origin.html` needs sideways scrolling at 200% zoom
*Cohorts A and C. WCAG 2.1 AA 1.4.10.*

19–47px of horizontal overflow. Driver: `.name__grid` children have a
min-content floor of 183.1px (`min-width:auto` grid items) inside a
132px shell. Also clipped rather than reflowed at 200%:
`h1.aperture__word` "Instruments" (+20.7–48.7px), and the Instruments
**door** on index by 124.5px at 320 — the category word is unreadable.

`piece.html` is clean at 200% everywhere. The page that has to work
under zoom does.

### S-12 · No-JS: the two pages that matter have no content
*All three cohorts.*

- `piece.html` — 432 chars of chrome, an **empty `<h1>`**, no name, no
  price, no sizes, `src=""` on all three images. No `<noscript>`.
- `order.html` — 75 chars, stuck on *"One moment… Looking up your
  order."* permanently.

Everything else degrades well: index 1015 chars with a real `<h1>`,
origin 3116, wear/fuel/instruments 618–828.

---

## Minor

- **The receipt needs 90px of scroll at 360×780** (1.1 screens) against
  a source comment claiming it holds to one. Exact at 412 and 480.
- **The piece's name and price are below the fold at first paint** —
  `h1[data-p-name]` at y 735 of 780. First paint is gallery, back link
  and frame counter; the garment is identified after a scroll.
- **A full-rate rAF loop runs under `prefers-reduced-motion`** — 60–62fps
  on every page with nothing moving. Battery for no result.
- **Title sequence drops frames on larger Androids** — 47fps and a 216ms
  worst frame at 412×915. Flagged to profile on hardware, not a verdict:
  headless Chromium on a server CPU is not a phone GPU.
- **The checkout CTA opens below the fold** (108–207px of drawer scroll).
- **At 375×667 the first validation sentence opens below the fold** by
  13px. Focus still moves to the offending field, so nobody is stranded.
- **The waitlist focus indicator is 1px** of a 49px control.
- **`.seq__replay` is ~25 lines of dead CSS** — styled, referenced by
  `title.js`, never rendered.
- **Drawer focus cycle passes through `body`** once per lap.

---

## Not a viewport problem, but on the purchase path

**The landing page and the product data disagree about what the shirts
are called.** `index.html` hardcodes the drop cards as "ZS—01 **Black**"
and "ZS—02 **White**", with `aria-label`s to match.
`assets/data/products.json` names every piece by number — ZS—01 "One",
ZS—03 "Two" — and that is what the piece page, the bag line, the drawer
labels ("Remove **One** from your bag") and the receipt all use.

A shopper taps a card called *Black* and the bag and the emailed receipt
both say *One*. Somebody has to decide which name is real. This was a
placeholder I introduced when building the four designs; it needs the
real design names off the Drive.

---

## Compatibility: the real risk is not old Android

All eight capability probes return `true`, but that measures Playwright's
bundled Chromium, not a 2018 handset. Reading the source instead:

- **Old Android is close to a non-issue** — Chrome updates through the
  Play Store independently of the OS.
- **Old WebView is the real risk** — the in-app browser inside Facebook,
  Messenger and Instagram, which is how a large share of this brand's
  traffic will actually arrive. The first thing to break there is
  `color-mix` (Chrome 111, **17 uses**, several load-bearing surfaces),
  not anything exotic.
- `:user-invalid` (Chrome 119) is the binding constraint for the
  checkout, used twice, and degrades gracefully — a wrong field just
  doesn't turn red; the sentence and the focus move still happen.
- `:has()` is used 13 times and **every one is inside a hover rule**, so
  it is dead weight on touch. No risk.
- `100svh` ships a `100vh` fallback on the line before it, six for six.

**Google Fonts is a single point of failure for the whole type system.**
With `fonts.googleapis.com` unreachable, `--face-display` falls back to a
face with no `wdth` axis and every `"wdth" 70` is silently ignored — all
display type renders at normal width. On a Dhaka mobile connection that
is a realistic failure mode. This is not hypothetical: it happened inside
this audit, and cohort A had to re-run every measurement after catching
it.

---

## Does it still land?

**What is better small.** Three things, and all three are deliberate.

The **title sequence**. `.seq__word` is a flex column — I/N/S/T/I/M
stacked under the Z — so the lockup is natively portrait. On a monitor
it is a narrow stripe in a wide black field; on a phone it fills the
frame, 100% of viewport height, nothing else competing. All three
cohorts independently called it the best thing on the phone build.

The **doors**. The thing most likely to die on touch survives by being
rebuilt rather than disabled: `site.js` watches `(hover:none)` and hands
the job to an IntersectionObserver with `rootMargin:'-49.5% 0px -49.5%'`,
so whichever door crosses the middle of the screen lights up. On a
desktop you point at a door; on a phone the scroll points for you, and
because only one can be mid-screen there is no half-hovered in-between
state. Cleaner than the mouse version.

The **receipt**. Zero contrast failures, zero clipping, fits one screen
at 412 and 480, carries the photo stack. A receipt is a thing you check
and a phone is the thing you check it on.

**What turns into something that merely scrolls.** The gallery — the
riffle becomes a widget you have to be told about (S-7). The kit
register — specs that were the hover payoff now sit permanently open, a
spec sheet rather than a register. The `.slit` fabric torch is simply
gone, with its instruction still printed above the place it used to be.
And `origin.html` is **12.1 screens** at 360px of things that were each
a gesture on desktop and are now things you pass.

**What is actively worse.** The bag button (S-2). The nav that blurs the
page behind it and then lets it scroll and take taps (S-1). And the
drawer the moment you press Checkout (BL-3) — cohort B's line is the
right one: *the single worst translation in the build.*

**The verdict, three ways:**
- Portrait, modern phone: a good phone site with a checkout that hides
  your order.
- 320×568: a layout tuned at 360 and never re-checked 40px lower. One
  more pass, not a rebuild.
- Landscape: a desktop layout wearing a phone's dimensions, and it
  cannot complete a sale.

The character survives the shrink. What does not survive is the
assumption that the text stays 16px and the screen stays 360 or 760.

---

## Needs a real handset

Nobody should grade these from an emulator:

1. **BL-2 under the software keyboard** — whether iOS focus-scroll or the
   keyboard accessory arrows rescue the unreachable Place order in
   landscape. Decides blocker vs. awkward.
2. **S-5 on glass** — iOS keeps synthetic hover after a tap, so the
   desktop capsule may stay open at 874/932 where Chromium closes it.
3. **The collapsing URL bar** — the gap below a `100svh` box when the bar
   retracts mid-scroll, and whether the sticky masthead jumps.
4. **Real `env()` insets** — the portrait top inset is 0 in a Safari tab
   and 59 in standalone mode.
5. **An in-app WebView** — open the site from an Instagram DM on an older
   Android and look for missing `color-mix` surfaces.
6. **The title sequence on a real GPU** — 216ms worst frame measured on a
   server CPU means nothing until it is measured on a phone.

---

## BL-4 · The title sequence is blank on a first visit
*Found by verification, not by any cohort. This is the one nobody had.*

On a **cold cache**, `#seq` is already in view at load, the
IntersectionObserver fires immediately, `reset()` wipes the settled
lockup, and fourteen beats run on a fixed `setTimeout` schedule over
**695 KB of un-preloaded, un-awaited imagery**. Measured: **1.5s of
black** with the counter ticking "08 / 14" against nothing. With images
delayed 3s, the first painted frame arrives at **9,172ms** — the entire
first play is invisible and the visitor sees a full 9.2s loop of black.

Warm loads paint in **4–30ms**. That is why three cohort agents, all
driving a warm browser, saw it run clean and reported no fault.

A first-time visitor to `origin.html` — which is the page that is meant
to introduce the brand — can land on a blank black screen for the length
of the whole sequence.

**The fix belongs in readiness, not timing.** Gate `run()` on decoded
images, or preload the first cut-out and the mark. The 300ms hole inside
the sequence is deliberate and should stay.

---

## The contested finding, settled

**Cohort A refuted; cohorts B and C right but incomplete; and the real
fault was something else entirely.**

A reported ≤2 visible parts in 22.5% of frames and a possible ~2s blank.
Re-measured: ≤2 parts in **100%** of frames — the sequence is *built* to
show one or two things at a time — genuinely blank in **4.8%**, longest
hole **0.32s**, and that hole is designed. The period is **9.17s**, not
8.4s. A's 22.5% was the sequence working correctly.

But A's "~2s" landed in the right range by the wrong route, and chasing
it is what turned up **BL-4** above. The instinct was sound even though
the measurement wasn't.
