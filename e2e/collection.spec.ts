import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  CARD_ABILITY_GATE,
  CARD_MIN_WIDTH,
  type Size,
  cardButton,
  cardReader,
  cartControl,
  cartDialog,
  collectionSettled,
  deckButton,
  deckCards,
  exchangeRates,
  exchangeRow,
  exchangeTile,
  exchangeTiles,
  expectNoScroll,
  label,
  openCart,
  openCollection,
  openCollectionAs,
  purseButton,
  rosaryPurse,
  rosaryPurseValue,
} from './helpers';

/**
 * The Collection page: every card of every set, owned or not, and the cart its
 * trades are lined up in. What only a browser can answer lives here — fit,
 * geometry, the top corners, and round trips through storage and the other
 * pages.
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

const buy = (tile: Locator) => exchangeRow(tile, 'buy');
const sell = (tile: Locator) => exchangeRow(tile, 'sell');
const confirm = (dialog: Locator) => dialog.locator('.cart-confirm');
const badge = (tile: Locator) => tile.locator('.badge');
const progress = (page: Page) =>
  page.locator('app-collection .set-section').first().locator('.set-progress .sr-only');

type Box = { x: number; y: number; width: number; height: number };

const overlap = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

async function goTo(page: Page, name: string): Promise<void> {
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name }).click();
}

/** Tabs (or Shift+Tabs) until `target` holds focus, as a keyboard player would. */
async function tabTo(page: Page, target: Locator, key: 'Tab' | 'Shift+Tab' = 'Tab') {
  for (let i = 0; i < 40; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press(key);
  }
  await expect(target).toBeFocused();
}

/** The focused control draws a visible indicator. */
async function expectFocusVisible(target: Locator): Promise<void> {
  await expect(target).toBeFocused();
  const outline = await target.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThan(0);
}

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
      const cartBefore = await cartControl(page).boundingBox();
      await region.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await expect.poll(() => region.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
      expect(await rosaryPurse(page).boundingBox()).toEqual(before);
      expect(await cartControl(page).boundingBox()).toEqual(cartBefore);
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
    expect(overlap(purse, title)).toBe(false);

    // The cart control is in the top-left, clear of both.
    const cart = (await cartControl(page).boundingBox())!;
    expect(cart.x).toBeGreaterThanOrEqual(0);
    expect(cart.x).toBeLessThan(size.width * 0.05);
    expect(cart.y).toBeGreaterThanOrEqual(0);
    expect(cart.y).toBeLessThan(80);
    expect(overlap(cart, title)).toBe(false);
    expect(overlap(cart, purse)).toBe(false);

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

    await page.screenshot({ path: `test-results/collection-${label(size)}.png` });
  });
}

