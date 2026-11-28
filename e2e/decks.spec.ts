import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  CARD_ABILITY_GATE,
  CARD_MIN_WIDTH,
  DECK_SIZE,
  MAX_DECKS,
  abilitySectionWidth,
  addButton,
  badgeCount,
  cardButton,
  cardWidth,
  decksSettled,
  collectionTiles,
  deckCards,
  deckSlots,
  deckTabs,
  collectionAlignment,
  expectCollectionLeftAligned,
  expectNoScroll,
  expectPartsOnScreen,
  deckButton,
  deckControls,
  deckStanding,
  openDecksAs,
  label,
  laidOutCardWidth,
  openDecks,
  purse,
  readCard,
  removeButton,
  tileNamed,
  type Size,
} from './helpers';

/**
 * The Decks page: the collection, the decks built from it, and the fit that
 * holds the whole thing inside a viewport it is not allowed to scroll.
 *
 * What is checked here is what only a browser can settle — laid-out widths,
 * what is drawn over what, what scrolls, and what focus does. The deck rules
 * themselves, the five orders, and the persisted shape are Vitest's.
 */

/** The viewport ladder the page is fitted against. */
const LADDER: Size[] = [
  { width: 1920, height: 1080 },
  { width: 1600, height: 900 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1100, height: 620 },
];

const DEFAULT: Size = { width: 1440, height: 900 };

/** One of the five ordering controls, by the name it states. */
function sortControl(page: Page, order: string) {
  // Scoped to the control: a card's own accessible label states its attack and
  // its defense, so an unscoped search by those names finds cards too. The
  // active order's name goes on to state its direction, so the match is on
  // the leading word.
  return page.locator('.sort-options').getByRole('button', { name: new RegExp(`^${order}\\b`) });
}

/**
 * Chooses an order and waits for the page to be showing it. Choosing the order
 * already in effect reverses it, so a caller that wants the default direction
 * chooses a different order first.
 */
async function chooseOrder(page: Page, order: string): Promise<void> {
  await sortControl(page, order).click();
  await expect(sortControl(page, order)).toHaveAttribute('aria-pressed', 'true');
}

/** The direction the active order states to assistive technology. */
async function activeDirection(page: Page): Promise<string> {
  const name = await page.locator('.sort-option.is-active').evaluate((el) => el.textContent ?? '');
  return /ascending/.test(name) ? 'asc' : /descending/.test(name) ? 'desc' : '';
}

/** Whether the active order's chevron is turned up. */
async function chevronTurned(page: Page): Promise<boolean> {
  return page
    .locator('.sort-option.is-active .sort-chevron')
    .evaluate((el) => getComputedStyle(el).rotate === '180deg');
}

/** The collection's cards, in the order the grid reads them. */
async function tileNames(page: Page): Promise<string[]> {
  return collectionTiles(page).evaluateAll((els) =>
    els.map((el) => el.querySelector('app-card .cf-name-text')!.textContent!.trim()),
  );
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

/** An add that is in place but unavailable: it says why, and does nothing. */
async function expectWithheld(add: Locator, reason: string): Promise<void> {
  await expect(add).toBeVisible();
  await expect(add).toHaveAttribute('aria-disabled', 'true');
  await expect(add).toHaveAttribute('title', reason);
  await expect(add).toHaveAccessibleDescription(reason);
  const held = await deckCards(add.page()).count();
  // Playwright will not click a control marked unavailable without being told to.
  await add.click({ force: true });
  await add.focus();
  await add.page().keyboard.press('Enter');
  await expect(deckCards(add.page())).toHaveCount(held);
}

/** Where the elements a locator finds stand, as laid out on screen. */
function boxesOf(locator: Locator) {
  return locator.evaluateAll((els) =>
    els.map((el) => {
      const { left, right, top, bottom, width, height } = el.getBoundingClientRect();
      return { left, right, top, bottom, width, height };
    }),
  );
}

/** The page's pinned controls, which no viewport may put out of reach. */
function pinnedParts(page: Page) {
  return {
    tabs: deckTabs(page),
    create: page.getByRole('button', { name: 'New deck', exact: true }),
    remove: page.getByRole('button', { name: /^Delete Deck/ }),
    standing: page.locator('app-deck-bar .deck-standing'),
    sort: page.locator('.sort-option'),
    chevron: page.locator('.sort-option .sort-chevron'),
    reset: page.getByRole('button', { name: 'Reset data' }),
    deckRow: page.locator('app-deck-bar .deck-row'),
    removes: page.locator('app-deck-bar .remove'),
  };
}

test.describe('the Decks page', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DEFAULT);
    await openDecks(page);
  });

  test('shows the seeded deck and the whole collection', async ({ page }) => {
    await expect(deckTabs(page)).toHaveCount(1);
    await expect(deckTabs(page).first()).toHaveText(/Deck 1/);
    await expect(deckSlots(page)).toHaveCount(DECK_SIZE);
    await expect(deckCards(page)).toHaveCount(0);

    // The nine starter cards, one tile each, and nothing marked as forthcoming.
    await expect(collectionTiles(page)).toHaveCount(9);
    await expect(page.locator('app-decks .coming-soon')).toHaveCount(0);
  });

  test('warns that the empty deck needs nine cards from the collection', async ({ page }) => {
    const standing = await deckStanding(page);
    expect(standing.map((l) => l.kind)).toEqual(['incomplete']);
    expect(standing[0].text).toMatch(/9 more cards/);
    expect(standing[0].text).toMatch(/collection below/i);
  });

  test('presents no save control and no unsaved state', async ({ page }) => {
    for (const name of [/save/i, /apply/i, /commit/i, /unsaved/i]) {
      await expect(page.getByRole('button', { name })).toHaveCount(0);
    }
  });

  test('opens ordered by rarity, rarest first, and reorders without touching the deck', async ({
    page,
  }) => {
    const active = page.locator('.sort-option.is-active');
    await expect(active).toHaveText(/^\s*Rarity\b/);

    const starsOf = () =>
      collectionTiles(page).evaluateAll((els) =>
        els.map((el) => el.querySelectorAll('app-card .star.lit').length),
      );
    const stars = await starsOf();
    expect(stars).toEqual([...stars].sort((a, b) => b - a));

    // Every order is offered by name, and choosing one reorders the grid.
    // The labels are drawn uppercase by the stylesheet, so the comparison is
    // of the words rather than of their casing.
    // The active option goes on to state its direction to assistive
    // technology, so only the leading word is the order's name.
    const names = await page.locator('.sort-option').allInnerTexts();
    expect(names.map((n) => n.split(',')[0].trim().toLowerCase())).toEqual([
      'rarity',
      'quantity',
      'name',
      'attack',
      'defense',
    ]);

    await chooseOrder(page, 'Name');
    const byName = await collectionTiles(page).evaluateAll((els) =>
      els.map((el) => el.querySelector('app-card .cf-name-text')!.textContent!.trim()),
    );
    expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b, 'en')));

    // Every one of the five takes effect and is marked as the one in effect.
    // Each iteration starts from a different order than the one it chooses,
    // so every choice applies that order's default direction.
    for (const order of ['Rarity', 'Quantity', 'Name', 'Attack', 'Defense']) {
      const other = order === 'Name' ? 'Rarity' : 'Name';
      await chooseOrder(page, order);
      await expect(page.locator('.sort-option.is-active')).toHaveCount(1);
      // The sequence the grid reads in is the one that order asks for, and it
      // is the same sequence every time that order is chosen.
      const once = await tileNames(page);
      await chooseOrder(page, other);
      await chooseOrder(page, order);
      expect(await tileNames(page)).toEqual(once);
    }

    // And the deck on screen is untouched by a reorder.
    await expect(deckTabs(page).first()).toHaveAttribute('aria-pressed', 'true');
    await expect(deckCards(page)).toHaveCount(0);
  });
});

