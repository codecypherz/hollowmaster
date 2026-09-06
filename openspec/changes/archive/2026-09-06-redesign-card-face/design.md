## Context

See `proposal.md` — Why. The constraints that actually shape the approach:

- **The renderer takes no measurements from its callers.** `card.css` states this as its sizing contract: the card fills the width it is given, derives its height from 2.5:3.5, and scales everything inside from its own width in `cqw` units. `:host` is already `container-type: inline-size`. The 200px ability gate has to live inside that contract, not break it.
- **The size range is wide, but it now has a floor.** The legacy screens gave the card no lower bound: `game.css` derives `--card-w` from `clamp(65px, …, 220px) / 1.4`, so a board card could fall to ~46px, where nothing is legible. Those screens are being reworked, so this change sets the floor from the card's side instead of inheriting theirs — 120px minimum up to a ~260px showcase, a ~2.2× range one stylesheet has to look deliberate across.
- **The face is drawn, not composited.** There is no frame artwork to load — only `public/images/<card>.webp` for the art window. Every bit of frame, plaque, and bevel is CSS, and it has to survive at 120px.
- **The surfaces are in flux.** Open-pack is unrouted dead code and is deleted here. The game screen and the Cards page are being reworked after this change, and `CLAUDE.md`'s look-and-feel block is stale. The card contract is therefore designed on its own terms and the screens are built to it — not the reverse.
- **The style guide reads `:root` at runtime.** Any new token appears there automatically; a hard-coded colour in `card.css` does not. That is the reason to route new values through `tokens.css`.
- **jsdom does not evaluate container queries.** Vitest can assert the DOM the component produces but cannot assert what the size gate does with it.

## Goals / Non-Goals

**Goals**

- One stylesheet, one component, six rarity tiers, two size modes — with no branching in the callers.
- Every visual state driven from the card model, so a new card needs no styling work.
- Frame craft that comes from layering (bevel, inset, vignette, gradient border) rather than from asset images, so it stays sharp at any size and adds no network weight.

**Non-Goals**

- No change to `src/model/card.ts`, `game.service.ts`, or any game rule.
- **No in-game redesign.** The game screen's card floor rises to meet the card's minimum and nothing else. Refitting the board and hands around it is the in-game rework's job.
- No hover-tilt, 3D transform, or foil-on-pointer-move interaction. Cards are dense on screen and the board already animates; adding pointer-tracked motion here is a separate decision.
- No card-detail or zoom surface. The gate hides the ability box below 200px; it does not add a way to read it.

## Decisions

### 1. The size gate is a named container query, not an input

`:host` becomes `container: card / inline-size` and the gate is `@container card (min-width: 200px)`. Naming the container matters: an unnamed query resolves to the *nearest* container ancestor, and if a future surface makes its grid a container the card's rules would silently start measuring the wrong box.

*Alternatives rejected.* A `size` input on the component would put the decision in every caller and let two surfaces disagree — and it directly contradicts the renderer's stated contract. A `ResizeObserver` would work but adds a per-card observer to a board of 16 plus two hands, to compute something CSS already knows.

### 2. The card declares its own minimum supported width, rather than inheriting a floor from screens

The card guarantees legibility at **120px** and up, and surfaces must honour it.

The alternative was what the codebase does today: let each screen pick whatever width its layout leaves over, and make the card cope. That is how `game.css` ended up able to render a 46px card — a width at which the name, the stars, and the stat labels are all illegible, and at which no amount of CSS craft helps. Designing down to that floor would have meant writing the spec's degradation requirement around mere *presence* instead of legibility, which is a contract that promises nothing.

Inverting it costs one number and buys a real guarantee. 120px is chosen from the tightest element rather than picked round: at 120px the face is ~90px wide, the stats section ~38px tall, so each stat bar is ~15px with a ~9px `AT`/`DE` label, and each of the five star slots is ~8px. All legible. Below roughly 100px the label degrades into a positional mark, so the floor sits above that with a little margin.

