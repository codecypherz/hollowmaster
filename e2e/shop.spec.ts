import { expect, test } from '@playwright/test';
import {
  GRANT_GEO,
  PACK_MIN_WIDTH,
  PACK_PRICES,
  PACK_SIZE,
  buyPack,
  collected,
  expectNoScroll,
  expectPartsOnScreen,
  geoMark,
  grantGeo,
  label,
  openShop,
  openingSettled,
  openingStage,
  purse,
  purseValue,
  revealedCards,
  revealedRarities,
  sealedPack,
  type Size,
} from './helpers';

const VIEWPORT: Size = { width: 1440, height: 900 };

/** The sizes the storefront and the opening are expected to be looked at on. */
const LADDER: Size[] = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
];

// ─── 8.1 The storefront ─────────────────────────────────────────────────────

test.describe('the storefront', () => {
  test('shows the purse, the three packs in price order, and both placeholders', async ({
    page,
  }) => {
    await openShop(page);

    // The purse: zero for a new player rather than blank, and named by the
    // mark rather than by the word.
    await expect(purse(page)).toHaveText('0');
    await expect(page.locator('app-shop .purse')).not.toContainText('Geo');
    await expect(geoMark(purse(page))).toHaveAttribute('alt', 'Geo');

    // The word is nowhere on the storefront: every amount is a numeral and a
    // mark, and no copy spells the currency out beside one.
    await expect(page.locator('app-shop')).not.toContainText('Geo');

    // Three packs, in ascending price order: each a sealed wrapper carrying its
    // own name, with its price on the plate or control beside it, and no copy
    // about what is inside.
    const wares = page.locator('app-shop .ware');
    await expect(wares).toHaveCount(3);

    for (const [i, pack] of PACK_PRICES.entries()) {
      const ware = wares.nth(i);

      // One pack per ware, and the name printed on it rather than beside it.
      await expect(ware.locator('app-pack')).toHaveCount(1);
      await expect(ware.locator('app-pack .pack-name')).toHaveText(pack.name);
      await expect(ware.locator('.ware-name')).toHaveCount(0);

      // The wrapper's artwork is rendered, not merely referenced.
      const art = ware.locator('app-pack img.pack-art');
      await expect(art).toBeVisible();
      expect(await art.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);

      // The price is stated exactly once on the ware, as a Geo amount.
      const amounts = ware.locator('app-geo');
      await expect(amounts).toHaveCount(1);
      await expect(amounts).toHaveText(String(pack.price));
      await expect(geoMark(amounts)).toHaveCount(1);
    }

    await expect(page.locator('app-shop .ware-contents, app-shop .ware-odds')).toHaveCount(0);
    await expect(page.locator('app-shop .wares')).not.toContainText(`${PACK_SIZE} cards`);

    // Both forthcoming sections, marked as such and claiming no price.
    for (const id of ['power-ups', 'cosmetics']) {
      const placeholder = page.locator(`[data-placeholder="${id}"]`);
      await expect(placeholder).toBeVisible();
      await expect(placeholder).toContainText('Coming soon');
      await expect(placeholder.locator('button, a')).toHaveCount(0);
    }
  });

  test('makes every pack inert at zero Geo', async ({ page }) => {
    await openShop(page);
    await expect(purse(page)).toHaveText('0');

    await expect(page.locator('app-shop .ware.is-unaffordable')).toHaveCount(3);
    await expect(page.locator('[data-buy]')).toHaveCount(0);
    await expect(page.locator('[data-locked]')).toHaveCount(3);

    // The price stays on screen without becoming reachable: each inert plate
    // still states what the pack costs.
    for (const [i, pack] of PACK_PRICES.entries()) {
      const plate = page.locator(`[data-locked="${pack.id}"]`);
      await expect(plate.locator('app-geo')).toHaveText(String(pack.price));
      await expect(geoMark(plate)).toHaveCount(1);
      await expect(plate).toContainText('Not enough');
      await expect(plate.locator('button, a')).toHaveCount(0);
      expect(i).toBeGreaterThanOrEqual(0);
    }

    // Nothing inside a ware is reachable by pointer or by keyboard.
    await expect(page.locator('app-shop .ware button, app-shop .ware a')).toHaveCount(0);

    // Clicking one anyway buys nothing and opens nothing.
    await page.locator('app-shop .ware').first().click();
    await expect(page.locator('app-pack-opening')).toHaveCount(0);
    await expect(purse(page)).toHaveText('0');
  });

  test('makes Level 1 buyable after the grant, without a reload', async ({ page }) => {
    await openShop(page);
    await grantGeo(page);

    await expect(purse(page)).toHaveText(String(GRANT_GEO));
    await expect(page.locator('[data-buy="level-1"]')).toBeVisible();
    await expect(page.locator('[data-buy="level-3"]')).toBeVisible();
    await expect(page.locator('app-shop .ware.is-unaffordable')).toHaveCount(0);

    // The control that buys a pack is its price, and there is no second label.
    for (const pack of PACK_PRICES) {
      const control = page.locator(`[data-buy="${pack.id}"]`);
      await expect(control).toHaveText(String(pack.price));
      await expect(geoMark(control)).toHaveCount(1);
    }
    await expect(page.getByRole('button', { name: 'Buy' })).toHaveCount(0);
    await expect(page.locator('app-shop')).not.toContainText('Buy');

    // The grant says what it is, and the page offers no real-money purchase.
    await expect(page.locator('app-shop .dev-note')).toContainText('Temporary development aid');
    await expect(page.locator('app-shop')).not.toContainText('$');
  });

  test('activating a placeholder spends nothing and opens nothing', async ({ page }) => {
    await openShop(page);
    await grantGeo(page);

    for (const id of ['power-ups', 'cosmetics']) {
      await page.locator(`[data-placeholder="${id}"]`).click();
    }

    await expect(page.locator('app-pack-opening')).toHaveCount(0);
    await expect(purse(page)).toHaveText(String(GRANT_GEO));
  });
});