// ─── 13.3 The width bands ───────────────────────────────────────────────────

test.describe('the width bands', () => {
  for (const size of LADDER.filter((s) => s.width === 1920 || s.width === 1100)) {
    test(`at ${label(size)} every tile is under the ability gate`, async ({ page }) => {
      await page.setViewportSize(size);
      await openDecks(page);

      const tiles = collectionTiles(page);
      const count = await tiles.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const width = await cardWidth(tiles.nth(i));
        expect(width, `tile ${i} at ${label(size)}`).toBeGreaterThanOrEqual(CARD_MIN_WIDTH);
        expect(width, `tile ${i} at ${label(size)}`).toBeLessThan(CARD_ABILITY_GATE);
        // Below the gate the section is held in the DOM at a hairline rather
        // than removed, so this measures the box rather than its existence.
        expect(await abilitySectionWidth(tiles.nth(i))).toBeLessThanOrEqual(1);
      }
    });
  }

  test('the read card is above the gate, with its ability text, set, and number', async ({
    page,
  }) => {
    await page.setViewportSize(DEFAULT);
    await openDecks(page);

    await readCard(collectionTiles(page).first());

    const reader = page.locator('app-card-reader');
    await expect(reader).toBeVisible();
    expect(await cardWidth(reader)).toBeGreaterThanOrEqual(CARD_ABILITY_GATE);

    await expect(reader.locator('.cf-ability-text')).toBeVisible();
    await expect(reader.locator('.cf-ability-text')).not.toBeEmpty();
    await expect(reader.locator('.cf-set')).toHaveText(/\S/);
    await expect(reader.locator('.cf-number')).toHaveText(/^#[1-9]\d*$/);
  });
});

// ─── 13.4 The count badge ───────────────────────────────────────────────────

/** The starter collection, one copy each. `FALSE_KNIGHT` is FC 17, four stars. */
const STARTERS = [1, 3, 5, 2, 9, 11, 12, 13, 14].map((number) => ({
  set: 'FC',
  number,
  quantity: 1,
}));
const FALSE_KNIGHT = { set: 'FC', number: 17 };
const CRAWLID = { set: 'FC', number: 1 };

/** The starters, with Crawlid raised to `quantity`. */
function startersWithCrawlid(quantity: number) {
  return STARTERS.map((entry) => (entry.number === 1 ? { ...entry, quantity } : entry));
}

for (const widest of [false, true]) {
  const title = widest ? ' at 9 / 9' : '';
  test(`a badge states the count and obscures nothing the card draws${title}`, async ({ page }) => {
    await page.setViewportSize(DEFAULT);
    if (widest) {
      // The widest figure a seeded collection reaches: nine held, nine used.
      await openDecksAs(page, {
        collection: startersWithCrawlid(9),
        decks: [Array(DECK_SIZE).fill(CRAWLID)],
      });
    } else {
      await openDecks(page);
      await page.evaluate(() => localStorage.clear());
      await openDecks(page);
    }

    const first = widest ? tileNamed(page, 'Crawlid') : collectionTiles(page).first();
    expect(await badgeCount(first)).toBe(widest ? 9 : 1);
    if (widest) await expect(first.locator('.badge')).toHaveClass(/is-exhausted/);

    // The badge is drawn over the card, and everything the renderer draws is
    // still on screen underneath it.
    const visible = await first.evaluate((tile) => {
      const badge = tile.querySelector('.badge')!.getBoundingClientRect();
      const hidden = (el: Element) => {
        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) return true;
        // Wholly behind the badge.
        return (
          box.left >= badge.left &&
          box.right <= badge.right &&
          box.top >= badge.top &&
          box.bottom <= badge.bottom
        );
      };
      const parts = {
        name: [...tile.querySelectorAll('app-card .cf-name-text')],
        stars: [...tile.querySelectorAll('app-card .star')],
        bars: [...tile.querySelectorAll('app-card .stat-bar')],
        chevrons: [...tile.querySelectorAll('app-card .arr')],
      };
      return Object.fromEntries(
        Object.entries(parts).map(([key, els]) => [
          key,
          { count: els.length, obscured: els.filter(hidden).length },
        ]),
      );
    });

    expect(visible['name']).toEqual({ count: 1, obscured: 0 });
    expect(visible['stars']).toEqual({ count: 5, obscured: 0 });
    expect(visible['bars']).toEqual({ count: 2, obscured: 0 });
    expect(visible['chevrons']).toEqual({ count: 8, obscured: 0 });

    if (widest) await first.screenshot({ path: 'test-results/decks-badge-9-of-9.png' });
  });
}

test('the badge states used of held, per deck', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecksAs(page, { collection: startersWithCrawlid(3), decks: [[], []] });

  const crawlid = tileNamed(page, 'Crawlid');
  const badge = crawlid.locator('.badge');
  await expect(badge).toHaveAttribute('aria-label', '0 of 3 in Deck 1');

  for (let i = 0; i < 2; i++) {
    await addButton(crawlid).click();
  }
  await expect(badge).toHaveAttribute('aria-label', '2 of 3 in Deck 1');
  await expect(badge).not.toHaveClass(/is-exhausted/);
  // Used first and subordinate, held second and heavier.
  await expect(badge.locator('.used')).toHaveText('2');
  await expect(badge.locator('.held')).toHaveText('3');
  const weights = await badge.evaluate((el) => ({
    used: Number(getComputedStyle(el.querySelector('.used')!).fontWeight),
    held: Number(getComputedStyle(el.querySelector('.held')!).fontWeight),
  }));
  expect(weights.held).toBeGreaterThan(weights.used);

  await addButton(crawlid).click();
  await expect(badge).toHaveAttribute('aria-label', '3 of 3 in Deck 1');
  await expect(badge).toHaveClass(/is-exhausted/);
  await expect(badge).toHaveText('3/3');

  await expectWithheld(addButton(crawlid), 'Every copy you hold is already in Deck 1.');

  await deckButton(page, 'Deck 2').click();
  await expect(badge).toHaveAttribute('aria-label', '0 of 3 in Deck 2');
  await expect(badge).not.toHaveClass(/is-exhausted/);
  await expect(addButton(crawlid)).toHaveText('Add to Deck 2');
  await expect(addButton(crawlid)).not.toHaveAttribute('aria-disabled', 'true');

  // With no deck at all, the badge states the held count alone.
  for (const name of ['Delete Deck 2', 'Delete Deck 1']) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  }
  await expect(deckTabs(page)).toHaveCount(0);
  await expect(badge).toHaveAttribute('aria-label', '3 held');
  await expect(badge).toHaveText(/×3/);
});

