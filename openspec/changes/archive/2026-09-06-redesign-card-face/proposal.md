## Why

The card is the whole product. Every screen that matters — the board, an opened pack, the collection to come — is a grid of cards, and right now the card face is a functional wireframe rather than something a player wants to look at: three flat boxes, a run of `★` glyphs as text, two thin bars distinguished only by a small icon, and no sign of the ability text, set, or collector number the model already carries.

The reference sketch settles the layout question, so the remaining work is craft. Trading-card games earn their appeal in the frame: Magic's beveled window and rule-lined text box, Yu-Gi-Oh's star row and stat plate, Pokémon's inset art well and textured ability panel. Hollow Master should read the same way, in Hallownest's palette, and it should do it at every size the card is drawn at — from a board tile to a full-size showcase.

## What Changes

**Layout — the face gains a fourth section**

- **BREAKING** The card face becomes four stacked sections: **Name**, **Image**, **Stats**, **Ability**. Today's contract is exactly three, and the `design-system/card` spec states that ability text, set, and number never appear on the face. This change supersedes it. `CLAUDE.md` carries a stale copy of the same constraints; its card and board blocks are removed in favour of a pointer to the spec, which becomes the single authority.
- The **Ability** section carries the card's rules text, with the card's **set and collector number** on a small plate in its bottom-right corner — as drawn in the reference.
- The Ability section is **size-gated**: it is visible on cards rendered **200px wide or wider**, and hidden below that to save space. The gate is a CSS container query on the card's own width, so no surface has to pass a measurement in — consistent with the renderer's existing "fills the width it is given" contract.
- Hidden is *visual only*: below the threshold the ability text stays in the DOM as visually-hidden text, so assistive technology never loses it.

**Stats — labelled bars**

- **BREAKING** Each stat bar carries its label **inside the bar**: `AT` on attack, `DE` on defense. The `attack_icon.png` / `defense_icon.png` images leave the card face — the reference shows labelled bars with no icons, and a two-letter label reads at sizes where a 12px icon does not.
- The two bars become individually delineated rows, as drawn, rather than two rows sharing one panel.
- Unchanged: attack and defense are **never** shown as numerals. The bar is still the only quantitative display.

**Stars — a fixed track of five, plus a sixth beyond it**

- **BREAKING** The star display becomes a fixed **five-slot track** on a plaque in the image's top-left: a 3-star card shows three lit stars and **two unlit slots**, so the ceiling is legible without a legend. Today the renderer draws N stars and nothing else.
- A **sixth star** renders *outside* the five-slot plaque in a distinct treatment, and **only** when the rating is exactly 6. At ratings 1–5 it is absent from the layout entirely — not dimmed, not reserved.
- Unchanged: the rating is never shown as a numeral, and the renderer applies no clamp of its own (the model guarantees 1–6).

**Craft — the polish pass**

- A layered frame: an outer beveled border with corner ornament, a recessed inner well the sections sit in, and section borders that read as inset rather than drawn-on.
- An art window with an inner bevel, a bottom-weighted vignette so the artwork settles into the frame, and a top gloss.
- A **rarity-tiered frame treatment** — the frame's metal and glow shift across the star range, so a 6-star card is recognisable across a grid before its stars are read. Ownership treatment (soul / crimson) continues to layer over it.
- Stat bars gain an inset track with faint quarter gradations, a gradient fill, and a specular edge on the fill — value stays readable without a number.
- The Ability panel is set in the flavour face (`IM Fell English SC`) on a darker inset panel, separated by a rule, with the set/number plate in its corner.

**Sizing**

- The card **declares a minimum supported width of 120px** and guarantees legibility at and above it. Surfaces must honour it: a screen that cannot fit every card it wants at 120px changes its own layout rather than shrinking the card. The card had no stated floor before, and the game screen's `clamp(65px, …)` could drive it to ~46px, where nothing is readable.
- **Graceful degradation toward the minimum**: ornament simplifies as the card approaches 120px — but only ornament. Every section, star slot, label, bar, and chevron is present at every supported size.

**Surfaces**

- The style guide's card section gains explicit coverage: the ability box present and absent across a size ladder that now starts at the 120px minimum, the star track at every rating including the 6-star case, and the rarity tiers side by side.
- **The open-pack page is deleted.** `src/components/open-pack/` is unrouted, referenced by nothing, and was superseded by the Shop and Cards destinations — dead code that would otherwise be a surface rendering the new card at a legacy size.
- **The game screen's card floor is raised** to the card's minimum supported width, so the board stops rendering cards below the size they are legible at. The legacy game layout is tuned around the old floor and may no longer fit its 4×4 board plus two hands on short viewports; that is expected and belongs to the in-game rework, not here. This change records where it no longer fits rather than redesigning the screen.
- The ability box will therefore be visible only on the style guide until the game screen and the Cards page are reworked. That is the intended order: the card contract is settled first, and the screens are then built to it.

## Capabilities

### New Capabilities

*None.* This change reshapes an existing capability rather than introducing one.

### Modified Capabilities

- `design-system/card`: the three-section face becomes four with a size-gated Ability section; the face now displays ability text, set, and number; stat bars carry `AT`/`DE` labels and drop their icons; the star display becomes a five-slot track with a conditional sixth star; the card gains a declared minimum supported width that surfaces must honour; and new requirements cover frame craft, rarity tiering, and ornament degradation toward that minimum.
- `design-system/style-guide`: the card section must additionally demonstrate the size gate on both sides of its threshold, a size ladder floored at the card's minimum supported width, the full star track including the 6-star case, and the rarity tiers.

## Impact

- `src/components/card/card.html` — four sections; stat rows carry labels; star track replaces the `★`-repeat string; ability + set/number markup added.
- `src/components/card/card.ts` — `stars()` returns a five-slot lit/unlit model plus a separate `showSixth` flag; new computed values for the padded collector number and the ability's element id; the accessible description gains set and number and gains an `aria-describedby` link to the ability text.
- `src/components/card/card.css` — the bulk of the work: frame bevel, art well, labelled bars, star plaque, ability panel, rarity tiers, the `@container` size gate, and the degradation rules toward the 120px minimum.
- `src/components/card/card.spec.ts` — the "three sections in order" and "never renders a numeral anywhere" tests both need restating: the face has four sections, and the collector number is a numeral the face is now *required* to show. The prohibition narrows to attack, defense, and the star rating.
- `src/components/style-guide/style-guide.html` / `.ts` / `.css` — added card demonstrations described above; the size ladder's floor moves from 72px to the 120px minimum.
- `src/components/open-pack/` — **deleted** (`open-pack.ts`, `.html`, `.css`). Nothing imports it and no route reaches it, so the deletion touches no other file.
- `src/components/game/game.css` — `--card-h`'s lower clamp bound rises so `--card-w` cannot fall below 120px. No other game change.
- `src/styles/tokens.css` — new semantic tokens for the ability panel, the star track's unlit and sixth-star states, the bar label, the identity plate, and the rarity tiers. The style guide picks these up automatically.
- `CLAUDE.md` — the `Card Look and Feel` and `Board Look and Feel` blocks are removed and replaced by a pointer to `openspec/specs/design-system/card/`, which is now the authority. The in-game layout constraints are not yet covered by any spec, so they stay in the file marked as provisional pending the in-game rework rather than being dropped silently.
- `public/images/attack_icon.png`, `defense_icon.png` — no longer referenced by the card face. Left in place; removing them is not part of this change.
- No model change: `src/model/card.ts` already carries `ability`, `set`, and `number`. No game-logic change, no routing change.