// ─── 8.2 The opening ────────────────────────────────────────────────────────

test.describe('opening a pack', () => {
  test('reveals five cards one at a time, common to rare, and returns the purse', async ({
    page,
  }) => {
    await openShop(page);
    await grantGeo(page);
    const before = await purseValue(page);

    await buyPack(page, 'level-3');

    // The balance is settled the moment the pack is bought, not at the end of
    // the animation.
    await expect(purse(page)).toHaveText(String(before - 500));

    // One at a time: the row holds five positions and fills them in turn.
    await expect(collected(page)).toHaveCount(PACK_SIZE);
    const counts: number[] = [];
    for (let expected = 1; expected <= PACK_SIZE; expected++) {
      await expect(revealedCards(page)).toHaveCount(expected);
      counts.push(expected);

      // Each revealed card's rarity is at least the one before it.
      const rarities = await revealedRarities(page);
      for (let i = 1; i < rarities.length; i++) {
        expect(rarities[i], `card ${i} after card ${i - 1}`).toBeGreaterThanOrEqual(
          rarities[i - 1],
        );
      }
    }
    expect(counts).toEqual([1, 2, 3, 4, 5]);

    await openingSettled(page);

    // The summary shows all five together, and closing restores the page.
    await expect(collected(page)).toHaveCount(PACK_SIZE);
    await page.getByRole('button', { name: 'Return to the Shop' }).click();
    await expect(page.locator('app-pack-opening')).toHaveCount(0);
    await expect(page.locator('app-shop .ware')).toHaveCount(3);
    await expect(purse(page)).toHaveText(String(before - 500));
  });

  test('opens on the sealed pack that was bought, before any card', async ({ page }) => {
    await openShop(page);
    await grantGeo(page);
    await buyPack(page, 'level-3');

    await expect(sealedPack(page)).toBeVisible();

    // One reading of the stage: while the pack is up, no card is.
    const stage = await openingStage(page);
    expect(stage.pack, 'the opening begins on the pack').toBe(true);
    expect(stage.heroCard).toBe(false);
    expect(stage.revealed).toBe(0);
    // The pack shown is the pack bought, laid out at or above its minimum.
    expect(stage.packName).toBe('Level 3');
    expect(stage.packWidth).toBeGreaterThanOrEqual(PACK_MIN_WIDTH);

    // The tear precedes the first reveal: the wrapper gives way to the cards.
    await expect(revealedCards(page)).toHaveCount(1);
    await expect(sealedPack(page)).toHaveCount(0);
  });

  test('shows the whole result when skipped while the pack is still sealed', async ({ page }) => {
    await openShop(page);
    await grantGeo(page);
    await buyPack(page, 'level-1');

    await expect(sealedPack(page)).toBeVisible();
    await page.getByRole('button', { name: 'Skip' }).click();

    await expect(revealedCards(page)).toHaveCount(PACK_SIZE);
    await expect(sealedPack(page)).toHaveCount(0);
    await openingSettled(page);
  });

  test('lays the hero card out above the ability gate of the card renderer', async ({ page }) => {
    await openShop(page);
    await grantGeo(page);
    await buyPack(page, 'level-1');

    const hero = page.locator('app-pack-opening .hero-card');
    await expect(hero).toBeVisible();

    // The laid-out width rather than the painted box: the first card rises out
    // of the torn pack under a scaling entrance, and the ability gate is a
    // container query on the card's own layout width, not on its transform.
    const width = await hero.evaluate((el: HTMLElement) => el.offsetWidth);
    expect(width, 'the hero card is above the 200px ability gate').toBeGreaterThanOrEqual(200);

    // The ability text, the set, and the number are all on the face and shown.
    const ability = hero.locator('app-card .cf-ability-text');
    await expect(ability).toBeVisible();
    await expect(ability).not.toBeEmpty();
    await expect(hero.locator('app-card .cf-plate')).toBeVisible();
    await expect(hero.locator('app-card .cf-set')).toHaveText('FC');
    await expect(hero.locator('app-card .cf-number')).toHaveText(/^\d{3}$/);

    // And it is a real card face from the shared renderer, not a summary of
    // one: artwork, star track, chevrons, and stat bars, all through app-card.
    await expect(hero.locator('app-card .cf-img')).toBeVisible();
    await expect(hero.locator('app-card .arr')).toHaveCount(8);
    await expect(hero.locator('app-card .cf-name-text')).not.toBeEmpty();
    await expect(hero.locator('app-card .star')).toHaveCount(5);
    await expect(hero.locator('app-card .stat-bar')).toHaveCount(2);
  });

  test('shows all five at once when skipped, in the same order', async ({ page }) => {
    await openShop(page);
    await grantGeo(page);
    await buyPack(page, 'level-2');

    await expect(revealedCards(page)).toHaveCount(1);
    const partial = await revealedRarities(page);

    await page.getByRole('button', { name: 'Skip' }).click();

    await expect(revealedCards(page)).toHaveCount(PACK_SIZE);
    const all = await revealedRarities(page);
    expect(all.slice(0, partial.length)).toEqual(partial);
    for (let i = 1; i < all.length; i++) expect(all[i]).toBeGreaterThanOrEqual(all[i - 1]);
  });

  test('keeps the five cards when the player navigates away mid-reveal', async ({ page }) => {
    await openShop(page);
    await grantGeo(page);
    const before = await purseValue(page);
    await buyPack(page, 'level-1');

    await page.goto('/battle');
    await openShop(page);

    await expect(purse(page)).toHaveText(String(before - 100));
    await expect(page.locator('app-pack-opening')).toHaveCount(0);
  });

  test('every summary card stays at or above the card minimum width', async ({ page }) => {
    await openShop(page);
    await grantGeo(page);
    await buyPack(page, 'level-1');
    await page.getByRole('button', { name: 'Skip' }).click();
    await openingSettled(page);

    const widths = await collected(page).evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().width),
    );
    expect(widths).toHaveLength(PACK_SIZE);
    for (const width of widths) expect(width).toBeGreaterThanOrEqual(120);
  });
});