test('the badge separator is as heavy and as high in contrast as the used figure', async ({
  page,
}) => {
  await page.setViewportSize(DEFAULT);
  // Crawlid: one of three used, the normal badge. FC 3: its one copy used, exhausted.
  await openDecksAs(page, {
    collection: startersWithCrawlid(3),
    decks: [[CRAWLID, { set: 'FC', number: 3 }]],
  });
  await decksSettled(page);

  const exhausted = collectionTiles(page).filter({ has: page.locator('.badge.is-exhausted') });
  await expect(exhausted).toHaveCount(1);
  const normal = tileNamed(page, 'Crawlid');
  await expect(normal.locator('.badge')).not.toHaveClass(/is-exhausted/);

  for (const tile of [normal, exhausted]) {
    const parts = await tile.locator('.badge').evaluate((badge) => {
      // Relative luminance, so contrast against the badge background can be
      // compared directly.
      const probe = document.createElement('canvas').getContext('2d')!;
      const luminance = (css: string) => {
        probe.fillStyle = '#000';
        probe.fillRect(0, 0, 1, 1);
        probe.fillStyle = css;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = [...probe.getImageData(0, 0, 1, 1).data].map((v) => {
          const c = v / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const bg = luminance(getComputedStyle(badge).backgroundColor);
      const read = (sel: string) => {
        const style = getComputedStyle(badge.querySelector(sel)!);
        return {
          weight: Number(style.fontWeight),
          color: style.color,
          contrast: contrast(luminance(style.color), bg),
        };
      };
      return { used: read('.used'), sep: read('.badge-sep') };
    });
    expect(parts.sep.weight).toBeGreaterThanOrEqual(parts.used.weight);
    expect(parts.sep.contrast).toBeGreaterThanOrEqual(parts.used.contrast);
    expect(parts.sep.color).toBe(parts.used.color);
    // Plainly visible: well past the 4.5:1 floor for text this small.
    expect(parts.sep.contrast).toBeGreaterThan(7);
  }

  await normal.screenshot({ path: 'test-results/decks-badge-separator.png' });
  await exhausted.screenshot({ path: 'test-results/decks-badge-separator-exhausted.png' });
});

test('an exhausted badge differs in lightness from one that is not', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecksAs(page, { collection: STARTERS, decks: [[CRAWLID]] });
  const ground = (tile: Locator) =>
    tile.locator('.badge').evaluate((el) => {
      const canvas = document.createElement('canvas').getContext('2d')!;
      const over = (color: string) => {
        canvas.fillStyle = color;
        canvas.fillRect(0, 0, 1, 1);
        const [r, g, b] = canvas.getImageData(0, 0, 1, 1).data;
        const channel = (v: number) =>
          v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4;
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      const style = getComputedStyle(el);
      return { fill: over(style.backgroundColor), text: over(style.color) };
    });
  const exhausted = await ground(tileNamed(page, 'Crawlid'));
  const open = await ground(tileNamed(page, 'Vengefly'));
  const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  // Light with dark figures against dark with light ones.
  expect(exhausted.fill).toBeGreaterThan(exhausted.text);
  expect(open.fill).toBeLessThan(open.text);
  expect(contrast(exhausted.fill, open.fill)).toBeGreaterThan(4.5);
  expect(contrast(exhausted.fill, exhausted.text)).toBeGreaterThan(4.5);
  await expect(tileNamed(page, 'Crawlid').locator('.badge')).toHaveText('1/1');
});

// ─── The add and remove buttons ─────────────────────────────────────────────

test('the add button overlaps nothing, and availability moves nothing', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecksAs(page, { collection: STARTERS, decks: [[]] });
  await decksSettled(page);

  for (const tile of await collectionTiles(page).all()) {
    const [add] = await boxesOf(addButton(tile));
    const [card] = await boxesOf(tile.locator('app-card'));
    const [badge] = await boxesOf(tile.locator('.badge'));
    expect(add.top).toBeGreaterThanOrEqual(card.bottom);
    expect(add.top).toBeGreaterThanOrEqual(badge.bottom);
    await expect(addButton(tile)).toHaveText('Add to Deck 1');
    expect(await addButton(tile).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  }

  const layout = async () => ({
    tiles: await boxesOf(collectionTiles(page)),
    adds: await boxesOf(page.locator('app-collection-grid .add')),
    slots: await boxesOf(deckSlots(page)),
    cards: await boxesOf(page.locator('app-deck-bar .slot-card')),
  });
  const before = await layout();
  const crawlid = tileNamed(page, 'Crawlid');
  await addButton(crawlid).click();
  await expect(deckCards(page)).toHaveCount(1);
  await expect(addButton(crawlid)).toHaveAttribute('aria-disabled', 'true');
  await page.mouse.move(0, 0);
  expect(await layout()).toEqual(before);

  // Not by colour alone: the outline is broken, and the whole is faded.
  const [off, on] = [addButton(crawlid), addButton(tileNamed(page, 'Vengefly'))];
  const look = (add: Locator) =>
    add.evaluate((el) => {
      const { borderTopStyle, opacity } = getComputedStyle(el);
      return { borderTopStyle, opacity: Number(opacity) };
    });
  await expect.poll(async () => (await look(off)).opacity).toBeLessThan(1);
  expect((await look(off)).borderTopStyle).not.toBe((await look(on)).borderTopStyle);
  await page.screenshot({ path: 'test-results/decks-add-buttons.png' });

  // And every position is one size, filled or free, its Remove clear of its card.
  const slots = await boxesOf(deckSlots(page));
  for (const slot of slots) {
    expect(slot.width).toBeCloseTo(slots[0].width, 1);
    expect(slot.height).toBeCloseTo(slots[0].height, 1);
  }
  const [remove] = await boxesOf(page.locator('app-deck-bar .remove'));
  const [card] = await boxesOf(deckCards(page));
  expect(remove.top).toBeGreaterThanOrEqual(card.bottom);
  expect(remove.bottom).toBeLessThanOrEqual(slots[0].bottom + 0.5);
  await expect(page.locator('app-deck-bar .remove')).toHaveCount(1);
});

test('reading a card moves nothing and raises nothing over it', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 620 });
  await openDecksAs(page, { collection: STARTERS, decks: [[CRAWLID]] });
  await decksSettled(page);
  const grid = page.locator('app-collection-grid');
  await grid.evaluate((el) => el.scrollTo(0, 60));
  const layout = async () => ({
    tiles: await boxesOf(collectionTiles(page)),
    slots: await boxesOf(deckSlots(page)),
    scrolled: await grid.evaluate((el) => el.scrollTop),
  });
  const before = await layout();
  for (const holder of [deckSlots(page).first(), collectionTiles(page).first()]) {
    // Opened where it stands: a pointer would have scrolled it into view first.
    await cardButton(holder).evaluate((el: HTMLElement) => {
      el.focus({ preventScroll: true });
      el.click();
    });
    await expect(page.locator('app-card-reader')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('app-card-reader')).toHaveCount(0);
    await expect(cardButton(holder)).toBeFocused();
    expect(await layout()).toEqual(before);
  }
});