The consequence lands on the game screen, and it is deliberate: a 4×4 board of 120px cards needs 480 × 672px plus gaps, which does not fit under a score bar on a 1280 × 600 viewport. The legacy layout will not accommodate it — that is precisely the information the in-game rework needs, and it is better surfaced by a stated minimum than hidden behind a `clamp()` that silently shrinks cards into illegibility.

### 3. Hiding the ability means visually-hidden, never `display: none`

Below the threshold `.cf-ability` is `position: absolute` with the project's existing `.sr-only` clip treatment. Absolutely positioned children do not participate in grid track sizing, so the face's three-row layout is unaffected — the same effect `display: none` would have had on layout, without removing the text from the accessibility tree. Above the threshold the container query restores it to `position: static` and switches `.face` to four rows.

This is also what makes `aria-describedby` viable: `display: none` breaks the reference, `clip-path` does not.

### 4. `.face` owns both row templates; the container query swaps one line

```
.face                 → grid-template-rows: 1fr 2.6fr 1.4fr          /* name / image / stats */
@container ≥200px     → grid-template-rows: 1fr 3.4fr 1.5fr 2.6fr    /* + ability */
```

The four-row split (≈12% / 40% / 18% / 31%) follows the reference sketch's proportions. The three-row split keeps today's balance, which is already tuned for board tiles.

### 5. Rarity is a data attribute driving custom properties, not six frame rulesets

Host binding: `'[attr.data-rarity]': 'card()?.stars ?? null'`. `card.css` then defines one frame implementation that reads `--frame-metal`, `--frame-rim`, `--frame-aura`, and `--frame-sheen`, and six short blocks that set those four properties:

| stars | material | reads as |
|---|---|---|
| 1 | dull carapace — flat slate, no aura | common |
| 2 | tarnished bronze (`--color-gold-dim`) | |
| 3 | pale bone / silver | |
| 4 | gold (`--color-gold`) | |
| 5 | bright gold with a soul-lit inner rim | rare |
| 6 | void-touched: dark iridescent metal, crimson-violet shimmer, animated sheen | unmistakable |

*Why not six full rulesets:* they drift. One implementation and six variable sets means a change to the bevel lands on every tier at once — the same argument that put every card through one component.

### 6. Rarity and ownership occupy separate visual channels

Rarity owns the **frame material** (the border's gradient and the corner chevrons' metal). Ownership owns the **aura** (the outer `box-shadow`) and the **pip** (filled diamond for the player, hollow outline for the opponent). They compose without fighting because they are different properties on different elements, and ownership keeps its non-colour carrier — the pip's fill — as the spec requires.

Selection continues to layer on top as lift plus pulse, which is a third channel again.

### 7. Stars are `clip-path` polygons, not glyphs

A five-point star polygon on a `<span>`, the same technique the chevrons already use. Glyphs (`★` / `☆`) were the obvious alternative and are rejected: the two characters have different metrics and different vertical centring in most fonts, so a track mixing them wobbles, and neither is guaranteed present in the Cinzel stack — a fallback font changes the card's look with no warning.

- **Lit slot** — gold gradient fill with a drop-shadow glow.
- **Unlit slot** — the same polygon in `--color-star-empty` (a dark desaturated slate) sitting in a slightly lighter socket, so it reads as an empty setting rather than a faded star. Distinguished by fill *and* by the absence of glow.
- **Plaque** — a dark inset bar with a hairline rim in the image's top-left, per the sketch. `z-index` above the art window's vignette overlay.

### 8. The sixth star breaks the plaque

When `stars === 6`, one extra element renders **outside** the five-slot plaque, overlapping its right edge — larger than the five, with a crimson-violet core, a white-hot rim, and a radiating glow that spills past the plaque's bounds. Breaking the plaque's frame is the whole point: it says *beyond the scale* in a way a sixth identical star inside a widened plaque cannot.

It is `@if`-ed out of the template entirely below 6, satisfying the spec's "absent, not dimmed" scenario at the DOM level rather than by CSS opacity.

The sheen animation on it (and on the 6-star frame) is disabled under `prefers-reduced-motion`, matching the existing block at the bottom of `card.css`.

### 9. The stat label rides in a capsule inside the bar