// ─── 8.3 Persistence in the browser ─────────────────────────────────────────

test('a purchase survives a reload', async ({ page }) => {
  await openShop(page);
  await grantGeo(page);
  const before = await purseValue(page);

  await buyPack(page, 'level-1');
  await page.getByRole('button', { name: 'Skip' }).click();
  await openingSettled(page);

  // The collection as the application itself reports it, before and after.
  const held = () => page.evaluate(() => JSON.parse(localStorage.getItem('hollowmaster.user.v1')!));
  const saved = await held();
  const totalOf = (record: { collection: { quantity: number }[] }) =>
    record.collection.reduce((sum, e) => sum + e.quantity, 0);

  expect(saved.geo).toBe(before - 100);
  expect(totalOf(saved)).toBe(9 + PACK_SIZE);

  await page.reload();
  await expect(page.locator('app-shop .ware')).toHaveCount(3);

  await expect(purse(page)).toHaveText(String(before - 100));
  const restored = await held();
  expect(restored.geo).toBe(saved.geo);
  expect(totalOf(restored)).toBe(totalOf(saved));
});

// ─── 8.5 The fit ────────────────────────────────────────────────────────────

test.describe('the Shop and the opening fit the viewport', () => {
  for (const size of LADDER) {
    test(`at ${label(size)} neither scrolls nor clips`, async ({ page }) => {
      await page.setViewportSize(size);
      await openShop(page);
      await grantGeo(page);

      await expectNoScroll(page);
      await expectPartsOnScreen(page, size, {
        content: page.locator('app-shop .content'),
        ware: page.locator('app-shop .ware'),
        pack: page.locator('app-shop app-pack'),
        purse: page.locator('app-shop .purse'),
        placeholder: page.locator('app-shop .placeholder'),
        grant: page.locator('app-shop .dev-grant'),
      });

      // No storefront pack is laid out below the width its renderer vouches for.
      const storefront = await page
        .locator('app-shop app-pack')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
      expect(storefront).toHaveLength(PACK_PRICES.length);
      for (const width of storefront) expect(width).toBeGreaterThanOrEqual(PACK_MIN_WIDTH);

      await buyPack(page, 'level-3');

      // The sealed stage fits too, and the pack is whole on screen.
      await expect(sealedPack(page)).toBeVisible();
      await expectNoScroll(page);
      await expectPartsOnScreen(page, size, { sealedPack: sealedPack(page) });
      expect((await openingStage(page)).packWidth).toBeGreaterThanOrEqual(PACK_MIN_WIDTH);

      await page.getByRole('button', { name: 'Skip' }).click();
      await openingSettled(page);

      await expectNoScroll(page);
      await expectPartsOnScreen(page, size, {
        opening: page.locator('app-pack-opening .opening'),
        collected: collected(page),
        controls: page.locator('app-pack-opening .opening-controls'),
      });
    });
  }
});

