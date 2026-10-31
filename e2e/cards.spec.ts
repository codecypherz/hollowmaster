import { expect, test, type Page } from '@playwright/test';
import {
  CARD_ABILITY_GATE,
  CARD_MIN_WIDTH,
  DECK_SIZE,
  MAX_DECKS,
  abilitySectionWidth,
  badgeCount,
  cardWidth,
  cardsSettled,
  collectionTiles,
  deckCards,
  deckSlots,
  deckTabs,
  expectNoScroll,
  expectPartsOnScreen,
  deckControls,
  deckStanding,
  openCardsAs,
  label,
  laidOutCardWidth,
  openCardMenu,
  openCards,
  openMenu,
  type Size,
} from './helpers';

/**
 * The Cards page: the collection, the decks built from it, and the fit that
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
  // its defense, so an unscoped search by those names finds cards too.
  return page.locator('.sort-options').getByRole('button', { name: order, exact: true });
}

/** Chooses an order and waits for the page to be showing it. */
async function chooseOrder(page: Page, order: string): Promise<void> {
  await sortControl(page, order).click();
  // The label is drawn uppercase with padding whitespace, so the match is on
  // the word rather than on the node's exact text.
  await expect(page.locator('.sort-option.is-active')).toHaveText(
    new RegExp(`^\\s*${order}\\s*$`, 'i'),
  );
}

/** The collection's cards, in the order the grid reads them. */
async function tileNames(page: Page): Promise<string[]> {
  return collectionTiles(page).evaluateAll((els) =>
    els.map((el) => el.querySelector('app-card .cf-name-text')!.textContent!.trim()),
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
    deckRow: page.locator('app-deck-bar .deck-row'),
  };
}

test.describe('the Cards page', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DEFAULT);
    await openCards(page);
  });

  test('shows the seeded deck and the whole collection', async ({ page }) => {
    await expect(deckTabs(page)).toHaveCount(1);
    await expect(deckTabs(page).first()).toHaveText(/Deck 1/);
    await expect(deckSlots(page)).toHaveCount(DECK_SIZE);
    await expect(deckCards(page)).toHaveCount(0);

    // The nine starter cards, one tile each, and nothing marked as forthcoming.
    await expect(collectionTiles(page)).toHaveCount(9);
    await expect(page.locator('app-collection .coming-soon')).toHaveCount(0);
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
    await expect(active).toHaveText('Rarity');

    const starsOf = () =>
      collectionTiles(page).evaluateAll((els) =>
        els.map((el) => el.querySelectorAll('app-card .star.lit').length),
      );
    const stars = await starsOf();
    expect(stars).toEqual([...stars].sort((a, b) => b - a));

    // Every order is offered by name, and choosing one reorders the grid.
    // The labels are drawn uppercase by the stylesheet, so the comparison is
    // of the words rather than of their casing.
    const names = await page.locator('.sort-option').allInnerTexts();
    expect(names.map((n) => n.trim().toLowerCase())).toEqual([
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
    for (const order of ['Rarity', 'Quantity', 'Name', 'Attack', 'Defense']) {
      await chooseOrder(page, order);
      await expect(page.locator('.sort-option.is-active')).toHaveCount(1);
      // The sequence the grid reads in is the one that order asks for, and it
      // is the same sequence every time that order is chosen.
      const once = await tileNames(page);
      await chooseOrder(page, 'Rarity');
      await chooseOrder(page, order);
      expect(await tileNames(page)).toEqual(once);
    }

    // And the deck on screen is untouched by a reorder.
    await expect(deckTabs(page).first()).toHaveClass(/is-selected/);
    await expect(deckCards(page)).toHaveCount(0);
  });
});

// ─── 13.3 The width bands ───────────────────────────────────────────────────

test.describe('the width bands', () => {
  for (const size of LADDER.filter((s) => s.width === 1920 || s.width === 1100)) {
    test(`at ${label(size)} every tile is under the ability gate`, async ({ page }) => {
      await page.setViewportSize(size);
      await openCards(page);

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
    await openCards(page);

    await openCardMenu(collectionTiles(page).first());
    await page.getByRole('button', { name: 'Read' }).click();

    const reader = page.locator('app-card-reader');
    await expect(reader).toBeVisible();
    expect(await cardWidth(reader)).toBeGreaterThanOrEqual(CARD_ABILITY_GATE);

    await expect(reader.locator('.cf-ability-text')).toBeVisible();
    await expect(reader.locator('.cf-ability-text')).not.toBeEmpty();
    await expect(reader.locator('.cf-set')).toHaveText(/\S/);
    await expect(reader.locator('.cf-number')).toHaveText(/^\d{3}$/);
  });
});

// ─── 13.4 The count badge ───────────────────────────────────────────────────

test('a badge states the count and obscures nothing the card draws', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);

  // Every card is held once at the seed; two more copies of one of them make a
  // count worth stating, granted the way a pack would grant them.
  await page.evaluate(() => localStorage.clear());
  await openCards(page);

  const first = collectionTiles(page).first();
  expect(await badgeCount(first)).toBe(1);

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
});

