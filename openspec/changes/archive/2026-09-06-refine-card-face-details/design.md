## Context

All five changes land in one component — `src/components/card/card.{ts,html,css}` — plus a one-line data rename in `src/model/card.ts` and the style guide that demonstrates the card. See `proposal.md` for motivation and `specs/design-system/card/spec.md` for the requirements.

Two properties of the current implementation shape every decision below:

- The card is a named container query context (`container: card / inline-size`) and every internal size is expressed in `cqw` with a `clamp()` floor and ceiling. Nothing is measured and passed in from a surface, and nothing may start being.
- `.face` is a CSS grid whose rows are fixed ratios (`1fr 3.4fr 1.5fr 2.6fr` above the ability gate). Section heights are therefore a function of the card's width alone. Anything that would let content grow a row — a wrapping name, a taller stats row — has to fit the row it is given rather than expand it.

The name currently overflows more often than it appears to: at a 260px card the name row's base size is `10cqw` ≈ 26px against roughly 206px of usable width, so a 15-character name such as `Aspid Hatchling` is already past the ellipsis. Fitting is not a rare-case guard; it is the common path.

## Goals / Non-Goals

**Goals:**

- Keep every decision inside the card component, driven by the card's own width. No surface learns anything new.
- Fit the name deterministically — the same name yields the same size on every render, with no measurement pass, no reflow loop, and no dependency on webfont load timing.
- Free the frame's colour channel entirely, so ownership has it uncontested.

**Non-Goals:**

- Redesigning the ownership treatment itself. The existing player/opponent aura and pip stay as they are; they simply gain the frame's metal.
- Changing the four-row grid, the ability gate at 200px, the 120px minimum, or the ornament-degradation breakpoint at 160px.
- Any change to how stats are computed or stored. This is presentation only.

## Decisions

### 1. Stat labels move out of the fill's path into a fixed label cap

`.stat-bar` becomes a flex row of two parts: a fixed-width label cap carrying `AT` or `DE`, and a track that takes the remaining width. The fill is a percentage of the track, not of the whole bar, so no value of attack or defense can ever put fill underneath the label.

Why over the alternatives:

- *Keep the label overlaying the left of the bar, with a stronger background* — the current design. It cannot satisfy the requirement: at attack 6 the fill is narrower than the capsule, so the capsule hides the fill entirely no matter how it is styled.
- *Move the label to the right end of the bar* — inverts the problem. A high value's fill runs under the label and its tip is occluded, which is exactly the reading a high value needs.
- *Put the label above the bar* — costs a text line per stat inside a fixed-height row; at the 120px minimum there is no room for two.

The cap keeps its own ground and border so the two parts still read as one delineated row rather than two floating pieces. At the 120px minimum the cap costs roughly 16px of about 90px of usable width, which leaves the track wide enough for a low value to be distinguishable — the requirement's "two different low values" scenario is the one to check at that width.

### 2. The ability section gets a real box, inset from the face edge

`.cf-ability` takes a border on all four sides rather than the current `border-top`, and is inset from the face's edges by a small margin so that its left, right, and bottom sides are visible as its own border and not read as the face's rim. Its existing padding absorbs the inset so the text does not lose room. The inner shadow stays: the box should still read as recessed, now with an edge.

The border lives inside the `@container card (min-width: 200px)` block along with the rest of the section's visible treatment — below the gate the section is visually hidden and has no box to draw. The 160px ornament-degradation block never applies to it for the same reason, so there is no interaction between the two.

### 3. Name fitting: a length-derived scale factor, wrapping as the backstop

The component computes a unitless scale factor from the name's length and exposes it as a CSS custom property; the name's `font-size` multiplies all three terms of its existing `clamp()` by that factor:

```
font-size: clamp(calc(0.6rem * var(--name-fit)), calc(<base>cqw * var(--name-fit)), calc(1.1rem * var(--name-fit)));
```

Multiplying the floor and ceiling as well as the `cqw` term is what keeps the fit width-independent: because both the available width and the font size scale with the card's width, a name that fits at one size fits at all of them. Scaling only the middle term would break the relationship exactly where the clamp bites — at the 120px minimum and at very large cards.

