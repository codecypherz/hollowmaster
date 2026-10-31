import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  CARD_ABILITY_GATE,
  CARD_MIN_WIDTH,
  type Size,
  collectionSettled,
  deckButton,
  deckCards,
  exchangeTile,
  exchangeTiles,
  expectNoScroll,
  label,
  openCollection,
  openCollectionAs,
  openDecks,
  rosaryPurse,
  rosaryPurseValue,
} from './helpers';

/**
 * The Collection page: every card of every set, owned or not, and the Rosary
 * exchange. What only a browser can answer lives here — fit, geometry, the
 * purse's corner, and round trips through storage and the other pages.
 */

const LARGE: Size = { width: 1920, height: 1080 };
const SMALL: Size = { width: 1100, height: 620 };

/** The starters, one copy each. */
const STARTERS = [1, 7, 8, 9, 10, 11, 12, 13, 14].map((number) => ({
  set: 'FC',
  number,
  quantity: 1,
}));

function heldStarters(overrides: Record<number, number> = {}) {
  return STARTERS.map((entry) => ({ ...entry, quantity: overrides[entry.number] ?? 1 }));
}

const buy = (tile: Locator) => tile.locator('button.buy');
const sell = (tile: Locator) => tile.locator('button.sell');
const badge = (tile: Locator) => tile.locator('.badge');
const progress = (page: Page) =>
  page.locator('app-collection .set-section').first().locator('.set-progress .sr-only');

// ─── Fit ────────────────────────────────────────────────────────────────────

for (const size of [LARGE, SMALL]) {
  test(`at ${label(size)} only the sections scroll and the frame is right`, async ({ page }) => {
    await page.setViewportSize(size);
    await openCollectionAs(page, { rosaries: 450, collection: heldStarters(), decks: [] });
    await collectionSettled(page);

    await expectNoScroll(page);

    // The sections are the one region that scrolls; the top bar stays put.
    const region = page.getByTestId('sections');
    const scrolls = await region.evaluate((el) => el.scrollHeight > el.clientHeight);
    if (scrolls) {
      const before = await rosaryPurse(page).boundingBox();
      await region.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await expect.poll(() => region.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
      expect(await rosaryPurse(page).boundingBox()).toEqual(before);
      await expectNoScroll(page);
      await region.evaluate((el) => el.scrollTo(0, 0));
    }

    // No corner frame; the atmosphere stays.
    await expect(page.locator('app-collection .corner')).toHaveCount(0);
    await expect(page.locator('app-collection .void-bg')).toHaveCount(1);
    await expect(page.locator('app-collection .mist-layer')).toHaveCount(1);
    await expect(page.locator('app-collection .particles .particle').first()).toBeAttached();

    // The purse is in the top-right and clear of the title.
    const purse = (await page.locator('app-collection .purse').boundingBox())!;
    const title = (await page.locator('app-collection .screen-header-title').boundingBox())!;
    expect(purse.x + purse.width).toBeGreaterThan(size.width * 0.9);
    expect(purse.x + purse.width).toBeLessThanOrEqual(size.width);
    expect(purse.y).toBeLessThan(80);
    const overlaps =
      purse.x < title.x + title.width &&
      title.x < purse.x + purse.width &&
      purse.y < title.y + title.height &&
      title.y < purse.y + purse.height;
    expect(overlaps).toBe(false);

    // The header is on one line.
    const lines = await page
      .locator('app-collection .screen-header-title')
      .evaluate((el) =>
        Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)),
      );
    expect(lines).toBe(1);

    // Every card sits in the renderer's no-ability band.
    const widths = await exchangeTiles(page).evaluateAll((tiles) =>
      tiles.map((tile) => (tile.querySelector('app-card') as HTMLElement).offsetWidth),
    );
    for (const width of widths) {
      expect(width).toBeGreaterThanOrEqual(CARD_MIN_WIDTH);
      expect(width).toBeLessThan(CARD_ABILITY_GATE);
    }
    const abilityWidths = await exchangeTiles(page).evaluateAll((tiles) =>
      tiles.map(
        (tile) => tile.querySelector('app-card .cf-ability')?.getBoundingClientRect().width ?? 0,
      ),
    );
    for (const width of abilityWidths) expect(width).toBeLessThanOrEqual(1);

    // The heading and the first tile share the region's left edge.
    const edges = await page
      .locator('app-collection .set-section')
      .first()
      .evaluate((section) => {
        const name = section.querySelector('.set-name')!.getBoundingClientRect().left;
        const tile = section.querySelector('.tile')!.getBoundingClientRect().left;
        return { name, tile };
      });
    expect(Math.abs(edges.name - edges.tile)).toBeLessThanOrEqual(1);

    // No exchange control overflows its tile.
    const overflowing = await page
      .locator('app-collection .exchange')
      .evaluateAll((buttons) => buttons.filter((b) => b.scrollWidth > b.clientWidth + 0.5).length);
    expect(overflowing).toBe(0);

    await page.screenshot({ path: `test-results/collection-${label(size)}.png` });
  });
}