// ─── 13.5 Building a deck ───────────────────────────────────────────────────

test('a deck is built, filled, trimmed, and survives a reload', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);

  // A second deck, created from the page and selected on arrival.
  await page.getByRole('button', { name: 'New deck', exact: true }).click();
  await expect(deckTabs(page)).toHaveCount(2);
  await expect(deckTabs(page).nth(1)).toHaveClass(/is-selected/);
  await expect(deckCards(page)).toHaveCount(0);

  const tile = collectionTiles(page).first();
  const name = (await tile.locator('app-card .cf-name-text').innerText()).trim();

  // The same card nine times, from one held copy.
  for (let i = 0; i < DECK_SIZE; i++) {
    await openCardMenu(tile);
    await page.getByRole('button', { name: `Add to Deck 2` }).click();
    await expect(deckCards(page)).toHaveCount(i + 1);
  }
  await expect(page.locator('app-deck-bar .slot-empty')).toHaveCount(0);
  expect(await deckStanding(page)).toEqual([{ kind: 'ready', text: 'Ready for battle' }]);

  // The collection is unchanged by any of it.
  expect(await badgeCount(tile)).toBe(1);
  await expect(collectionTiles(page)).toHaveCount(9);

  // With the deck full, the add action is withheld and the page says why.
  const menu = await openCardMenu(tile);
  await expect(menu.locator('.action-primary')).toHaveCount(0);
  await expect(menu.locator('.reason')).toContainText(/full/i);
  await page.keyboard.press('Escape');

  // Removing one frees exactly that position.
  await openCardMenu(deckSlots(page).nth(1));
  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(deckCards(page)).toHaveCount(DECK_SIZE - 1);
  expect(await deckStanding(page)).toEqual([
    expect.objectContaining({ kind: 'incomplete', text: expect.stringMatching(/1 more card\b/) }),
  ]);
  await expect(page.locator('app-deck-bar .slot-empty')).toHaveCount(1);

  // And none of it needed saving.
  await page.reload();
  await openCards(page);
  await page.getByRole('tab', { name: 'Deck 2' }).click();
  await expect(deckCards(page)).toHaveCount(DECK_SIZE - 1);
  await expect(deckCards(page).first().locator('.cf-name-text')).toHaveText(
    new RegExp(`^${name}$`, 'i'),
  );
});

test('the same card can be read from the deck and removed from there', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);

  await openCardMenu(collectionTiles(page).first());
  await page.getByRole('button', { name: 'Add to Deck 1' }).click();
  await expect(deckCards(page)).toHaveCount(1);

  await openCardMenu(deckSlots(page).first());
  await page.getByRole('button', { name: 'Read' }).click();
  const reader = page.locator('app-card-reader');
  await expect(reader).toBeVisible();

  await reader.getByRole('button', { name: 'Remove' }).click();
  await expect(reader).toHaveCount(0);
  await expect(deckCards(page)).toHaveCount(0);
});

test('the reader withholds the add with the same reason the menu states', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);

  const tile = collectionTiles(page).first();
  for (let i = 0; i < DECK_SIZE; i++) {
    await openCardMenu(tile);
    await page.getByRole('button', { name: 'Add to Deck 1' }).click();
  }
  await expect(deckCards(page)).toHaveCount(DECK_SIZE);

  // The menu's reason, and then the reader's, for the same card.
  const menu = await openCardMenu(tile);
  const reason = (await menu.locator('.reason').innerText()).trim();
  await page.getByRole('button', { name: 'Read' }).click();

  const reader = page.locator('app-card-reader');
  await expect(reader).toBeVisible();
  await expect(reader.locator('.action-primary')).toHaveCount(0);
  expect((await reader.locator('.reason').innerText()).trim()).toBe(reason);

  // And a card read from the deck still offers removal.
  await page.keyboard.press('Escape');
  await openCardMenu(deckSlots(page).first());
  await page.getByRole('button', { name: 'Read' }).click();
  await expect(reader.getByRole('button', { name: 'Remove' })).toBeVisible();
});