Each bar is `position: relative` and contains: an inset track (with faint quarter gradations as a `repeating-linear-gradient`), the proportional fill, and an absolutely positioned `AT` / `DE` capsule pinned to the bar's left inside edge.

The capsule carries its own darkened background. That is what makes the spec's legibility scenario hold in both directions: a 5-attack card leaves the label over the empty track, a 95-attack card puts it over a bright fill, and a self-backed capsule reads on either. A bare label would need per-value contrast logic.

Attack keeps `--color-attack` (amber) and defense `--color-defense` (blue), so the two stay distinguishable without reading the label — the spec requires the distinction not rest on the label alone.

**Icons leave the face.** `attack_icon.png` and `defense_icon.png` were clamped to a 12px floor, which at a 46px card is a quarter of the bar's width for no information the label does not carry better. The files stay in `public/images/`; only the reference goes.

**Label size at the floor.** `clamp(8px, 7.5cqw, 11px)` puts the label at ~9px on a 120px card — the tightest element on the card, and the measurement the 120px minimum was chosen from (Decision 2). The `8px` lower bound is a backstop, not an operating point: at a supported width the `cqw` term always wins.

### 10. The ability panel truncates behind a mask, and the set plate gets its own row

The panel is a two-row grid: the ability text (`1fr`, `overflow: hidden`) and an identity strip (`auto`, `justify-content: end`).

- **Truncation** is `overflow: hidden` plus a bottom `mask-image: linear-gradient(to bottom, #000 70%, transparent)`. A `line-clamp` would need a line count, and the right count changes with the card's width — the mask needs no measurement and fades at whatever height the row happens to be.
- **The identity strip is a row, not an absolutely positioned corner plate.** The spec requires that the ability text not run underneath the set and number; giving the strip its own track makes that structural instead of a `padding-bottom` guess that a font change would break. It still lands in the section's bottom-right, as drawn.
- **Content**: the full set name, ellipsized, then the number zero-padded to three (`Forgotten Crossroads · 002`). The full name over an abbreviation because at 200px+ the panel is wide enough for it and `FC · 002` tells a player nothing.
- **Type**: `--font-flavor` (IM Fell English SC) for the ability text, `--font-ui` for the plate. Sized in `cqw` like everything else.

### 11. Frame layering technique

- **Outer border**: `background: linear-gradient(var(--color-card-bg), …) padding-box, var(--frame-metal) border-box` with a transparent border. This is what gives a *gradient* border — a flat `border-color` cannot carry a metal.
- **Bevel**: paired inset shadows — a light hairline on the top edge, a dark one on the bottom.
- **Recessed interior**: `.face` takes an inset ring plus a soft inner shadow so the sections read as sunk into the frame.
- **Art window**: `.cf-img::after` overlays a bottom-weighted vignette and a top gloss. The stars sit above it via `z-index`.
- **Sheen** (5–6 star): `.frame::before`, `position: absolute; inset: 0` — critically **not** a plain pseudo-element, because `.frame` is a `grid` and a static `::before` would become a grid item and claim an auto row. Absolute positioning takes it out of grid flow.

### 12. New values go to `tokens.css`, not into `card.css`

Roughly: `--color-ability-panel`, `--color-ability-text`, `--color-ability-rule`, `--color-star-lit`, `--color-star-empty`, `--color-star-socket`, `--color-star-six`, `--color-star-six-glow`, `--color-stat-label`, `--color-stat-label-bg`, `--color-stat-tick`, `--color-plate-bg`, `--color-plate-text`, and `--color-rarity-1` … `--color-rarity-6` plus `--color-rarity-6-shimmer`.

They belong in `@theme static` for the same reason the existing palette does: the style guide enumerates `:root` at runtime, so a token declared here shows up on the guide with no hand-written entry, and the tokens spec's "single source of truth" requirement keeps holding.

### 13. Component surface changes

```ts
readonly starSlots   = computed(() => [1,2,3,4,5].map(i => i <= (this.card()?.stars ?? 0)));
readonly showSixth   = computed(() => this.card()?.stars === 6);
readonly setNumber   = computed(() => String(this.card()?.number ?? 0).padStart(3, '0'));
readonly abilityId   = `card-ability-${CardComponent.nextId++}`;   // module-level counter
```