test('the badges obscure nothing the card draws', async ({ page }) => {
  await page.setViewportSize(LARGE);
  await openCollectionAs(page, { collection: heldStarters({ 1: 9 }), decks: [] });
  await collectionSettled(page);

  // Crawlid is held nine times; Gruz Mother (FC 2) is not held at all.
  for (const tile of [exchangeTile(page, 'FC', 1), exchangeTile(page, 'FC', 2)]) {
    const touched = await tile.evaluate((el) => {
      const b = el.querySelector('.badge')!.getBoundingClientRect();
      const hits = (sel: string) =>
        [...el.querySelectorAll(`app-card ${sel}`)].filter((part) => {
          const r = part.getBoundingClientRect();
          return r.left < b.right && b.left < r.right && r.top < b.bottom && b.top < r.bottom;
        }).length;
      return {
        name: hits('.cf-name-text'),
        stars: hits('.star'),
        bars: hits('.stat-bar'),
        chevrons: hits('.arr'),
      };
    });
    expect(touched).toEqual({ name: 0, stars: 0, bars: 0, chevrons: 0 });
  }
});

test('the nav offers four destinations in order and fits the narrowest viewport', async ({
  page,
}) => {
  await page.setViewportSize(SMALL);
  await openCollection(page);
  const nav = page.getByRole('navigation', { name: 'Primary' });
  const links = nav.getByRole('link');
  await expect(links).toHaveText(['Shop', 'Battle', 'Decks', 'Collection']);
  await expect(nav.getByRole('link', { name: 'Collection' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  // One row: every destination shares a top edge.
  const tops = await links.evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().top)),
  );
  expect(new Set(tops).size).toBe(1);
  await expectNoScroll(page);
  await nav.screenshot({ path: `test-results/collection-nav-${label(SMALL)}.png` });
});

