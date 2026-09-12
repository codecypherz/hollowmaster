## 1. The Geo amount primitive

- [x] 1.1 Add `.geo-amount` and `.geo-mark` to `src/styles/primitives.css` — the mark sized in `em` off the surrounding type and sat on the numeral's baseline — and verify by rendering an amount at a small and a large font size that the mark stays proportionate in both.
- [x] 1.2 Create `src/components/geo/` (`geo.ts`, `geo.html`, `geo.css`) as standalone `<app-geo [amount]>` rendering the numeral then `<img src="/images/geo.png" alt="Geo">`, and verify with `ng test` that a new `geo.spec.ts` asserts the order of the two nodes, the `alt` text, and that zero renders as `0` rather than blank.
- [x] 1.3 Verify with a Vitest case that `<button><app-geo [amount]="100"/></button>` computes an accessible name containing both the amount and "Geo".

## 2. The pack renderer

- [x] 2.1 Create `src/components/pack/` as standalone `<app-pack [pack] [torn]>` with `container: pack / inline-size`, `aspect-ratio: 2.5 / 4`, and `min-width: 120px`, and verify with `ng test` that a new `pack.spec.ts` asserts the tier name renders as text inside the component and that `torn` defaults to false.
- [x] 2.2 Build the wrapper face in `pack.css` — cover-cropped centred artwork, gold trim with inset depth, and the crimped top and bottom bands (stripe gradient with a serrated mask) — every metric a `clamp(px, cqw, px)`, and verify in the browser at storefront size and at 120px that all four parts are distinguishable at both.
- [x] 2.3 Add the printed tier name across the top of the face over a scrim band, and verify it is legible over each of the three region posters by pointing the component at `card-pack-ct.png` and `card-pack-gp.png` in a scratch spec.
- [x] 2.4 Add the travelling foil sheen, suppressed to a still highlight under `prefers-reduced-motion`, and verify with `npm run e2e -- reduced-motion` that the highlight is present and not animating under that preference.
- [x] 2.5 Implement the `torn` state as a ragged broken top edge leaving artwork, name, trim, and bottom crimp unchanged, and verify by rendering sealed and torn side by side that only the top edge differs and the extent is identical.
- [x] 2.6 Verify with a Vitest case that the wrapper prints no card count, no rarity odds, and no price.

## 3. The storefront

- [x] 3.1 Replace the ware's name, poster `<img>`, and price line in `shop.html` with `<app-pack>`, and verify with `ng test` that `shop.spec.ts` asserts each ware contains exactly one `app-pack` and no name element outside it.
- [x] 3.2 Make the buy control the price — `<button class="hk-btn" [attr.data-buy]>` labelled with `<app-geo [amount]="ware.price"/>` — and verify with `ng test` that no control is labelled "Buy" and each ware states its price exactly once.
- [x] 3.3 Carry the price onto the unaffordable `.ware-locked` plate alongside its "not enough" line, keeping `data-locked` and the no-control structure, and verify with `ng test` that an unaffordable ware shows its price and exposes no button.
- [x] 3.4 Render the purse and the development grant through `<app-geo>`, keeping `data-testid="purse"` on the amount so `purseValue()` still parses, and verify with `ng test` that the word "Geo" appears nowhere in the rendered Shop.
- [x] 3.5 Move the hover lift and the unaffordable greyscale from `.ware-art` to the pack in `shop.css`, delete the now-dead `.ware-art`, `.ware-name`, `.ware-price`, `.price-amount`, `.price-currency`, and `.purse-currency` rules, and verify the storefront still clears a 1366×768 viewport without scrolling.

## 4. The opening

- [x] 4.1 Add the `pack` input to `PackOpening` and pass the bought `PackDefinition` from `shop.ts`, and verify with `ng test` that the overlay renders the bought tier's pack.
- [x] 4.2 Add the `sealed` signal with `SEAL_DWELL_MS` and `TEAR_MS` beside the existing dwell constants, start it from `ngOnInit`, and clear it in `finish()`, and verify with `ng test` that the sealed pack is shown before any card, that the first reveal follows the tear, and that `finish()` leaves no stage behind.
- [x] 4.3 Lay the sealed pack out in the hero slot at the hero card's height and extend the refit `effect` to read `sealed()`, and verify with `npm run e2e -- shop` that no scrollbar appears and the pack is wholly on screen at 1920×1080, 1440×900, and 1366×768.
- [x] 4.4 Animate the tear and the first card rising out of the torn pack as it fades, and verify by watching `npm run e2e:headed -- shop` that the card arrives from the pack rather than from nowhere.
- [x] 4.5 Verify with `ng test` that skipping while the pack is still sealed shows all five cards immediately and that a reduced-motion opening plays no tear.

## 5. The style guide

- [x] 5.1 Add a Geo section to `style-guide.html` showing zero, a price, the purse amount, and an amount inside a button, and verify the section renders at `/style-guide` with the mark proportionate at each size.
- [x] 5.2 Add a pack section showing the three tiers sealed, one torn, and one at the 120px minimum, and verify at `/style-guide` that crimps, trim, sheen, centred artwork, and the printed name are each observable — including on the narrowest example.

## 6. Verification

- [x] 6.1 Update `e2e/shop.spec.ts` and `e2e/helpers.ts`: the purse must not contain the word "Geo" but must carry the mark, `[data-buy]` is labelled with its price, and the locked ware still shows one, and verify with `npm run e2e -- shop`.
- [x] 6.2 Add browser coverage for the sealed stage — the pack is visible and above its 120px minimum before the first card, and the storefront's three packs are unclipped across the viewport ladder — and verify with `npm run e2e -- shop`.
- [x] 6.3 Capture storefront and opening screenshots into `test-results/` for review, and verify by eye that the wares read as sealed foil packs rather than as posters.
- [x] 6.4 Run `ng test`, `npm run e2e`, and Prettier across the changed files, and verify all three are clean.