// ─── 13.5 Building a deck ───────────────────────────────────────────────────

test('a deck is built, filled, trimmed, and survives a reload', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);

  // A second deck, created from the page and selected on arrival.
  await page.getByRole('button', { name: 'New deck', exact: true }).click();
  await expect(deckTabs(page)).toHaveCount(2);
  await expect(deckTabs(page).nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(deckCards(page)).toHaveCount(0);

  const tile = collectionTiles(page).first();
  const name = (await tile.locator('app-card .cf-name-text').innerText()).trim();

  // The nine starters, one copy each — every card the seeded player holds.
  for (let i = 0; i < DECK_SIZE; i++) {
    await addButton(collectionTiles(page).nth(i)).click();
    await expect(deckCards(page)).toHaveCount(i + 1);
  }
  await expect(page.locator('app-deck-bar .slot-empty')).toHaveCount(0);
  expect(await deckStanding(page)).toEqual([{ kind: 'ready', text: 'Ready for battle' }]);

  // The collection is unchanged by any of it.
  expect(await badgeCount(tile)).toBe(1);
  await expect(collectionTiles(page)).toHaveCount(9);

  // With the deck full, the add action is withheld and the page says why.
  await expectWithheld(addButton(tile), 'Deck 2 is full.');

  // Removing one frees exactly that position.
  await removeButton(deckSlots(page).nth(1)).click();
  await expect(deckCards(page)).toHaveCount(DECK_SIZE - 1);
  expect(await deckStanding(page)).toEqual([
    expect.objectContaining({ kind: 'incomplete', text: expect.stringMatching(/1 more card\b/) }),
  ]);
  await expect(page.locator('app-deck-bar .slot-empty')).toHaveCount(1);

  // And none of it needed saving.
  await page.reload();
  await openDecks(page);
  await deckButton(page, 'Deck 2').click();
  await expect(deckCards(page)).toHaveCount(DECK_SIZE - 1);
  await expect(deckCards(page).first().locator('.cf-name-text')).toHaveText(
    new RegExp(`^${name}$`, 'i'),
  );
});

test('the same card can be read from the deck and removed from there', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);

  await addButton(collectionTiles(page).first()).click();
  await expect(deckCards(page)).toHaveCount(1);

  const reader = await readCard(deckSlots(page).first());
  await reader.getByRole('button', { name: 'Remove' }).click();
  await expect(reader).toHaveCount(0);
  await expect(deckCards(page)).toHaveCount(0);
});

test('the reader withholds the add with the same reason the tile states', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);

  const tile = collectionTiles(page).first();
  for (let i = 0; i < DECK_SIZE; i++) {
    await addButton(collectionTiles(page).nth(i)).click();
  }
  await expect(deckCards(page)).toHaveCount(DECK_SIZE);

  // The tile's reason, and then the reader's, for the same card.
  const reason = await addButton(tile).getAttribute('title');
  const reader = await readCard(tile);
  await expect(reader.locator('.action-primary')).toHaveCount(0);
  expect((await reader.locator('.reason').innerText()).trim()).toBe(reason);

  // And a card read from the deck still offers removal.
  await page.keyboard.press('Escape');
  await readCard(deckSlots(page).first());
  await expect(reader.getByRole('button', { name: 'Remove' })).toBeVisible();
});

test('removing the second of three copies leaves the other two in order', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  // Three copies held, so a deck may hold three.
  await openDecksAs(page, { collection: startersWithCrawlid(3), decks: [[]] });

  const first = tileNamed(page, 'Crawlid');
  const second = tileNamed(page, 'Vengefly');
  for (const tile of [first, first, first, second]) {
    await addButton(tile).click();
  }
  await expect(deckCards(page)).toHaveCount(4);

  const names = () =>
    deckCards(page).evaluateAll((els) =>
      els.map((el) => el.querySelector('.cf-name-text')!.textContent!.trim()),
    );
  const before = await names();

  await removeButton(deckSlots(page).nth(1)).click();

  await expect(deckCards(page)).toHaveCount(3);
  expect(await names()).toEqual([before[0], before[2], before[3]]);
  await expect(page.locator('app-deck-bar .slot-empty')).toHaveCount(DECK_SIZE - 3);
});

test('a card read from the collection can be added from there', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);

  await readCard(collectionTiles(page).first());
  const reader = page.locator('app-card-reader');
  await reader.getByRole('button', { name: 'Add to Deck 1' }).click();

  await expect(reader).toHaveCount(0);
  await expect(deckCards(page)).toHaveCount(1);
});

// ─── 13.6 Deleting a deck ───────────────────────────────────────────────────

test('deleting a deck is confirmed, renumbers the rest, and costs no cards', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);

  await page.getByRole('button', { name: 'New deck', exact: true }).click();
  await page.getByRole('button', { name: 'New deck', exact: true }).click();
  await expect(deckTabs(page)).toHaveCount(3);

  // A card in the deck that is about to go, so its loss is observable.
  await deckButton(page, 'Deck 2').click();
  await addButton(collectionTiles(page).first()).click();
  await expect(deckCards(page)).toHaveCount(1);

  // The held counts: the used count follows whichever deck is on screen, so
  // it is not what "costs no cards" is about.
  const heldCounts = () =>
    collectionTiles(page).evaluateAll((els) =>
      els.map((el) => el.querySelector('.badge .held')!.textContent!.trim()),
    );
  const countsBefore = await heldCounts();

  // Declining leaves the deck exactly as it was, and still on screen.
  await page.getByRole('button', { name: 'Delete Deck 2' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Keep it' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(deckTabs(page)).toHaveCount(3);
  await expect(deckCards(page)).toHaveCount(1);

  // Confirming removes it, and the tabs renumber with no gap.
  await page.getByRole('button', { name: 'Delete Deck 2' }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText('Deck 2');
  await confirm.getByRole('button', { name: 'Delete Deck 2' }).click();

  await expect(deckTabs(page)).toHaveCount(2);
  expect(await deckTabs(page).evaluateAll((els) => els.map((el) => el.ariaLabel))).toEqual([
    'Deck 1',
    'Deck 2',
  ]);
  await expect(page.locator('app-deck-bar .deck-btn[aria-pressed="true"]')).toHaveCount(1);

  // The cards it held are all still in the collection, at the same counts.
  const countsAfter = await heldCounts();
  expect(countsAfter).toEqual(countsBefore);
});

test('deleting the last deck leaves the no-decks state', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);

  await page.getByRole('button', { name: 'Delete Deck 1' }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Delete Deck 1' }).click();

  await expect(deckTabs(page)).toHaveCount(0);
  await expect(page.locator('app-deck-bar .empty-state')).toContainText(/no decks/i);
  await expect(page.getByRole('button', { name: 'New deck', exact: true })).toBeVisible();
  await expect(collectionTiles(page)).toHaveCount(9);

  // With no deck there is nowhere to add to, and the page says so.
  await expect(addButton(collectionTiles(page).first())).toHaveText('Add to deck');
  await expectWithheld(addButton(collectionTiles(page).first()), 'Create a deck first.');
});

