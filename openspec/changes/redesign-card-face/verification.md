# Verification walk

The unit suite covers the DOM the component produces. jsdom does not evaluate container
queries and cannot judge craft, so everything below was checked on the style guide at
`/style-guide` in Chromium, driven headlessly and read back by measurement where a
measurement was possible. `ng test` (88 tests) and `npx prettier --check src` are green.

## Requirements the tests cannot reach

**The ability section is gated by the card's rendered width.** The size ladder renders the
same card at 120 / 160 / 199 / 200 / 260px with identical inputs. `.cf-ability` computes to
`position: absolute` at 120, 160 and 199, and `position: static` at 200 and 260; `.face`
switches from three grid rows to four at the same boundary. Resizing one slot 150 → 240 →
150px flips the section on and back with no surface action. The aspect ratio measures 1.400
at every rung. Below the gate the text stays in the DOM under the project's `.sr-only`
treatment, so `aria-describedby` keeps resolving.

**Chevron placement is unaffected by the gate.** All eight chevrons sit exactly 4px from
their border edges at both 199px and 200px; the only difference between the two readings is
the one pixel the card itself grew.

**The frame reads as a physical trading card.** Outer gradient border (painted to the border
box, so it carries a metal a `border-color` cannot), a recessed interior with a hairline rim
and inner shadow, and an art window with its own inset ring plus a bottom-weighted vignette
and top gloss — three distinguishable depths. With the artwork forced to a missing URL, the
window holds its height, keeps its inset ring, and the other three sections stay in place.

**The frame reflects the card's rarity.** Six frames side by side at one size on the guide's
rarity row: slate carapace, tarnished bronze, bone silver, gold, soul-lit bright gold, and
the void-touched sixth with its animated sheen — the most distinct of the six. Rarity is
still stated independently by the star track, so the frame is reinforcement only. Ownership
keeps its own channel (aura and pip) and reads on every tier.

**Star track and the sixth star.** Ratings 1-6 each render five slots with the lit count
equal to the rating; unlit slots read as empty settings rather than faded stars. `.star-six`
appears only at 6, outside the plaque and overlapping its right edge, larger and crimson-
violet with a radiating glow. Ratings 5 and 6 have no card in `CARD_DB`, so the guide
synthesises one for each rather than skipping the tier.

**Minimum supported width and ornament degradation.** Nothing on the guide renders a card
below 120px. At exactly 120px the name, all five star slots, both `AT`/`DE` labels, both
bars, and all eight chevrons are present and legible; a geometric sweep of every card on the
page found no element escaping its frame and no section overflowing its own bounds. Below
160px the bar gradations, the fill's specular edge, the plaque rim, the frame's bevel
hairlines and the rarity sheen drop out — ornament only; no section, slot, bar, label or
chevron goes with them.

**Reduced motion.** With the OS setting on, no card animates: the selection pulse, the
capture flip, the sixth star's pulse and the 6-star frame sheen all compute to
`animation-name: none`. Selection stays legible as lift plus a static rim, and rarity stays
legible as the frame's static metal.

**Stat labels over fill and over track.** The `AT`/`DE` capsule carries its own ground, so it
reads on a low-attack card (label over the empty track) and a high-attack one (label over a
bright fill) alike. The two fills stay distinguishable without reading the label — amber
against blue.

## Against the reference sketch, at 260px

Four sections in the drawn order (name, image, stats, ability); chevrons inside the border
and outside every section; the star plaque in the image's top-left; `AT` and `DE` inside
their own bars; the ability panel below a hairline rule with the set and collector number on
a plate in its bottom-right, and the ability text fading rather than cutting where it
overruns.