The tier ladder is a small ordered table of `maxChars → factor` in the component, calibrated so a name of that length fits one line at that factor, with the base tier recalibrated downward from today's `10cqw` (which does not fit the names already in `CARD_DB`). The name's `white-space: nowrap` / `text-overflow: ellipsis` are removed, so anything the tiers underestimate wraps instead of truncating; the smallest tier is chosen so two of its lines fit the name row's height at the 120px minimum, which is the tightest case.

Why over the alternatives:

- *Measure the rendered text (`ResizeObserver`, `canvas.measureText`, or a shrink loop)* — accurate, but it reflows per card on every resize with dozens of cards on screen, and `measureText` depends on the webfont having loaded, so the first paint can size against a fallback and never correct. Character count is available synchronously, is stable across renders, and is trivially unit-testable.
- *Pure CSS* — CSS cannot see the length of text. There is no expression to write.
- *Fixed size with wrapping only* — a long name would drop to a second line while a short one sits large, and the requirement's "default size for a short name" scenario asks for the opposite.

The tiers are an approximation: character count ignores that `WWW` is wider than `iii`. Wrapping is the correction, and because the requirement forbids only truncation — not wrapping — an underestimate degrades to a legible two-line name rather than a defect.

### 4. Rarity comes off the frame entirely

Deleted: the six `:host([data-rarity='N'])` blocks, the `--frame-sheen` / `--frame-sheen-opacity` machinery and the `.frame::before` element that paints it, the `raritySheen` keyframes, and the reduced-motion rule that stops it. The `[attr.data-rarity]` host binding goes with them — with no consumer it is a styling hook that invites the treatment back.

`--frame-metal`, `--frame-rim`, and `--frame-aura` stay as the frame's material variables, holding today's neutral defaults for every card. Ownership then writes `--frame-metal` under `:host(.owner-player)` and `:host(.owner-opponent)` alongside the aura it already sets, which is what makes the border read blue or red in play. `--frame-rim` is load-bearing beyond the border — the face's inset hairline and the image window's ring both read from it — so it is kept and left neutral rather than deleted.

The `--color-rarity-*` tokens in `src/styles/tokens.css` lose their only consumer and are removed with it; the style guide's token swatches are generated by reading `:root` at runtime, so they disappear on their own with no code change there.

### 5. `FC` is the set's name, not an abbreviation of it

`src/model/card.ts` holds one `CROSSROADS = 'Forgotten Crossroads'` constant used by every card. Its value becomes `'FC'` and the constant is renamed to match. No model property is added: `set` is already a plain display string, `cards/data-model` only requires it be non-empty and unique with `number`, and adding a second field would put two names for one set in the model with nothing to keep them in step.

The card face's `.cf-set` keeps its ellipsis; it now has nothing to elide, which is the point.

## Risks / Trade-offs

- **The tier ladder is calibrated by eye, and an all-caps wide-glyph name could still wrap where a tier predicted one line.** → Wrapping is a legal outcome, not a defect; the requirement forbids truncation only. The style guide gains a deliberately long name example so the ladder can be re-judged whenever the font or the section changes.
- **The label cap narrows the stat track, and the narrowing bites hardest at the 120px minimum where the track is already short.** → The cap is sized in `cqw` with a `clamp()` floor like everything else, so it shrinks with the card; verification checks two low values apart at exactly 120px.
- **Losing the rarity frame removes a glanceable rarity cue from a collection grid, where no ownership colour is present to take its place.** → Accepted deliberately (see the removal's Reason). The star track carries rarity at every size, and the collection view can add its own non-frame treatment later without the card renderer's help.
- **`data-rarity` may be depended on by something outside the card.** → It is set by the card's own host binding and styled only in `card.css`; a repo-wide search before deleting confirms it, and `card.spec.ts` asserts on it today and is updated with the change.
- **Multiplying a `clamp()`'s floor by the fit factor lets the name go below the theme's smallest step at the minimum width.** → That is intended — the floor is a legibility floor for a *default-length* name, and the alternative is truncation, which the spec forbids. Legibility at the minimum width is checked directly on the style guide's size ladder.