test('the create control is disabled at the deck limit', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);
  const { create } = deckControls(page);

  for (let i = 1; i < MAX_DECKS; i++) await create.click();
  await expect(deckTabs(page)).toHaveCount(MAX_DECKS);

  // Still there, in the same place, presented as unavailable.
  await expect(create).toHaveCount(1);
  await expect(create).toHaveAttribute('aria-disabled', 'true');
  await expect(create).toHaveAccessibleDescription(`${MAX_DECKS} decks is the limit`);
  await expect(page.locator('app-deck-bar .bar-note')).toHaveCount(0);

  // Activating it does nothing. Forced, because Playwright treats an
  // `aria-disabled` control as not clickable — the page's own guard is what
  // is under test here.
  await create.click({ force: true });
  await expect(deckTabs(page)).toHaveCount(MAX_DECKS);

  // Focus still reaches it, and its tooltip states the limit.
  await page.mouse.move(0, 0);
  await deckTabs(page).last().focus();
  await page.keyboard.press('Tab');
  await expect(create).toBeFocused();
  const tip = () =>
    create.evaluate((el) => ({
      opacity: getComputedStyle(el, '::after').opacity,
      content: getComputedStyle(el, '::after').content,
    }));
  await expect.poll(tip).toEqual({ opacity: '1', content: `"${MAX_DECKS} decks is the limit"` });

  // Deleting one deck re-enables it.
  await page.getByRole('button', { name: /^Delete Deck/ }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: /^Delete Deck/ })
    .click();
  await expect(deckTabs(page)).toHaveCount(MAX_DECKS - 1);
  await expect(create).not.toHaveAttribute('aria-disabled', 'true');
  await create.click();
  await expect(deckTabs(page)).toHaveCount(MAX_DECKS);
});

// ─── 13.2 The fit ladder ────────────────────────────────────────────────────

test.describe('the Decks page fits the viewport', () => {
  for (const size of LADDER) {
    test(`at ${label(size)} nothing scrolls but the collection`, async ({ page }) => {
      await page.setViewportSize(size);
      await openDecks(page);
      // A deck with cards in it, so the row is measured at its real content.
      await addButton(collectionTiles(page).first()).click();
      await decksSettled(page);

      await expectNoScroll(page);
      await expectPartsOnScreen(page, size, pinnedParts(page));

      // The order control and the reset control share one line: every part
      // of the sort row overlaps every other vertically.
      const rows = await page.locator('.sort-row').evaluate((row) =>
        [...row.querySelectorAll('.sort-option, .reset-data')].map((el) => {
          const box = el.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom };
        }),
      );
      const lowestTop = Math.max(...rows.map((r) => r.top));
      const highestBottom = Math.min(...rows.map((r) => r.bottom));
      expect(lowestTop, `sort row is one line at ${label(size)}`).toBeLessThan(highestBottom);

      // No deck position is ever laid out below the renderer's minimum: where
      // the viewport cannot host the row, the region is scaled as a whole
      // rather than the cards being laid out smaller.
      const laidOut = await laidOutCardWidth(deckSlots(page).first());
      expect(laidOut, `deck position at ${label(size)}`).toBeGreaterThanOrEqual(CARD_MIN_WIDTH);

      // The grid is the only thing with anywhere to go, and the pinned region
      // does not move when it goes there.
      const scrollers = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>('app-decks *')) {
          if (el.scrollHeight - el.clientHeight > 1 && getComputedStyle(el).overflowY === 'auto') {
            out.push(el.tagName.toLowerCase());
          }
        }
        return out;
      });
      expect(scrollers.every((tag) => tag === 'app-collection-grid')).toBe(true);

      const before = await page.locator('app-deck-bar').boundingBox();
      await page.locator('app-collection-grid').evaluate((el) => el.scrollBy(0, 400));
      await expect(page.locator('app-deck-bar')).toBeVisible();
      expect(await page.locator('app-deck-bar').boundingBox()).toEqual(before);

      await page.screenshot({ path: `test-results/decks-${label(size)}.png` });

      // The page is titled by the shared single-line header, on one line.
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^decks$/i);
      const header = page.locator('app-decks .screen-header');
      await expect(header).toHaveCount(1);
      const fit = await header.evaluate((el) => {
        const title = el.querySelector<HTMLElement>('.screen-header-title')!;
        const head = getComputedStyle(el);
        const lineHeight = parseFloat(getComputedStyle(title).lineHeight);
        const padding = parseFloat(head.paddingTop) + parseFloat(head.paddingBottom);
        return {
          lines: title.getClientRects().length,
          height: el.getBoundingClientRect().height,
          limit: lineHeight + padding,
        };
      });
      expect(fit.lines, `header lines at ${label(size)}`).toBe(1);
      expect(fit.height, `header height at ${label(size)}`).toBeLessThanOrEqual(fit.limit + 0.5);

      if (size === LADDER[0] || size === LADDER[LADDER.length - 1]) {
        await page
          .locator('app-decks .pinned')
          .screenshot({ path: `test-results/decks-pinned-${label(size)}.png` });
      }
    });
  }
});

// ─── The keyboard ───────────────────────────────────────────────────────────

test('the whole screen is operable by keyboard', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);

  // Each deck button is its own stop, and choosing one needs no pointer.
  await page.getByRole('button', { name: 'New deck', exact: true }).click();
  await expect(deckTabs(page)).toHaveCount(2);
  await deckTabs(page).first().focus();
  await page.keyboard.press('Tab');
  await expect(deckTabs(page).nth(1)).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(deckTabs(page).first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(deckTabs(page).first()).toHaveAttribute('aria-pressed', 'true');

  // The active order reverses from the keyboard.
  await sortControl(page, 'Rarity').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => activeDirection(page)).toBe('asc');
  await page.keyboard.press('Enter');
  await expect.poll(() => activeDirection(page)).toBe('desc');

  // A card is read from the keyboard; the next stop after it is its add button.
  const tile = collectionTiles(page).first();
  const card = cardButton(tile);
  await card.focus();
  await page.keyboard.press('Tab');
  await expectFocusVisible(addButton(tile));
  await page.keyboard.press('Enter');
  await expect(deckCards(page)).toHaveCount(1);

  // Now unavailable, and the press that made it so kept its focus.
  await expectFocusVisible(addButton(tile));
  await expect(addButton(tile)).toHaveAccessibleDescription(/already in Deck 1/);
  await page.keyboard.press('Enter');
  await expect(deckCards(page)).toHaveCount(1);

  // The same order in the deck: the card, then its Remove.
  await cardButton(deckSlots(page).first()).focus();
  await page.keyboard.press('Tab');
  await expectFocusVisible(removeButton(deckSlots(page).first()));
  await page.keyboard.press('Enter');
  await expect(deckCards(page)).toHaveCount(0);
  await expectFocusVisible(deckButton(page, 'Deck 1'));

  // The reader confines focus while it is open and returns it on dismissal.
  await card.focus();
  await page.keyboard.press('Enter');
  const reader = page.locator('app-card-reader');
  await expect(reader).toBeVisible();

  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('app-card-reader'))).toBe(
      true,
    );
  }

  await page.keyboard.press('Escape');
  await expect(reader).toHaveCount(0);
  await expect(card).toBeFocused();

  // Creating and deleting a deck, and answering the confirmation, all without
  // a pointer.
  const create = page.getByRole('button', { name: 'New deck', exact: true });
  await create.focus();
  await expect(create).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(deckTabs(page)).toHaveCount(3);

  const remove = page.getByRole('button', { name: /^Delete Deck 3$/ }).first();
  await remove.focus();
  await page.keyboard.press('Enter');

  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Keep it' }).focus();
  await page.keyboard.press('Enter');
  await expect(confirm).toHaveCount(0);
  await expect(deckTabs(page)).toHaveCount(3);

  await remove.focus();
  await page.keyboard.press('Enter');
  await confirm.getByRole('button', { name: 'Delete Deck 3' }).focus();
  await page.keyboard.press('Enter');
  await expect(deckTabs(page)).toHaveCount(2);
});