test('the most expensive tile shows both prices inside the tile', async ({ page }) => {
  await page.setViewportSize(LARGE);
  // Goam (FC 6) is the highest-rated card catalogued.
  await openCollectionAs(page, {
    rosaries: 0,
    collection: [...heldStarters(), { set: 'FC', number: 6, quantity: 1 }],
    decks: [],
  });
  await collectionSettled(page);
  const goam = exchangeTile(page, 'FC', 6);
  await expect(buy(goam)).toHaveAccessibleName('Buy Goam for 400 Rosaries');
  await expect(sell(goam)).toHaveAccessibleName('Sell Goam for 40 Rosaries');
  const tile = (await goam.boundingBox())!;
  for (const control of [buy(goam), sell(goam)]) {
    const box = (await control.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(tile.x - 0.5);
    expect(box.x + box.width).toBeLessThanOrEqual(tile.x + tile.width + 0.5);
  }
  await goam.screenshot({ path: 'test-results/collection-tile-highest-price.png' });
});

// ─── Exchange round trips ───────────────────────────────────────────────────

test('a sale and a purchase update the page at once and survive a reload', async ({ page }) => {
  await page.setViewportSize(LARGE);
  await openCollectionAs(page, { rosaries: 90, collection: heldStarters(), decks: [] });
  await expect(rosaryPurse(page)).toHaveText('90');

  const crawlid = exchangeTile(page, 'FC', 1);
  const gruzMother = exchangeTile(page, 'FC', 2); // three stars, unowned
  await expect(progress(page)).toHaveText('9 of 15 collected');
  await expect(badge(gruzMother)).toHaveAccessibleName('Not owned');
  await expect(buy(crawlid)).toHaveAttribute('aria-disabled', 'true');

  // Sell the only Crawlid by keyboard: the purse rises, the tile un-owns, the
  // focus lands on its buy control, which is now affordable.
  await sell(crawlid).focus();
  await page.keyboard.press('Enter');
  await expect(rosaryPurse(page)).toHaveText('100');
  await expect(badge(crawlid)).toHaveAccessibleName('Not owned');
  await expect(sell(crawlid)).toHaveCount(0);
  await expect(progress(page)).toHaveText('8 of 15 collected');
  await expect(buy(crawlid)).toBeFocused();
  await expect(buy(crawlid)).not.toHaveAttribute('aria-disabled');
  await expect(page.getByTestId('exchange-announcement')).toHaveText(
    'Sold Crawlid for 10 Rosaries.',
  );

  // Buy it back.
  await page.keyboard.press('Enter');
  await expect(rosaryPurse(page)).toHaveText('0');
  await expect(badge(crawlid)).toHaveAccessibleName('1 held');
  await expect(progress(page)).toHaveText('9 of 15 collected');
  await expect(buy(crawlid)).toBeFocused();

  // The unaffordable control is inert.
  // Playwright will not click a control marked unavailable, so it is
  // activated the way a keyboard user would.
  await buy(gruzMother).focus();
  await page.keyboard.press('Enter');
  await expect(rosaryPurse(page)).toHaveText('0');
  await expect(badge(gruzMother)).toHaveAccessibleName('Not owned');

  // A further sale, then a reload.
  await sell(exchangeTile(page, 'FC', 7)).click();
  await expect(rosaryPurse(page)).toHaveText('10');
  await page.reload();
  await expect(rosaryPurse(page)).toHaveText('10');
  await expect(badge(crawlid)).toHaveAccessibleName('1 held');
  await expect(badge(exchangeTile(page, 'FC', 7))).toHaveAccessibleName('Not owned');
  expect(await rosaryPurseValue(page)).toBe(10);
});

test('selling the last copy a deck uses takes it out of that deck', async ({ page }) => {
  await page.setViewportSize(LARGE);
  await openCollectionAs(page, {
    collection: heldStarters(),
    decks: [[{ set: 'FC', number: 1 }], [{ set: 'FC', number: 7 }], [{ set: 'FC', number: 1 }]],
  });

  const crawlid = exchangeTile(page, 'FC', 1);
  await expect(sell(crawlid)).toHaveAttribute('title', 'Selling removes it from Deck 1 and Deck 3');
  await expect(sell(crawlid).locator('.warn-mark')).toBeVisible();
  await expect(sell(exchangeTile(page, 'FC', 8)).locator('.warn-mark')).toHaveCount(0);
  await sell(crawlid).click();
  await expect(page.getByTestId('exchange-announcement')).toHaveText(
    'Sold Crawlid for 10 Rosaries. Removed from Deck 1 and Deck 3.',
  );

  // Through the nav, so the change is read live rather than off a reload.
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Decks' })
    .click();
  await expect(page).toHaveURL(/\/decks$/);
  await expect(deckCards(page)).toHaveCount(0);
  await deckButton(page, 'Deck 2').click();
  await expect(deckCards(page)).toHaveCount(1);
  await deckButton(page, 'Deck 3').click();
  await expect(deckCards(page)).toHaveCount(0);
});

test("the Decks page's reset zeroes the purse", async ({ page }) => {
  await openCollectionAs(page, { rosaries: 340, collection: heldStarters(), decks: [[]] });
  await expect(rosaryPurse(page)).toHaveText('340');

  await openDecks(page);
  await page.getByRole('button', { name: 'Reset data' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(/Rosaries/);
  await dialog.getByRole('button', { name: 'Reset data' }).click();

  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Collection' })
    .click();
  await expect(rosaryPurse(page)).toHaveText('0');
});