test('removing the second of three copies leaves the other two in order', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);

  const first = collectionTiles(page).first();
  const second = collectionTiles(page).nth(1);
  for (const tile of [first, first, first, second]) {
    await openCardMenu(tile);
    await page.getByRole('button', { name: 'Add to Deck 1' }).click();
  }
  await expect(deckCards(page)).toHaveCount(4);

  const names = () =>
    deckCards(page).evaluateAll((els) =>
      els.map((el) => el.querySelector('.cf-name-text')!.textContent!.trim()),
    );
  const before = await names();

  await openCardMenu(deckSlots(page).nth(1));
  await page.getByRole('button', { name: 'Remove' }).click();

  await expect(deckCards(page)).toHaveCount(3);
  expect(await names()).toEqual([before[0], before[2], before[3]]);
  await expect(page.locator('app-deck-bar .slot-empty')).toHaveCount(DECK_SIZE - 3);
});

test('a card read from the collection can be added from there', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);

  await openCardMenu(collectionTiles(page).first());
  await page.getByRole('button', { name: 'Read' }).click();
  const reader = page.locator('app-card-reader');
  await reader.getByRole('button', { name: 'Add to Deck 1' }).click();

  await expect(reader).toHaveCount(0);
  await expect(deckCards(page)).toHaveCount(1);
});

// ─── 13.6 Deleting a deck ───────────────────────────────────────────────────

test('deleting a deck is confirmed, renumbers the rest, and costs no cards', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);

  await page.getByRole('button', { name: 'New deck', exact: true }).click();
  await page.getByRole('button', { name: 'New deck', exact: true }).click();
  await expect(deckTabs(page)).toHaveCount(3);

  // A card in the deck that is about to go, so its loss is observable.
  await page.getByRole('tab', { name: 'Deck 2' }).click();
  await openCardMenu(collectionTiles(page).first());
  await page.getByRole('button', { name: 'Add to Deck 2' }).click();
  await expect(deckCards(page)).toHaveCount(1);

  const countsBefore = await collectionTiles(page).evaluateAll((els) =>
    els.map((el) => el.querySelector('.badge')!.textContent!.trim()),
  );

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
  await expect(page.locator('app-deck-bar .deck-tab.is-selected')).toHaveCount(1);

  // The cards it held are all still in the collection, at the same counts.
  const countsAfter = await collectionTiles(page).evaluateAll((els) =>
    els.map((el) => el.querySelector('.badge')!.textContent!.trim()),
  );
  expect(countsAfter).toEqual(countsBefore);
});

test('deleting the last deck leaves the no-decks state', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);

  await page.getByRole('button', { name: 'Delete Deck 1' }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Delete Deck 1' }).click();

  await expect(deckTabs(page)).toHaveCount(0);
  await expect(page.locator('app-deck-bar .empty-state')).toContainText(/no decks/i);
  await expect(page.getByRole('button', { name: 'New deck', exact: true })).toBeVisible();
  await expect(collectionTiles(page)).toHaveCount(9);

  // With no deck there is nowhere to add to, and the page says so.
  const menu = await openCardMenu(collectionTiles(page).first());
  await expect(menu.locator('.action-primary')).toHaveCount(0);
  await expect(menu.locator('.reason')).toContainText(/create a deck/i);
});

test('the create control is absent at the deck limit', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);

  for (let i = 1; i < MAX_DECKS; i++) {
    await page.getByRole('button', { name: 'New deck', exact: true }).click();
  }
  await expect(deckTabs(page)).toHaveCount(MAX_DECKS);

  await expect(page.getByRole('button', { name: 'New deck', exact: true })).toHaveCount(0);
  await expect(page.locator('app-deck-bar .bar-note')).toContainText(`${MAX_DECKS} decks`);
});

// ─── 13.2 The fit ladder ────────────────────────────────────────────────────