// ─── The selected deck button, without colour ───────────────────────────────

test('the selected deck button is marked by more than colour', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);
  await page.getByRole('button', { name: 'New deck', exact: true }).click();

  // A filled ground and a heavier weight, neither of which is a hue. Polled,
  // because the ground eases between states and the selection just moved.
  const faces = () =>
    deckTabs(page).evaluateAll((els) => {
      const read = (el: Element) => ({
        weight: getComputedStyle(el).fontWeight,
        ground: getComputedStyle(el).backgroundColor,
      });
      const selected = els.find((el) => el.getAttribute('aria-pressed') === 'true')!;
      const other = els.find((el) => el.getAttribute('aria-pressed') === 'false')!;
      return { selected: read(selected), other: read(other) };
    });
  await expect.poll(async () => (await faces()).other.ground).toBe('rgba(0, 0, 0, 0)');
  const { selected, other } = await faces();
  expect(selected.weight).not.toBe(other.weight);
  expect(selected.ground).not.toBe(other.ground);

  // And no diamond or other ornament beside any label.
  await expect(page.locator('app-deck-bar .tab-mark')).toHaveCount(0);
  for (const button of await deckTabs(page).all()) {
    await expect(button.locator('*')).toHaveCount(0);
  }
});

// ─── Tabs, controls, and the deck's standing ────────────────────────────────

test('only the selected deck button says "Deck", and every one keeps its full name', async ({
  page,
}) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);
  const { create } = deckControls(page);
  await create.click();
  await create.click();
  await deckButton(page, 'Deck 1').click();

  const visible = () =>
    deckTabs(page).evaluateAll((els) => els.map((el) => el.textContent!.trim()));
  const names = () => deckTabs(page).evaluateAll((els) => els.map((el) => el.ariaLabel));

  await expect.poll(visible).toEqual(['Deck 1', '2', '3']);
  expect(await names()).toEqual(['Deck 1', 'Deck 2', 'Deck 3']);

  await deckButton(page, 'Deck 2').click();
  await expect.poll(visible).toEqual(['1', 'Deck 2', '3']);
  expect(await names()).toEqual(['Deck 1', 'Deck 2', 'Deck 3']);
});

test('the deck controls are named icons, beside the deck buttons behind a separator', async ({
  page,
}) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);
  const { create, remove, group } = deckControls(page);

  // Icons on their face, names for assistive technology.
  for (const control of [create, remove]) {
    await expect(control).toBeVisible();
    await expect(control.locator('svg')).toHaveCount(1);
    expect((await control.innerText()).trim()).toBe('');
  }
  await expect(remove).toHaveAccessibleName('Delete Deck 1');

  // The name shows as a tooltip on hover…
  const tipOpacity = (control: typeof create) =>
    control.evaluate((el) => getComputedStyle(el, '::after').opacity);
  const tipText = (control: typeof create) =>
    control.evaluate((el) => getComputedStyle(el, '::after').content);
  expect(await tipOpacity(create)).toBe('0');
  await create.hover();
  await expect.poll(() => tipOpacity(create)).toBe('1');
  expect(await tipText(create)).toBe('"New deck"');

  // …and on keyboard focus: from the deck buttons, Tab reaches the + next.
  await page.mouse.move(0, 0);
  await deckTabs(page).first().focus();
  await page.keyboard.press('Tab');
  await expect(create).toBeFocused();
  await expect.poll(() => tipOpacity(create)).toBe('1');
  await page.keyboard.press('Tab');
  await expect(remove).toBeFocused();
  await expect.poll(() => tipOpacity(remove)).toBe('1');
  expect(await tipText(remove)).toBe('"Delete Deck 1"');

  // A rule and more space stand between the last deck button and the first
  // control, which follow it directly; and the whole row is centred.
  const apart = async () =>
    page.evaluate(() => {
      const buttons = [...document.querySelectorAll('app-deck-bar .deck-btn')];
      const last = buttons[buttons.length - 1].getBoundingClientRect();
      const first = buttons[0].getBoundingClientRect();
      const second = buttons[1]?.getBoundingClientRect();
      const sep = document.querySelector('app-deck-bar .controls-sep')!.getBoundingClientRect();
      const controls = document
        .querySelector('app-deck-bar .deck-controls')!
        .getBoundingClientRect();
      const bar = document.querySelector('app-deck-bar .bar')!.getBoundingClientRect();
      return {
        buttonGap: second ? second.left - first.right : 4,
        controlGap: controls.left - last.right,
        sepAfterLast: sep.left > last.right,
        sepBetween: sep.left >= last.right && sep.right <= controls.left && sep.height > 0,
        sepVisible: getComputedStyle(document.querySelector('app-deck-bar .controls-sep')!)
          .backgroundColor,
        sameLine: Math.abs(sep.top + sep.height / 2 - (last.top + last.height / 2)) < 4,
        offCentre: Math.abs((first.left + controls.right) / 2 - (bar.left + bar.right) / 2),
      };
    });
  const one = await apart();
  expect(one.sepAfterLast).toBe(true);
  expect(one.sepBetween).toBe(true);
  expect(one.sepVisible).not.toBe('rgba(0, 0, 0, 0)');
  expect(one.controlGap).toBeGreaterThan(one.buttonGap);
  expect(one.offCentre).toBeLessThanOrEqual(2);
  await expect(group.locator('.deck-btn')).toHaveCount(0);

  for (let i = 1; i < 5; i++) await create.click();
  await expect(deckTabs(page)).toHaveCount(5);
  const five = await apart();
  expect(five.sepAfterLast).toBe(true);
  expect(five.sepBetween).toBe(true);
  expect(five.offCentre).toBeLessThanOrEqual(2);

  // The group stays directly after the last button up to the limit, where the
  // + is still present, disabled.
  for (let i = 5; i < MAX_DECKS; i++) await create.click();
  await expect(deckTabs(page)).toHaveCount(MAX_DECKS);
  const nine = await apart();
  expect(nine.sepBetween).toBe(true);
  expect(nine.sameLine).toBe(true);
  expect(nine.controlGap).toBeGreaterThan(nine.buttonGap);
  await expect(create).toHaveCount(1);
  await expect(create).toHaveAttribute('aria-disabled', 'true');
});