`stars()` — the `'★'.repeat(n)` string — is removed. `description()` gains the set and number. The `<button>` / `<span>` frame keeps `aria-label` for the concise name, and gains `aria-describedby="{{abilityId}}"` pointing at the ability text, which is the standard way to attach a long supplementary description without bloating the accessible name.

### 14. Testing splits along the jsdom line

- **Unit-testable (Vitest)**: four sections in order, five star slots always present, lit count equals the rating, `.star-six` absent below 6 and present at 6, `AT`/`DE` text inside their bars, no attack/defense/star numeral, the set number *is* rendered, `.cf-ability` present in the DOM at every size with `aria-describedby` wired to it, face-down reveals no ability or set.
- **Not unit-testable**: the 200px gate itself, and every craft requirement (bevel, vignette, rarity tiers, degradation). Container queries do not evaluate in jsdom.

That split is why the style-guide delta requires explicit demonstrations of the gate on both sides of the threshold, all six ratings, and the rarity tiers side by side. The style guide *is* the verification surface for what the tests cannot reach.

Two existing tests must be restated rather than extended: `renders name, image, and stats sections in order` (now four), and `never renders a numeral anywhere on the card` (the collector number is now a required numeral; the assertion narrows to attack, defense, and rating).

## Risks / Trade-offs

- **Ability text at 200px is genuinely small (~7px).** → Mitigated by the flavour face, generous line-height, and the fade mask so truncation reads as intentional. Verified by eye on the style guide's 200px and 260px examples before the change is called done. If it does not hold up, the honest fix is raising the threshold, not shrinking the type further.
- **The 120px minimum breaks the legacy game layout on short viewports.** A 4×4 board plus two hands was tuned around a floor of ~46px; at 120px it will not fit under a score bar on a 1280 × 600 viewport. → Accepted and scoped: this change raises `game.css`'s floor and *records* where the layout no longer fits, handing that list to the in-game rework. It does not attempt the refit. The alternative — keeping the old floor — would mean shipping a card spec the game screen violates on day one.
- **Six rarity tiers × two owners × selected/inert/flipped is a large state space.** → Contained by Decision 6: the three concerns write to different properties on different elements. The style guide's rarity row and state row make regressions visible.
- **The frame rests on `background-clip: border-box` gradients and `mask-image`.** → Both are broadly supported; the failure mode if either is unsupported is a flat border and a hard text cut, not a broken layout.
- **Deleting open-pack removes the only surface that ever rendered a pack of cards.** → It is unrouted and unreferenced, so nothing regresses today, but the pack-opening *feature* will have to be rebuilt when the Shop is. Its reveal animation (`revealCard`, a staggered fade-and-rise driven by `--i`) is worth reading out of git history at that point rather than reinventing.
- **The ability box will be visible nowhere but the style guide when this lands.** → Intended. The card contract is settled first and the screens are built to it; the style guide is what makes the unshipped half reviewable in the meantime.
- **The change touches every card on every surface at once.** → That is the point of the single renderer, but it means the review is visual. The style guide is the review surface; the tasks put it before the game check.

## Migration Plan

None required. No persisted data, no API, no stored player state — the card face is derived from `CARD_DB` on every render. Rollback is a revert of the commit.

## Open Questions

Deferrable without changing the specs, the approach, or the task breakdown:

- Whether the animated sheen should extend to 5-star cards or stay exclusive to 6-star. Decided by eye once the tiers are on the style guide together.
- Whether `attack_icon.png` and `defense_icon.png` should be deleted once nothing references them. Left in place here; a later cleanup can remove them.
- Whether the Cards page, when it is built, wants the card at a width that shows the ability inline or a separate detail view. It is a placeholder today, and the answer does not change anything here.
- Where the in-game layout constraints currently sitting in `CLAUDE.md` should finally live. They belong in a spec for the game screen, which the in-game rework will create; they are marked provisional in `CLAUDE.md` until then rather than dropped.