test.describe('the Cards page fits the viewport', () => {
  for (const size of LADDER) {
    test(`at ${label(size)} nothing scrolls but the collection`, async ({ page }) => {
      await page.setViewportSize(size);
      await openCards(page);
      // A deck with cards in it, so the row is measured at its real content.
      await openCardMenu(collectionTiles(page).first());
      await page.getByRole('button', { name: 'Add to Deck 1' }).click();
      await cardsSettled(page);

      await expectNoScroll(page);
      await expectPartsOnScreen(page, size, pinnedParts(page));

      // No deck position is ever laid out below the renderer's minimum: where
      // the viewport cannot host the row, the region is scaled as a whole
      // rather than the cards being laid out smaller.
      const laidOut = await laidOutCardWidth(deckSlots(page).first());
      expect(laidOut, `deck position at ${label(size)}`).toBeGreaterThanOrEqual(CARD_MIN_WIDTH);

      // The grid is the only thing with anywhere to go, and the pinned region
      // does not move when it goes there.
      const scrollers = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>('app-collection *')) {
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

      await page.screenshot({ path: `test-results/cards-${label(size)}.png` });

      // The page is titled by the shared single-line header, on one line.
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^cards$/i);
      const header = page.locator('app-collection .screen-header');
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
          .locator('app-collection .pinned')
          .screenshot({ path: `test-results/cards-pinned-${label(size)}.png` });
      }
    });
  }
});

// ─── The keyboard ───────────────────────────────────────────────────────────

test('the whole screen is operable by keyboard', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);

  // The tabs are one stop, and the selection moves inside it with the arrows.
  await page.getByRole('button', { name: 'New deck', exact: true }).click();
  await expect(deckTabs(page)).toHaveCount(2);
  await deckTabs(page).nth(1).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(deckTabs(page).first()).toBeFocused();
  await expect(deckTabs(page).first()).toHaveAttribute('aria-selected', 'true');

  // A card's menu opens from the keyboard, and focus lands in it.
  const card = collectionTiles(page).first().locator('app-card button');
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(openMenu(page)).toBeVisible();
  await expect(openMenu(page).locator('.action-primary')).toBeFocused();

  // Escape dismisses it and hands focus back to the card it was raised over.
  await page.keyboard.press('Escape');
  await expect(openMenu(page)).toHaveCount(0);
  await expect(card).toBeFocused();

  // The reader confines focus while it is open and returns it on dismissal.
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Read' }).click();
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

// ─── The selected tab, without colour ───────────────────────────────────────

test('the selected tab is marked by more than colour', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);
  await page.getByRole('button', { name: 'New deck', exact: true }).click();

  // The mark is drawn for the selected tab and not for the others, so the
  // distinction survives colour being taken away.
  const marks = await deckTabs(page).evaluateAll((els) =>
    els.map((el) => ({
      selected: el.getAttribute('aria-selected'),
      markOpacity: getComputedStyle(el.querySelector('.tab-mark')!).opacity,
    })),
  );

  expect(marks).toHaveLength(2);
  for (const mark of marks) {
    expect(Number(mark.markOpacity)).toBe(mark.selected === 'true' ? 1 : 0);
  }
});

// ─── Tabs, controls, and the deck's standing ────────────────────────────────

test('only the selected tab says "Deck", and every tab keeps its full name', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);
  const { create } = deckControls(page);
  await create.click();
  await create.click();
  await page.getByRole('tab', { name: 'Deck 1' }).click();

  const visible = () =>
    deckTabs(page).evaluateAll((els) => els.map((el) => el.textContent!.trim()));
  const names = () => deckTabs(page).evaluateAll((els) => els.map((el) => el.ariaLabel));

  await expect.poll(visible).toEqual(['Deck 1', '2', '3']);
  expect(await names()).toEqual(['Deck 1', 'Deck 2', 'Deck 3']);

  await page.getByRole('tab', { name: 'Deck 2' }).click();
  await expect.poll(visible).toEqual(['1', 'Deck 2', '3']);
  expect(await names()).toEqual(['Deck 1', 'Deck 2', 'Deck 3']);
});