test('the deck states its standing: error, warning, or ready', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  // Three False Knights held, so one deck may hold all three and break the rarity limit.
  await openDecksAs(page, {
    collection: [...STARTERS, { ...FALSE_KNIGHT, quantity: 3 }],
    decks: [[]],
  });

  // An empty deck is a warning, and nothing is an error.
  expect(await deckStanding(page)).toEqual([
    expect.objectContaining({ kind: 'incomplete', text: expect.stringMatching(/9 more cards/) }),
  ]);

  // Rarity order puts False Knight first. Two copies of it are within the limit.
  const falseKnight = collectionTiles(page).first();
  await expect(falseKnight.locator('.cf-name-text')).toHaveText(/false knight/i);
  for (let i = 0; i < 2; i++) {
    await addButton(falseKnight).click();
  }
  await expect(deckCards(page)).toHaveCount(2);
  expect((await deckStanding(page)).map((l) => l.kind)).toEqual(['incomplete']);

  // A third breaks it, and the error arrives without a reload, ahead of the
  // warning.
  await addButton(falseKnight).click();
  await expect(deckCards(page)).toHaveCount(3);
  const both = await deckStanding(page);
  expect(both.map((l) => l.kind)).toEqual(['invalid', 'incomplete']);
  expect(both[0].text).toMatch(/^Invalid/);
  expect(both[0].text).toMatch(/only 2 are allowed/);
  expect(both[0].text).toMatch(/Remove 1/);
  expect(both[1].text).toMatch(/^Incomplete/);
  expect(both[1].text).toMatch(/6 more cards/);

  // Each in its own status colour, and the two are different colours.
  const colours = await page.evaluate(() => {
    const resolve = (token: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      document.body.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    const item = (kind: string) =>
      getComputedStyle(document.querySelector(`app-deck-bar .standing-item.is-${kind}`)!).color;
    return {
      error: item('invalid'),
      warning: item('incomplete'),
      errorToken: resolve('--color-error'),
      warningToken: resolve('--color-warning'),
    };
  });
  expect(colours.error).toBe(colours.errorToken);
  expect(colours.warning).toBe(colours.warningToken);
  expect(colours.error).not.toBe(colours.warning);

  await page
    .locator('app-decks .pinned')
    .screenshot({ path: 'test-results/decks-standing-both.png' });

  // Removing one False Knight clears the error.
  await removeButton(deckSlots(page).nth(1)).click();
  await expect(deckCards(page)).toHaveCount(2);
  expect((await deckStanding(page)).map((l) => l.kind)).toEqual(['incomplete']);

  // Filled to nine within the limit, the deck is ready: seven one-star
  // starters after the two False Knights, a copy of each.
  for (let i = 1; i <= DECK_SIZE - 2; i++) {
    await addButton(collectionTiles(page).nth(i)).click();
  }
  await expect(deckCards(page)).toHaveCount(DECK_SIZE);
  expect(await deckStanding(page)).toEqual([{ kind: 'ready', text: 'Ready for battle' }]);

  // And nowhere does the page count positions.
  await expect(page.getByText(/positions filled/i)).toHaveCount(0);
});

// ─── Sort direction, rarity sections, and the reorder motion ────────────────

/** Each tile's attack, read from the card's own accessible description. */
async function tileAttacks(page: Page): Promise<number[]> {
  return collectionTiles(page).evaluateAll((els) =>
    els.map((el) => {
      const label = el.querySelector('app-card [aria-label]')!.getAttribute('aria-label')!;
      return Number(/attack (\d+)/.exec(label)![1]);
    }),
  );
}

test('the active order shows its direction and reverses on a second choice', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecksAs(page, {
    collection: [...STARTERS, { ...FALSE_KNIGHT, quantity: 1 }],
    decks: [[]],
  });

  // On arrival only Rarity carries a chevron, and it is announced descending.
  await expect(page.locator('.sort-option .sort-chevron')).toHaveCount(1);
  await expect(sortControl(page, 'Rarity').locator('.sort-chevron')).toHaveCount(1);
  await expect(sortControl(page, 'Rarity')).toHaveAccessibleName(/descending/);
  expect(await chevronTurned(page)).toBe(false);

  // Attack opens highest first; a second choice reverses it.
  await chooseOrder(page, 'Attack');
  const down = await tileAttacks(page);
  expect(down).toEqual([...down].sort((a, b) => b - a));
  expect(await activeDirection(page)).toBe('desc');

  await sortControl(page, 'Attack').click();
  await expect(sortControl(page, 'Attack')).toHaveAccessibleName(/ascending/);
  const up = await tileAttacks(page);
  expect(up).toEqual([...up].sort((a, b) => a - b));
  await expect.poll(() => chevronTurned(page)).toBe(true);
  await expect(page.locator('.sort-option .sort-chevron')).toHaveCount(1);

  // A new order opens in its own default: Name, A to Z.
  await chooseOrder(page, 'Name');
  await expect(sortControl(page, 'Name')).toHaveAccessibleName(/ascending/);
  const names = await tileNames(page);
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));

  await page.locator('app-decks .sort-row').screenshot({ path: 'test-results/decks-sort-row.png' });
});

test('ordering by rarity sections the collection', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  // The one-star starters, one two-star card (FC 7), and False Knight at four stars.
  // Nothing at three, so no three-star section may appear.
  await openDecksAs(page, {
    collection: [
      ...STARTERS,
      { set: 'FC', number: 7, quantity: 1 },
      { ...FALSE_KNIGHT, quantity: 1 },
    ],
    decks: [[]],
  });

  const heads = page.locator('app-collection-grid .section-head');
  const headWords = () =>
    heads.evaluateAll((els) =>
      els.map((el) => el.querySelector('.section-words')!.textContent!.trim()),
    );
  const sectionStars = () =>
    page
      .locator('app-collection-grid .rarity-section')
      .evaluateAll((sections) =>
        sections.map((section) => [
          ...new Set(
            [...section.querySelectorAll('.tile')].map(
              (tile) => tile.querySelectorAll('app-card .star.lit').length,
            ),
          ),
        ]),
      );

  // Sectioned on arrival, rarest first, and each section holds only its rating.
  await expect(heads).toHaveCount(3);
  expect(await headWords()).toEqual(['4 stars', '2 stars', '1 star']);
  expect(await sectionStars()).toEqual([[4], [2], [1]]);
  await expect(heads.first()).toHaveAccessibleName('4 stars');
  await expect(page.getByRole('heading', { level: 2, name: '4 stars' })).toHaveCount(1);
  // No section, heading, or gap for a rating not held.
  await expect(page.getByRole('heading', { name: /3 stars?/ })).toHaveCount(0);

  const oneStarsDown = await page
    .locator('app-collection-grid .rarity-section')
    .last()
    .locator('.cf-name-text')
    .allInnerTexts();

  // Reversing reverses the sections, and the tiles inside keep their order.
  await sortControl(page, 'Rarity').click();
  await expect.poll(() => activeDirection(page)).toBe('asc');
  expect(await headWords()).toEqual(['1 star', '2 stars', '4 stars']);
  expect(await sectionStars()).toEqual([[1], [2], [4]]);
  const oneStarsUp = await page
    .locator('app-collection-grid .rarity-section')
    .first()
    .locator('.cf-name-text')
    .allInnerTexts();
  expect(oneStarsUp).toEqual(oneStarsDown);

  await decksSettled(page);
  await page.screenshot({ path: 'test-results/decks-rarity-sections.png' });

  // Every other order is one run with no headings.
  for (const order of ['Name', 'Quantity', 'Attack', 'Defense']) {
    await chooseOrder(page, order);
    await expect(heads).toHaveCount(0);
    await expect(collectionTiles(page)).toHaveCount(11);
  }
});