for (const size of [LARGE, SMALL]) {
  test(`at ${label(size)} every frame is one size and holds its rows`, async ({ page }) => {
    await page.setViewportSize(size);
    // FC 1 sells three digits' worth, FC 3 has a warned sale, FC 4 is unowned,
    // and FC 7 is held twelve times.
    await openCollectionAs(page, {
      rosaries: 450,
      collection: [
        { set: 'FC', number: 1, quantity: 130 },
        { set: 'FC', number: 3, quantity: 1 },
        { set: 'FC', number: 7, quantity: 12 },
      ],
      decks: [[{ set: 'FC', number: 3 }]],
    });
    await collectionSettled(page);

    // The warning's arrival moves nothing in its row.
    const warned = sell(exchangeTile(page, 'FC', 3));
    const still = [
      warned.row.locator('.row-label'),
      warned.row.locator('.row-price app-rosary'),
      warned.lower,
      warned.value,
      warned.raise,
      warned.target,
    ];
    const before = await Promise.all(still.map((part) => part.boundingBox()));
    await warned.raise.click();
    await expect(warned.warning).toBeVisible();
    expect(await Promise.all(still.map((part) => part.boundingBox()))).toEqual(before);

    await sell(exchangeTile(page, 'FC', 1)).target.click();
    await expect(sell(exchangeTile(page, 'FC', 1)).value).toHaveValue('121');
    await page.mouse.move(0, 0);

    const tiles = await exchangeTiles(page).evaluateAll((els) =>
      els.map((tile) => {
        const rect = (el: Element) => {
          const { left, right, top, bottom, width, height } = el.getBoundingClientRect();
          return { left, right, top, bottom, width, height };
        };
        const all = (selector: string) => [...tile.querySelectorAll(selector)].map(rect);
        return {
          frame: rect(tile),
          border: parseFloat(getComputedStyle(tile).borderTopWidth),
          innerLeft:
            tile.getBoundingClientRect().left + parseFloat(getComputedStyle(tile).borderLeftWidth),
          number: rect(tile.querySelector('.tile-number')!),
          card: rect(tile.querySelector('app-card')!),
          badge: rect(tile.querySelector('.badge')!),
          rows: all('.row'),
          // The label and the warning beside it, with the price beneath.
          heads: [...tile.querySelectorAll('.row')].map((row) =>
            ['.row-label', '.warn-slot', '.row-price app-rosary'].map((part) =>
              rect(row.querySelector(part)!),
            ),
          ),
          bars: all('.hk-seg'),
          segments: [...tile.querySelectorAll('.row')].map((row) =>
            ['.lower', '.value', '.raise', '.target'].map((part) => rect(row.querySelector(part)!)),
          ),
          overflowing: [...tile.querySelectorAll('.row, .row-head, .value, .row button')].filter(
            (el) => el.scrollWidth > el.clientWidth + 0.5,
          ).length,
        };
      }),
    );

    for (const tile of tiles) {
      // One visible frame, of one size.
      expect(tile.border).toBeGreaterThan(0);
      expect(tile.frame.width).toBeCloseTo(tiles[0].frame.width, 1);
      expect(tile.frame.height).toBeCloseTo(tiles[0].frame.height, 1);

      // Number, card, badge, Sell row, Buy row, top to bottom; nothing of the
      // frame's on the card.
      const [sellRow, buyRow] = tile.rows;
      expect(tile.number.bottom).toBeLessThanOrEqual(tile.card.top);
      expect(tile.badge.top).toBeGreaterThanOrEqual(tile.card.bottom - 3);
      expect(sellRow.top).toBeGreaterThanOrEqual(tile.badge.bottom);
      expect(sellRow.top).toBeGreaterThanOrEqual(tile.card.bottom);
      expect(buyRow.top).toBeGreaterThanOrEqual(sellRow.bottom);
      expect(tile.number.left - tile.frame.left).toBeLessThan(16);

      // Nothing runs out of the frame or into its neighbour in the row.
      expect(tile.overflowing).toBe(0);
      tile.heads.forEach(([label, warning, price], i) => {
        const bar = tile.bars[i];
        expect(label.left).toBeGreaterThanOrEqual(tile.frame.left);
        expect(warning.left).toBeGreaterThanOrEqual(label.right - 0.5);
        expect(warning.right).toBeLessThanOrEqual(bar.left);
        expect(price.top).toBeGreaterThanOrEqual(label.bottom - 0.5);
        expect(price.right).toBeLessThanOrEqual(bar.left);
        expect(price.bottom).toBeLessThanOrEqual(tile.rows[i].bottom + 0.5);
        expect(bar.right).toBeLessThanOrEqual(tile.frame.right);

        // The label and the price are centred between the frame and the bar,
        // warned or not.
        const middle = (tile.innerLeft + bar.left) / 2;
        for (const part of [label, price]) {
          expect(Math.abs((part.left + part.right) / 2 - middle)).toBeLessThanOrEqual(1);
        }
      });

      // One bar: each segment starts on the rule the one before it ends with.
      tile.segments.forEach((segments, row) => {
        segments.forEach((segment, i) => {
          if (i > 0) expect(segment.left).toBeCloseTo(segments[i - 1].right - 1, 1);
          expect(segment.top).toBeCloseTo(segments[0].top, 1);
          expect(segment.height).toBeCloseTo(segments[0].height, 1);
        });
        expect(segments[0].left).toBeCloseTo(tile.bars[row].left, 1);
        expect(segments[3].right).toBeCloseTo(tile.bars[row].right, 1);

        // And the same bar in every row of every tile.
        const first = tiles[0].segments[0];
        segments.forEach((segment, i) => {
          expect(segment.width).toBeCloseTo(first[i].width, 1);
          expect(segment.left - tile.frame.left).toBeCloseTo(
            first[i].left - tiles[0].frame.left,
            1,
          );
        });
      });
    }

    for (const [number, name] of [
      [1, 'three-digit-sale'],
      [3, 'warned'],
      [4, 'unowned'],
      [7, 'held-twelve'],
    ] as const) {
      await exchangeTile(page, 'FC', number).screenshot({
        path: `test-results/collection-tile-${name}-${label(size)}.png`,
      });
    }
    await page.screenshot({ path: `test-results/collection-pending-${label(size)}.png` });
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

// ─── The exchange rates ─────────────────────────────────────────────────────

/** Where everything the dropdown might disturb stands. */
async function layout(page: Page) {
  const boxes = (locator: Locator) =>
    locator.evaluateAll((els) =>
      els.map((el) => {
        const { x, y, width, height } = el.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
  return {
    cart: await boxes(cartControl(page)),
    title: await boxes(page.locator('app-collection .screen-header-title')),
    purse: await boxes(purseButton(page)),
    tiles: await boxes(exchangeTiles(page)),
  };
}

for (const size of [LARGE, SMALL]) {
  test(`at ${label(size)} the exchange rates fit, move nothing, and are not covered`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await openCollectionAs(page, {
      rosaries: 12345,
      collection: heldStarters(),
      decks: [],
    });
    await collectionSettled(page);
    const before = await layout(page);
    await expect(purseButton(page)).toHaveAttribute('aria-expanded', 'false');

    // The chevron is drawn inside the button, to the left of the balance.
    const chevron = (await page.locator('app-collection .purse-chevron').boundingBox())!;
    const balance = (await rosaryPurse(page).boundingBox())!;
    expect(chevron.x + chevron.width).toBeLessThanOrEqual(balance.x);

    await purseButton(page).click();
    const panel = exchangeRates(page);
    await expect(panel).toBeVisible();
    await expect.poll(() => panel.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect
      .poll(() =>
        panel.evaluate((el) => el.getAnimations().every((run) => run.playState === 'finished')),
      )
      .toBe(true);
    await page.mouse.move(0, 0);
    expect(await layout(page)).toEqual(before);
    await expectNoScroll(page);

    const box = (await panel.boundingBox())!;
    const purse = (await purseButton(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(purse.y + purse.height);
    expect(box.x + box.width).toBeLessThanOrEqual(size.width);
    expect(box.y + box.height).toBeLessThanOrEqual(size.height);

    // Nothing is drawn over it: its corners and its middle are all its own.
    const covered = await panel.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const points = [
        [r.left + 3, r.top + 3],
        [r.right - 3, r.top + 3],
        [r.left + 3, r.bottom - 3],
        [r.right - 3, r.bottom - 3],
        [r.left + r.width / 2, r.top + r.height / 2],
      ];
      return points.filter(([x, y]) => !el.contains(document.elementFromPoint(x, y))).length;
    });
    expect(covered).toBe(0);

    await expect(panel.getByRole('row')).toHaveCount(7);

    // Every amount, its mark included, stays inside its own cell.
    const escaping = await panel.locator('td').evaluateAll(
      (cells) =>
        cells.filter((cell) => {
          const bounds = cell.getBoundingClientRect();
          return [...cell.querySelectorAll('.rosary-value, .rosary-mark')].some((part) => {
            const { left, right } = part.getBoundingClientRect();
            return left < bounds.left - 0.5 || right > bounds.right + 0.5;
          });
        }).length,
    );
    expect(escaping).toBe(0);
    await page.screenshot({ path: `test-results/collection-rates-${label(size)}.png` });

    // Activating anything outside closes it.
    await page.locator('app-collection .screen-header-title').click();
    await expect(panel).toBeHidden();
  });
}

test('the rarity 6 line is left out until it is earned, and then stays', async ({ page }) => {
  await openCollectionAs(page, { rosaries: 9998, collection: heldStarters(), decks: [] });
  await purseButton(page).click();
  const rows = exchangeRates(page).locator('tbody tr');
  await expect(rows).toHaveCount(5);
  await expect(rows.first()).toHaveText(/1 star\s*1\s*4/);
  await expect(rows.last()).toHaveText(/5 stars\s*330\s*660/);
  await expect(exchangeRates(page)).not.toContainText(/6 stars|9999|5000/);
  const heights = await rows.evaluateAll((els) => els.map((el) => el.clientHeight));
  expect(new Set(heights.map(Math.round)).size).toBe(1);
  await page.screenshot({ path: 'test-results/collection-rates-five.png' });
  await purseButton(page).click();

  // One sale short of it no longer: no reload between.
  await sell(exchangeTile(page, 'FC', 1)).raise.click();
  await confirm(await openCart(page)).click();
  await expect(rosaryPurse(page)).toHaveText('9999');
  await purseButton(page).click();
  await expect(rows).toHaveCount(6);
  await expect(rows.last()).toHaveText(/6 stars\s*5000\s*9999/);

  // Spent, and reloaded: still known.
  await buy(exchangeTile(page, 'FC', 2)).raise.click();
  await confirm(await openCart(page)).click();
  await expect(rosaryPurse(page)).toHaveText('9972');
  await page.reload();
  await expect(rosaryPurse(page)).toHaveText('9972');
  await purseButton(page).click();
  await expect(rows).toHaveCount(6);
});

test('the exchange rates open and close by keyboard', async ({ page }) => {
  await openCollectionAs(page, { rosaries: 450, collection: heldStarters(), decks: [] });
  await tabTo(page, purseButton(page));
  await expect(purseButton(page)).toHaveAccessibleName('Your Rosaries, 450');
  await page.keyboard.press('Enter');
  await expect(exchangeRates(page)).toBeVisible();
  await expect(purseButton(page)).toHaveAttribute('aria-expanded', 'true');
  await expectFocusVisible(purseButton(page));
  await page.keyboard.press('Escape');
  await expect(exchangeRates(page)).toBeHidden();
  await expectFocusVisible(purseButton(page));

  // And by focus moving on.
  await page.keyboard.press('Enter');
  await expect(exchangeRates(page)).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(exchangeRates(page)).toBeHidden();
});

// ─── Reading ────────────────────────────────────────────────────────────────

for (const [name, number, offset] of [
  ['an owned card', 1, 0],
  ['a card that is not owned', 15, 400],
] as const) {
  test(`${name} is read from its tile, and the page is as it was`, async ({ page }) => {
    await page.setViewportSize(SMALL);
    await openCollectionAs(page, { rosaries: 5, collection: heldStarters(), decks: [] });
    await collectionSettled(page);
    const region = page.getByTestId('sections');
    await region.evaluate((el, top) => el.scrollTo(0, top), offset);
    const tile = exchangeTile(page, 'FC', number);
    await cardButton(tile).scrollIntoViewIfNeeded();
    const scrolled = await region.evaluate((el) => el.scrollTop);

    await cardButton(tile).focus();
    await page.keyboard.press('Enter');
    const reader = cardReader(page);
    await expect(reader).toBeVisible();
    await expect(reader.locator('.cf-ability-text')).toBeVisible();
    await expect(reader.locator('.cf-number')).toHaveText(`#${number}`);
    expect(
      await reader.locator('app-card').evaluate((el) => el.getBoundingClientRect().width),
    ).toBeGreaterThanOrEqual(CARD_ABILITY_GATE);
    await expect(reader.getByRole('button')).toHaveText(['Close']);
    await expect(reader.locator('.veil')).toHaveCount(0);
    await expect
      .poll(() => reader.locator('.reader-panel').evaluate((el) => getComputedStyle(el).opacity))
      .toBe('1');
    await page.screenshot({ path: `test-results/collection-reading-${number}.png` });

    await page.keyboard.press('Escape');
    await expect(reader).toHaveCount(0);
    await expectFocusVisible(cardButton(tile));
    expect(await region.evaluate((el) => el.scrollTop)).toBe(scrolled);
    await expect(cartControl(page)).toHaveAccessibleName('Cart, no cards pending');
  });
}

// ─── Typed quantities ───────────────────────────────────────────────────────

test('a quantity is typed on the page and in the dialog', async ({ page }) => {
  await page.setViewportSize(LARGE);
  await openCollectionAs(page, { rosaries: 50, collection: heldStarters({ 1: 3 }), decks: [] });
  const crawlid = exchangeTile(page, 'FC', 1);
  const field = buy(crawlid).value;

  // A press selects what is there, so typing replaces it.
  await field.click();
  await page.keyboard.type('1x2');
  await expect(field).toHaveValue('12');
  await expect(cartControl(page)).toHaveAccessibleName('Cart, no cards pending');
  await page.keyboard.press('Enter');
  await expect(cartControl(page)).toHaveAccessibleName('Cart, 12 cards pending');
  await expect(field).toBeFocused();

  // Leaving it commits, too, and the plus control carries on from what was typed.
  await field.click();
  await page.keyboard.type('5');
  await buy(crawlid).raise.click();
  await expect(field).toHaveValue('6');

  // The other row excludes it, bounded by what is held — every time.
  await sell(crawlid).value.click();
  await page.keyboard.type('50');
  await page.keyboard.press('Enter');
  await expect(sell(crawlid).value).toHaveValue('3');
  await expect(field).toHaveValue('0');
  await page.keyboard.type('50');
  await page.keyboard.press('Tab');
  await expect(sell(crawlid).value).toHaveValue('3');

  // Escape abandons an edit.
  await sell(crawlid).value.click();
  await page.keyboard.type('1');
  await page.keyboard.press('Escape');
  await expect(sell(crawlid).value).toHaveValue('3');

  await field.click();
  await page.keyboard.type('1');
  await page.keyboard.press('Enter');
  const dialog = await openCart(page);
  const line = dialog.locator('[data-line="FC-1"]');
  const quantity = line.locator('.value');
  await expect(quantity).toHaveAccessibleName('Copies of Crawlid to buy');

  // Escape in a field being edited leaves the dialog up; the next closes it.
  await quantity.click();
  await page.keyboard.type('7');
  await page.keyboard.press('Escape');
  await expect(quantity).toHaveValue('1');
  await expect(dialog).toBeVisible();

  await page.keyboard.type('12');
  await page.keyboard.press('Enter');
  await expect(confirm(dialog)).toHaveAccessibleName('Confirm, spend 48 Rosaries');
  await expect(field).toHaveValue('12');
  await expect(quantity).toBeFocused();

  // Typed past what is affordable and confirmed at once: the typed quantity counts.
  await page.keyboard.type('99');
  const target = (await confirm(dialog).boundingBox())!;
  await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2);
  await expect(dialog.locator('[data-total="short"]')).toContainText('346');
  await expect(dialog).toBeVisible();
  await expect(rosaryPurse(page)).toHaveText('50');

  await quantity.click();
  await page.keyboard.type('0');
  await page.keyboard.press('Enter');
  await expect(quantity).toHaveValue('1');
  await confirm(dialog).click();
  await expect(rosaryPurse(page)).toHaveText('46');
  await expect(badge(crawlid)).toHaveAccessibleName('4 held');
});

test('a row cannot be typed in where nothing could be pending, but is read', async ({ page }) => {
  await openCollectionAs(page, { collection: heldStarters(), decks: [] });
  const unowned = sell(exchangeTile(page, 'FC', 2)).value;
  await unowned.focus();
  await page.keyboard.type('4');
  await expect(unowned).toHaveValue('0');
  await expect(unowned).toHaveAccessibleDescription('You hold none to sell');
});

// ─── The cart ───────────────────────────────────────────────────────────────

test('a keyboard alone buys and sells through the cart, and it survives a reload', async ({
  page,
}) => {
  await page.setViewportSize(LARGE);
  await openCollectionAs(page, { rosaries: 400, collection: heldStarters(), decks: [] });

  const crawlid = exchangeTile(page, 'FC', 1);
  const gruzMother = exchangeTile(page, 'FC', 2); // three stars, unowned
  await expect(progress(page)).toHaveText('9 of 15 collected');

  // The cart control and the purse, then the first tile's card, Sell row, and
  // Buy row, in order.
  await tabTo(page, cartControl(page));
  await expectFocusVisible(cartControl(page));
  await page.keyboard.press('Tab');
  await expectFocusVisible(purseButton(page));
  await page.keyboard.press('Tab');
  await expectFocusVisible(cardButton(crawlid));
  for (const row of [sell(crawlid), buy(crawlid)]) {
    for (const control of [row.lower, row.value, row.raise, row.target]) {
      await page.keyboard.press('Tab');
      await expectFocusVisible(control);
    }
  }
  // An unavailable control took focus and gives its reason.
  await tabTo(page, sell(crawlid).target, 'Shift+Tab');
  await expect(sell(crawlid).target).toHaveAccessibleName('Sell down to 9 Crawlid');
  await expect(sell(crawlid).target).toHaveAccessibleDescription('You hold 9 or fewer');
  await expect(sell(crawlid).row).toHaveAccessibleDescription('1 Rosary each');

  // Sell the only Crawlid: the control reaches its bound and keeps its focus.
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(sell(crawlid).value).toHaveValue('1');
  await expect(sell(crawlid).raise).toHaveAttribute('aria-disabled', 'true');
  await expectFocusVisible(sell(crawlid).raise);
  await expect(page.getByTestId('exchange-announcement')).toHaveText('1 Crawlid pending for sale.');

  await tabTo(page, buy(gruzMother).raise);
  await page.keyboard.press('Enter');
  await expect(buy(gruzMother).value).toHaveValue('1');

  // Nothing has happened yet.
  await expect(cartControl(page)).toHaveAccessibleName('Cart, 2 cards pending');
  await expect(rosaryPurse(page)).toHaveText('400');
  await expect(badge(crawlid)).toHaveAccessibleName('1 held');
  await expect(badge(gruzMother)).toHaveAccessibleName('Not owned');
  await expect(progress(page)).toHaveText('9 of 15 collected');

  await tabTo(page, cartControl(page), 'Shift+Tab');
  await page.keyboard.press('Enter');
  const dialog = cartDialog(page);
  await expectFocusVisible(dialog.getByRole('button', { name: 'Close' }));

  // Escape gives the focus back; then round again, to confirm.
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expectFocusVisible(cartControl(page));
  await page.keyboard.press('Enter');
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Shift+Tab'); // past the first, to the last
  await expectFocusVisible(confirm(dialog));
  await expect(confirm(dialog)).toHaveAccessibleName('Confirm, spend 26 Rosaries');
  await page.keyboard.press('Enter');

  await expect(dialog).toHaveCount(0);
  await expect(cartControl(page)).toBeFocused();
  await expect(cartControl(page)).toHaveAccessibleName('Cart, no cards pending');
  await expect(page.getByTestId('exchange-announcement')).toHaveText(
    '1 sold, 1 bought, 26 Rosaries spent.',
  );
  await expect(rosaryPurse(page)).toHaveText('374');
  await expect(badge(crawlid)).toHaveAccessibleName('Not owned');
  await expect(badge(gruzMother)).toHaveAccessibleName('1 held');

  await page.reload();
  await expect(rosaryPurse(page)).toHaveText('374');
  await expect(badge(crawlid)).toHaveAccessibleName('Not owned');
  await expect(badge(gruzMother)).toHaveAccessibleName('1 held');
  expect(await rosaryPurseValue(page)).toBe(374);
});

test('pending lines outlive the page but not a reload', async ({ page }) => {
  await openCollectionAs(page, {
    rosaries: 90,
    collection: heldStarters(),
    decks: [STARTERS.map(({ set, number }) => ({ set, number }))],
  });
  await buy(exchangeTile(page, 'FC', 2)).target.click();
  await sell(exchangeTile(page, 'FC', 1)).raise.click();
  await expect(cartControl(page)).toHaveAccessibleName('Cart, 10 cards pending');

  // Through the nav, so the application is never reloaded.
  for (const name of ['Shop', 'Decks']) {
    await goTo(page, name);
    await expect(page).toHaveURL(new RegExp(`/${name.toLowerCase()}$`));
  }
  // Pending sales leave the decks alone.
  await expect(deckCards(page)).toHaveCount(9);

  // Into a battle and out of it again, too.
  await goTo(page, 'Battle');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page).toHaveURL(/\/battle\/deck$/);
  await page.getByRole('button', { name: 'Begin Battle' }).click();
  await expect(page).toHaveURL(/\/game$/);
  await page.getByRole('button', { name: 'Retreat' }).click();
  await expect(page).toHaveURL(/\/battle$/);

  await goTo(page, 'Collection');
  await expect(buy(exchangeTile(page, 'FC', 2)).value).toHaveValue('9');
  await expect(sell(exchangeTile(page, 'FC', 1)).value).toHaveValue('1');
  const dialog = await openCart(page);
  await expect(dialog.locator('.line-name')).toHaveText(['Gruz Mother', 'Crawlid']);
  await dialog.getByRole('button', { name: 'Close' }).click();

  await page.reload();
  await expect(cartControl(page)).toHaveAccessibleName('Cart, no cards pending');
  await expect(rosaryPurse(page)).toHaveText('90');
  await expect(badge(exchangeTile(page, 'FC', 1))).toHaveAccessibleName('1 held');
});

test('sales pay for a purchase, and a shortfall blocks one', async ({ page }) => {
  await page.setViewportSize(LARGE);
  await openCollectionAs(page, {
    rosaries: 3,
    collection: heldStarters({ 1: 6 }),
    decks: [],
  });
  const crawlid = exchangeTile(page, 'FC', 1);

  for (let i = 0; i < 2; i++) await buy(exchangeTile(page, 'FC', 7)).raise.click();
  let dialog = await openCart(page);
  await expect(dialog.locator('[data-total="short"]')).toContainText('5');
  await expect(confirm(dialog)).toHaveAttribute('aria-disabled', 'true');
  await expect(confirm(dialog)).toHaveAttribute('title', 'Not enough Rosaries');
  await expect(confirm(dialog)).toHaveAccessibleDescription('Not enough Rosaries');
  await page.screenshot({ path: 'test-results/collection-cart-shortfall.png' });

  // Playwright will not click a control marked unavailable, so it is
  // activated the way a keyboard user would.
  await confirm(dialog).focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await expect(rosaryPurse(page)).toHaveText('3');

  // The area outside dismisses it, changing nothing.
  await page.mouse.click(8, 500);
  await expect(dialog).toHaveCount(0);
  await expect(cartControl(page)).toBeFocused();
  await expect(cartControl(page)).toHaveAccessibleName('Cart, 2 cards pending');

  // Selling six covers it; the dialog says so and the tile follows its steps.
  for (let i = 0; i < 5; i++) await sell(crawlid).raise.click();
  dialog = await openCart(page);
  await expect(dialog.locator('[data-total="after"]')).toContainText('0');
  const line = dialog.locator('[data-line="FC-1"]');
  await line.getByRole('button', { name: 'Sell one more Crawlid' }).click();
  await expect(sell(crawlid).value).toHaveValue('6');
  await expect(line.locator('.raise')).toHaveAttribute('aria-disabled', 'true');
  await expect(confirm(dialog)).toHaveAccessibleName('Confirm, spend 2 Rosaries');
  await confirm(dialog).click();
  await expect(dialog).toHaveCount(0);
  await expect(rosaryPurse(page)).toHaveText('1');
  await expect(badge(crawlid)).toHaveAccessibleName('Not owned');
  await expect(badge(exchangeTile(page, 'FC', 7))).toHaveAccessibleName('3 held');
});

test('a confirmed sale of the last copy a deck uses takes it out of that deck', async ({
  page,
}) => {
  await page.setViewportSize(LARGE);
  await openCollectionAs(page, {
    collection: heldStarters(),
    decks: [[{ set: 'FC', number: 1 }], [{ set: 'FC', number: 7 }], [{ set: 'FC', number: 1 }]],
  });

  const crawlid = sell(exchangeTile(page, 'FC', 1));
  await expect(crawlid.warning).toHaveCount(0);
  await crawlid.raise.click();
  await expect(crawlid.warning).toBeVisible();
  await expect(crawlid.warning).toHaveAttribute(
    'title',
    'Selling removes it from Deck 1 and Deck 3',
  );
  await expect(crawlid.row).toHaveAccessibleDescription(
    '1 Rosary each Selling removes it from Deck 1 and Deck 3',
  );
  const gruzzer = sell(exchangeTile(page, 'FC', 8));
  await gruzzer.raise.click();
  await expect(gruzzer.warning).toHaveCount(0);

  const dialog = await openCart(page);
  await expect(dialog.locator('.line-warning')).toHaveCount(1);
  await expect(dialog.locator('[data-line="FC-1"] .line-warning')).toHaveText(
    'Removes it from Deck 1 and Deck 3',
  );
  await confirm(dialog).click();
  await expect(page.getByTestId('exchange-announcement')).toHaveText(
    '2 sold, 0 bought, 2 Rosaries gained. Cards removed from Deck 1 and Deck 3.',
  );

  // Through the nav, so the change is read live rather than off a reload.
  await goTo(page, 'Decks');
  await expect(page).toHaveURL(/\/decks$/);
  await expect(deckCards(page)).toHaveCount(0);
  await deckButton(page, 'Deck 2').click();
  await expect(deckCards(page)).toHaveCount(1);
  await deckButton(page, 'Deck 3').click();
  await expect(deckCards(page)).toHaveCount(0);
});

for (const size of [LARGE, SMALL]) {
  test(`at ${label(size)} the dialog fits with a line for every card`, async ({ page }) => {
    await page.setViewportSize(size);
    // Every card bought but the first, whose sale would trim every deck there
    // can be: the tallest list the catalogue can make.
    await openCollectionAs(page, {
      rosaries: 10,
      collection: [{ set: 'FC', number: 1, quantity: 130 }],
      decks: Array.from({ length: 9 }, () => [{ set: 'FC', number: 1 }]),
    });
    await collectionSettled(page);
    const count = await exchangeTiles(page).count();
    for (let i = 0; i < count; i++)
      await buy(exchangeTiles(page).nth(i)).target.click({ force: true });
    const first = sell(exchangeTile(page, 'FC', 1));
    await first.target.click();
    for (let i = 0; i < 9; i++) await first.raise.click();
    await expect(first.value).toHaveValue('130');
    const sections = page.getByTestId('sections');
    await sections.evaluate((el) => el.scrollTo(0, 0));

    const dialog = await openCart(page);
    await expect(dialog.locator('.line')).toHaveCount(count);
    await expectNoScroll(page);
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(size.width);
    expect(box.y + box.height).toBeLessThanOrEqual(size.height);

    // No line runs out of the dialog, and nothing in one overlaps.
    const faults = await dialog.locator('.line').evaluateAll((els) =>
      els.flatMap((el) => {
        const parts = [...el.children]
          .filter((part) => !part.matches('.line-warning'))
          .map((part) => part.getBoundingClientRect());
        const collides = parts.some((part, i) => i > 0 && part.left < parts[i - 1].right - 0.5);
        const signed = el.querySelector('.signed')!.getBoundingClientRect();
        const runsOver =
          signed.left < el.querySelector('.line-effect')!.getBoundingClientRect().left - 0.5;
        return collides || runsOver || el.scrollWidth > el.clientWidth ? [el.textContent] : [];
      }),
    );
    expect(faults).toEqual([]);

    // The rows scroll; the foot and the close control stay.
    const rows = dialog.getByTestId('cart-rows');
    const parts = [
      dialog.locator('.totals'),
      confirm(dialog),
      dialog.getByRole('button', { name: 'Close' }),
    ];
    const before = await Promise.all(parts.map((part) => part.boundingBox()));
    for (const part of parts) await expect(part).toBeInViewport({ ratio: 1 });
    expect(await rows.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await rows.hover({ position: { x: 20, y: 40 } });
    await page.mouse.wheel(0, 5000);
    await expect
      .poll(() => rows.evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 1))
      .toBe(true);
    await expect(dialog.locator('.line').last()).toBeInViewport();
    expect(await Promise.all(parts.map((part) => part.boundingBox()))).toEqual(before);

    // The page behind does not scroll: not past the rows' end, nor from outside.
    await page.mouse.wheel(0, 5000);
    await page.mouse.move(8, size.height / 2);
    await page.mouse.wheel(0, 5000);
    await expectNoScroll(page);
    expect(await sections.evaluate((el) => el.scrollTop)).toBe(0);

    await rows.evaluate((el) => el.scrollTo(0, 0));
    await page.screenshot({ path: `test-results/collection-cart-${label(size)}.png` });
  });
}

test('focus is held inside the dialog, wherever in it the player presses', async ({ page }) => {
  await openCollectionAs(page, { rosaries: 500, collection: heldStarters(), decks: [] });
  await buy(exchangeTile(page, 'FC', 1)).raise.click();
  const dialog = await openCart(page);
  const close = dialog.getByRole('button', { name: 'Close' });

  await confirm(dialog).focus();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();

  // A press on the dialog's own ground leaves it dismissible by keyboard.
  await dialog.locator('.cart-title').click();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await dialog.locator('.cart-title').click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(cartControl(page)).toBeFocused();
});

test("the Decks page's reset zeroes the purse and empties the cart", async ({ page }) => {
  await openCollectionAs(page, { rosaries: 340, collection: heldStarters(), decks: [[]] });
  await expect(rosaryPurse(page)).toHaveText('340');
  await buy(exchangeTile(page, 'FC', 2)).raise.click();
  await sell(exchangeTile(page, 'FC', 1)).raise.click();
  await expect(cartControl(page)).toHaveAccessibleName('Cart, 2 cards pending');

  // Through the nav: a load of its own would empty the cart whatever reset did.
  await goTo(page, 'Decks');
  await page.getByRole('button', { name: 'Reset data' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(/Rosaries/);
  await dialog.getByRole('button', { name: 'Reset data' }).click();

  await goTo(page, 'Collection');
  await expect(rosaryPurse(page)).toHaveText('0');
  await expect(cartControl(page)).toHaveAccessibleName('Cart, no cards pending');
});