/**
 * Smaller than the overlay's own layout, so the fit has to do something. The
 * requirement is that it scales the whole surface rather than clipping a card
 * or re-flowing the row.
 */
const SUB_MINIMUM: Size = { width: 760, height: 560 };

test(`at ${label(SUB_MINIMUM)} the overlay is scaled rather than reflowed`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openShop(page);
  await grantGeo(page);
  await buyPack(page, 'level-2');
  await page.getByRole('button', { name: 'Skip' }).click();
  await openingSettled(page);

  const laidOut = await page
    .locator('app-pack-opening .opening')
    .evaluate((el: HTMLElement) => ({ width: el.offsetWidth, height: el.offsetHeight }));

  await page.setViewportSize(SUB_MINIMUM);

  // A single uniform transform, and the layout underneath it is untouched: the
  // same laid-out size, the same five positions, in the same row.
  await expect
    .poll(() =>
      page
        .locator('app-pack-opening')
        .evaluate((el: HTMLElement) =>
          Number(getComputedStyle(el).getPropertyValue('--overlay-scale')),
        ),
    )
    .toBeLessThan(1);

  expect(
    await page
      .locator('app-pack-opening .opening')
      .evaluate((el: HTMLElement) => ({ width: el.offsetWidth, height: el.offsetHeight })),
  ).toEqual(laidOut);

  await expect(collected(page)).toHaveCount(PACK_SIZE);
  const tops = await collected(page).evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().top)),
  );
  expect(new Set(tops).size, 'the row stays one row').toBe(1);

  // Nothing of the overlay is clipped. The storefront behind it is a fixed
  // overlay's backdrop and is not required to fit a viewport this far below
  // the sizes the Shop is checked at.
  await expectPartsOnScreen(page, SUB_MINIMUM, {
    opening: page.locator('app-pack-opening .opening'),
    collected: collected(page),
  });
});

// ─── 8.6 Review artifacts ───────────────────────────────────────────────────

test('captures the storefront, a mid-reveal hero, and the summary', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await openShop(page);
  await grantGeo(page);

  // Review artifacts, not baselines: written to the run's output directory for
  // a person to look at, never compared against a stored image. Animations are
  // settled first so each shot is the state at rest rather than a frame part
  // way through a transition.
  const shot = (name: string) =>
    page.screenshot({ path: test.info().outputPath(name), animations: 'disabled' });

  await shot('shop-storefront.png');

  await buyPack(page, 'level-3');
  await expect(sealedPack(page)).toBeVisible();
  await shot('shop-opening-sealed.png');

  await expect(page.locator('app-pack-opening .hero-card')).toBeVisible();
  await shot('shop-opening-hero.png');

  await page.getByRole('button', { name: 'Skip' }).click();
  await openingSettled(page);
  await shot('shop-opening-summary.png');
});