test('the collection is aligned to its left edge in every order', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  // One four-star and one two-star card, so those sections are rows of one.
  await openDecksAs(page, {
    collection: [
      ...STARTERS,
      { set: 'FC', number: 7, quantity: 1 },
      { ...FALSE_KNIGHT, quantity: 1 },
    ],
    decks: [[]],
  });

  // Every heading's label and every section's first tile sit on the region's
  // left edge, with no rule ahead of the label.
  const sectioned = await expectCollectionLeftAligned(page);
  expect(sectioned.sections).toHaveLength(3);

  // A short row leaves its unused width on the right of its last tile.
  const shortRow = await page
    .locator('app-collection-grid .rarity-section')
    .first()
    .evaluate((section) => {
      const grid = section.querySelector('.grid')!;
      const box = grid.getBoundingClientRect();
      const tiles = [...section.querySelectorAll('.tile')];
      return {
        tiles: tiles.length,
        left: tiles[0].getBoundingClientRect().left - box.left,
        right: box.right - tiles[tiles.length - 1].getBoundingClientRect().right,
      };
    });
  expect(shortRow.tiles).toBe(1);
  expect(shortRow.right).toBeGreaterThan(shortRow.left * 4);

  // The heading's single rule runs on from the label towards the right edge.
  const rule = await page
    .locator('app-collection-grid .section-head')
    .first()
    .evaluate((head) => {
      const after = getComputedStyle(head, '::after');
      return { content: after.content, width: parseFloat(after.width) };
    });
  expect(rule.content).not.toBe('none');
  expect(rule.width).toBeGreaterThan(200);

  // Every other order starts its one run on the same edge, so switching order
  // never moves the grid sideways.
  for (const order of ['Name', 'Quantity', 'Attack', 'Defense']) {
    await chooseOrder(page, order);
    await expect(page.locator('app-collection-grid .section-head')).toHaveCount(0);
    const run = await expectCollectionLeftAligned(page);
    expect(Math.abs(run.firstTile - sectioned.firstTile)).toBeLessThanOrEqual(1);
  }
  await chooseOrder(page, 'Rarity');
  const back = await collectionAlignment(page);
  expect(Math.abs(back.firstTile - sectioned.firstTile)).toBeLessThanOrEqual(1);
});

test('the page draws no corner frame but keeps its atmosphere', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);
  await expect(page.locator('.corner')).toHaveCount(0);
  await expect(page.locator('app-decks .void-bg')).toHaveCount(1);
  await expect(page.locator('app-decks .mist-layer')).toHaveCount(1);
  await expect(page.locator('app-decks .particles .particle').first()).toBeAttached();
});

test('a reorder animates every tile', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecks(page);
  await decksSettled(page);

  // The nine starters are all one-star, so rarity and name read the same
  // sequence: no tile changes place, and every one must still move.
  const before = await tileNames(page);
  await sortControl(page, 'Name').click();

  // Every tile is replaying `tileIn` (by suffix: Angular scopes keyframe names
  // to the component). A tile the reorder left in place would never run it
  // again, so polling until all of them are cannot pass by luck.
  const allRunning = () =>
    collectionTiles(page).evaluateAll((els) =>
      els.map((el) =>
        el
          .getAnimations()
          .some(
            (a) =>
              /tileIn$/.test((a as CSSAnimation).animationName) &&
              (a.playState === 'running' || a.playState === 'pending'),
          ),
      ),
    );
  await expect.poll(allRunning).toEqual(Array(9).fill(true));
  expect(await tileNames(page)).toEqual(before);

  // A reversal animates too.
  await decksSettled(page);
  await sortControl(page, 'Name').click();
  await expect.poll(allRunning).toEqual(Array(9).fill(true));
  expect(await tileNames(page)).toEqual([...before].reverse());
});

// ─── Reset ──────────────────────────────────────────────────────────────────

test('reset restores a new player after confirmation', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openDecksAs(page, {
    geo: 750,
    collection: [...startersWithCrawlid(3), { ...FALSE_KNIGHT, quantity: 2 }],
    decks: [[CRAWLID, CRAWLID, FALSE_KNIGHT], [CRAWLID], []],
  });
  await chooseOrder(page, 'Name');
  await deckButton(page, 'Deck 2').click();

  const reset = page.getByRole('button', { name: 'Reset data' });
  await expect(reset).toBeVisible();
  // Marked as a debug tool on its face.
  await expect(reset).toContainText(/debug/i);
  expect(await reset.evaluate((el) => getComputedStyle(el).borderStyle)).toBe('dashed');

  // Declining changes nothing.
  await reset.click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  // Nothing has been reset merely by asking.
  await expect(deckTabs(page)).toHaveCount(3);
  await expect(dialog).toContainText(/cards, Geo, Rosaries, and decks/);
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(deckTabs(page)).toHaveCount(3);
  await expect(collectionTiles(page)).toHaveCount(10);
  await expect(deckButton(page, 'Deck 2')).toHaveAttribute('aria-pressed', 'true');

  // Escape declines as well, and focus returns to the control.
  await reset.click();
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(reset).toBeFocused();
  await expect(deckTabs(page)).toHaveCount(3);

  // Confirming replaces everything with a new player's, at once.
  await reset.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Reset data' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(deckTabs(page)).toHaveCount(1);
  await expect(deckButton(page, 'Deck 1')).toHaveAttribute('aria-pressed', 'true');
  await expect(deckCards(page)).toHaveCount(0);
  await expect(collectionTiles(page)).toHaveCount(9);
  for (const tile of await collectionTiles(page).all()) expect(await badgeCount(tile)).toBe(1);
  await expect(sortControl(page, 'Rarity')).toHaveAttribute('aria-pressed', 'true');
  expect(await activeDirection(page)).toBe('desc');

  // The balance reads zero elsewhere, without a reload.
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Shop' })
    .click();
  await expect(purse(page)).toHaveText('0');

  // And it is durable.
  await page.reload();
  await openDecks(page);
  await expect(deckTabs(page)).toHaveCount(1);
  await expect(collectionTiles(page)).toHaveCount(9);
  await expect(deckCards(page)).toHaveCount(0);
});