test('the deck controls are named icons, set apart from the tabs', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCards(page);
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

  // …and on keyboard focus: from the tab strip, Tab reaches the + next.
  await page.mouse.move(0, 0);
  await deckTabs(page).first().focus();
  await page.keyboard.press('Tab');
  await expect(create).toBeFocused();
  await expect.poll(() => tipOpacity(create)).toBe('1');
  await page.keyboard.press('Tab');
  await expect(remove).toBeFocused();
  await expect.poll(() => tipOpacity(remove)).toBe('1');
  expect(await tipText(remove)).toBe('"Delete Deck 1"');

  // A rule and more space stand between the last tab and the first control.
  const apart = async () =>
    page.evaluate(() => {
      const tabs = [...document.querySelectorAll('app-deck-bar .deck-tab')];
      const last = tabs[tabs.length - 1].getBoundingClientRect();
      const first = tabs[0].getBoundingClientRect();
      const second = tabs[1]?.getBoundingClientRect();
      const sep = document.querySelector('app-deck-bar .controls-sep')!.getBoundingClientRect();
      const controls = document
        .querySelector('app-deck-bar .deck-controls')!
        .getBoundingClientRect();
      return {
        tabGap: second ? second.left - first.right : 4,
        controlGap: controls.left - last.right,
        sepBetween: sep.left >= last.right && sep.right <= controls.left && sep.height > 0,
        sepVisible: getComputedStyle(document.querySelector('app-deck-bar .controls-sep')!)
          .backgroundColor,
        groupRight: controls.right,
      };
    });
  const one = await apart();
  expect(one.sepBetween).toBe(true);
  expect(one.sepVisible).not.toBe('rgba(0, 0, 0, 0)');
  expect(one.controlGap).toBeGreaterThan(one.tabGap);
  await expect(group.locator('.deck-tab')).toHaveCount(0);

  // The group keeps its place at the end as decks are added up to the limit,
  // where the + gives way to the limit note inside the same group.
  for (let i = 1; i < MAX_DECKS; i++) await create.click();
  await expect(deckTabs(page)).toHaveCount(MAX_DECKS);
  const nine = await apart();
  expect(nine.sepBetween).toBe(true);
  expect(nine.controlGap).toBeGreaterThan(nine.tabGap);
  expect(Math.abs(nine.groupRight - one.groupRight)).toBeLessThan(1);
  await expect(create).toHaveCount(0);
  await expect(group.locator('.bar-note')).toContainText(`${MAX_DECKS} decks is the limit`);
});

/** The starter collection, one copy each, plus one Goam (FC 6, four stars). */
const STARTERS = [1, 7, 8, 9, 10, 11, 12, 13, 14].map((number) => ({
  set: 'FC',
  number,
  quantity: 1,
}));
const GOAM = { set: 'FC', number: 6 };

test('the deck states its standing: error, warning, or ready', async ({ page }) => {
  await page.setViewportSize(DEFAULT);
  await openCardsAs(page, { collection: [...STARTERS, { ...GOAM, quantity: 1 }], decks: [[]] });

  // An empty deck is a warning, and nothing is an error.
  expect(await deckStanding(page)).toEqual([
    expect.objectContaining({ kind: 'incomplete', text: expect.stringMatching(/9 more cards/) }),
  ]);

  // Rarity order puts Goam first. Two copies of it break the limit, and the
  // error arrives without a reload, ahead of the warning.
  const goam = collectionTiles(page).first();
  await expect(goam.locator('.cf-name-text')).toHaveText(/goam/i);
  for (let i = 0; i < 2; i++) {
    await openCardMenu(goam);
    await page.getByRole('button', { name: 'Add to Deck 1' }).click();
  }
  await expect(deckCards(page)).toHaveCount(2);
  const both = await deckStanding(page);
  expect(both.map((l) => l.kind)).toEqual(['invalid', 'incomplete']);
  expect(both[0].text).toMatch(/^Invalid/);
  expect(both[0].text).toMatch(/only 1 is allowed/);
  expect(both[0].text).toMatch(/Remove 1/);
  expect(both[1].text).toMatch(/^Incomplete/);
  expect(both[1].text).toMatch(/7 more cards/);

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
    .locator('app-collection .pinned')
    .screenshot({ path: 'test-results/cards-standing-both.png' });

  // Removing one Goam clears the error.
  await openCardMenu(deckSlots(page).nth(1));
  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(deckCards(page)).toHaveCount(1);
  expect((await deckStanding(page)).map((l) => l.kind)).toEqual(['incomplete']);

  // Filled to nine within the limit, the deck is ready.
  const low = collectionTiles(page).nth(1);
  for (let i = 1; i < DECK_SIZE; i++) {
    await openCardMenu(low);
    await page.getByRole('button', { name: 'Add to Deck 1' }).click();
  }
  await expect(deckCards(page)).toHaveCount(DECK_SIZE);
  expect(await deckStanding(page)).toEqual([{ kind: 'ready', text: 'Ready for battle' }]);

  // And nowhere does the page count positions.
  await expect(page.getByText(/positions filled/i)).toHaveCount(0);
});
