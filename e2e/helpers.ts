import { expect, type Locator, type Page } from '@playwright/test';

/** Both hands' nine positions each. */
export const HAND_POSITIONS = 18;

/** The board's 5x5 cells. */
export const BOARD_CELLS = 25;

/**
 * The in-game route is guarded: it may only be reached by starting a match from
 * Battle, never by URL. Most checks here need the in-game screen, so that walk
 * lives in one place.
 *
 * Web-first assertions carry all the waiting — there is no fixed delay or poll
 * anywhere in this suite.
 */
export async function startMatch(page: Page): Promise<void> {
  await page.goto('/battle');
  await page.getByRole('button', { name: 'Start Game' }).click();

  await expect(page).toHaveURL(/\/game$/);
  await expect(arena(page)).toBeVisible();
  await dealSettled(page);
}

/**
 * Waits out the staggered deal, so a check measures — or photographs — the
 * screen at rest rather than part-way through its entrance. The entrance fades
 * each dealt card in — the animation is on the card, not on the position that
 * holds it — so a rack whose cards are all at full opacity has finished
 * arriving.
 */
export async function dealSettled(page: Page): Promise<void> {
  const dealt = page.locator('app-game app-hand-rack .slot app-card');
  await expect(dealt).toHaveCount(HAND_POSITIONS);
  await expect
    .poll(() =>
      dealt.evaluateAll((cards) => cards.every((card) => getComputedStyle(card).opacity === '1')),
    )
    .toBe(true);
}

/** The four-column arena: the element the screen's geometry is written onto. */
export function arena(page: Page): Locator {
  return page.locator('app-game .arena');
}

/** The arena's four columns, in the order the grid lays them out. */
export function columns(page: Page): Record<string, Locator> {
  return {
    codex: page.locator('app-game .codex'),
    playerRack: page.locator('app-game .rack-player'),
    board: page.getByLabel('Game board'),
    opponentRack: page.locator('app-game .rack-opponent'),
  };
}

/** A viewport the in-game screen is checked at. */
export interface Size {
  width: number;
  height: number;
}

/** A viewport's name in a test title or an artifact filename. */
export const label = ({ width, height }: Size) => `${width}x${height}`;

/** The page does not scroll in either axis. */
export async function expectNoScroll(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const d = document.documentElement;
        return {
          overflowX: d.scrollWidth - d.clientWidth,
          overflowY: d.scrollHeight - d.clientHeight,
        };
      }),
    )
    .toEqual({ overflowX: 0, overflowY: 0 });
}

/**
 * Every column of the arena is wholly on screen, and the arena still holds all
 * of its cells and hand positions.
 *
 * A half-pixel of tolerance: bounding boxes are fractional and the arena's
 * viewing scale is quantised, so an exact comparison would fail on rounding
 * rather than on clipping.
 */
export async function expectNothingClipped(page: Page, size: Size): Promise<void> {
  const parts = {
    ...columns(page),
    standing: page.getByLabel('Standing'),
    inspector: page.locator('app-game app-card-inspector'),
  };

  for (const [name, locator] of Object.entries(parts)) {
    const box = await locator.boundingBox();
    expect(box, `${name} has a bounding box at ${label(size)}`).not.toBeNull();
    const { x, y, width, height } = box!;
    expect(x, `${name} left edge at ${label(size)}`).toBeGreaterThanOrEqual(-0.5);
    expect(y, `${name} top edge at ${label(size)}`).toBeGreaterThanOrEqual(-0.5);
    expect(x + width, `${name} right edge at ${label(size)}`).toBeLessThanOrEqual(size.width + 0.5);
    expect(y + height, `${name} bottom edge at ${label(size)}`).toBeLessThanOrEqual(
      size.height + 0.5,
    );
  }

  await expect(page.locator('app-game .board-cell')).toHaveCount(BOARD_CELLS);
  await expect(page.locator('app-game app-hand-rack .slot')).toHaveCount(HAND_POSITIONS);
}

// ─── The Shop ───────────────────────────────────────────────────────────────

/** How many cards a pack holds — the one number both sides of the reveal agree on. */
export const PACK_SIZE = 5;

/** What the dev grant credits, per `shop.ts`. */
export const GRANT_GEO = 500;

/** The three tiers by id, cheapest first, with the price each states. */
export const PACK_PRICES: readonly { id: string; name: string; price: number }[] = [
  { id: 'level-1', name: 'Level 1', price: 100 },
  { id: 'level-2', name: 'Level 2', price: 250 },
  { id: 'level-3', name: 'Level 3', price: 500 },
];

/** Navigates to the Shop and waits for the storefront to be on screen. */
export async function openShop(page: Page): Promise<void> {
  await page.goto('/shop');
  await expect(page.locator('app-shop .ware')).toHaveCount(PACK_PRICES.length);
  await expect(purse(page)).toBeVisible();
}

/** The Geo purse: the amount, with the currency's mark beside it. */
export function purse(page: Page): Locator {
  return page.locator('[data-testid="purse"]');
}

/** The Geo mark inside a rendered amount — the icon that names the currency. */
export function geoMark(scope: Locator): Locator {
  return scope.locator('img.geo-mark');
}

/** The bought pack, sealed, in the opening's hero slot. */
export function sealedPack(page: Page): Locator {
  return page.locator('app-pack-opening [data-testid="sealed-pack"]');
}

/** The pack's declared minimum supported width, in CSS pixels. */
export const PACK_MIN_WIDTH = 120;

/**
 * One atomic reading of the opening's stage, so "the pack is shown before any
 * card" is checked as a single state rather than as two assertions the reveal
 * could run between.
 */
export async function openingStage(page: Page): Promise<{
  pack: boolean;
  packWidth: number;
  packName: string;
  heroCard: boolean;
  revealed: number;
}> {
  return page.evaluate(() => {
    const pack = document.querySelector('app-pack-opening [data-testid="sealed-pack"]');
    return {
      pack: pack !== null,
      packWidth: pack ? pack.getBoundingClientRect().width : 0,
      packName: pack?.querySelector('.pack-name')?.textContent?.trim() ?? '',
      heroCard: document.querySelector('app-pack-opening .hero-card') !== null,
      revealed: document.querySelectorAll('app-pack-opening .collected-card.is-revealed').length,
    };
  });
}

export async function purseValue(page: Page): Promise<number> {
  return Number((await purse(page).innerText()).trim());
}

/** Uses the development grant and waits for the purse to reflect it. */
export async function grantGeo(page: Page): Promise<void> {
  const before = await purseValue(page);
  await page.locator('[data-testid="grant"]').click();
  await expect(purse(page)).toHaveText(String(before + GRANT_GEO));
}

/**
 * Buys a pack and waits for the opening overlay. The overlay opens on the
 * sealed pack, so what is up when this returns is the wrapper, not a card.
 */
export async function buyPack(page: Page, id: string): Promise<void> {
  await page.locator(`[data-buy="${id}"]`).click();
  await expect(page.locator('app-pack-opening')).toBeVisible();
}

/** The collected row's five positions, revealed or not. */
export function collected(page: Page): Locator {
  return page.locator('app-pack-opening .collected-card');
}

/** Only the cards that have come to rest in the row. */
export function revealedCards(page: Page): Locator {
  return page.locator('app-pack-opening .collected-card.is-revealed');
}

/** The rarity of every revealed card, in the order the row holds them. */
export async function revealedRarities(page: Page): Promise<number[]> {
  return revealedCards(page).evaluateAll((els) =>
    els.map((el) => Number(el.getAttribute('data-stars'))),
  );
}

/** Waits out the reveal: every card in the row, and the closing control up. */
export async function openingSettled(page: Page): Promise<void> {
  await expect(revealedCards(page)).toHaveCount(PACK_SIZE);
  await expect(page.getByRole('button', { name: 'Return to the Shop' })).toBeVisible();
}

/**
 * Every named part of a surface is wholly on screen. The same half-pixel
 * tolerance as `expectNothingClipped`, and for the same reason: bounding boxes
 * are fractional and a scaled surface quantises.
 */
export async function expectPartsOnScreen(
  page: Page,
  size: Size,
  parts: Record<string, Locator>,
): Promise<void> {
  for (const [name, locator] of Object.entries(parts)) {
    const count = await locator.count();
    expect(count, `${name} is present at ${label(size)}`).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await locator.nth(i).boundingBox();
      expect(box, `${name}[${i}] has a bounding box at ${label(size)}`).not.toBeNull();
      const { x, y, width, height } = box!;
      expect(x, `${name}[${i}] left edge at ${label(size)}`).toBeGreaterThanOrEqual(-0.5);
      expect(y, `${name}[${i}] top edge at ${label(size)}`).toBeGreaterThanOrEqual(-0.5);
      expect(x + width, `${name}[${i}] right edge at ${label(size)}`).toBeLessThanOrEqual(
        size.width + 0.5,
      );
      expect(y + height, `${name}[${i}] bottom edge at ${label(size)}`).toBeLessThanOrEqual(
        size.height + 0.5,
      );
    }
  }
}

// ─── The Cards page ─────────────────────────────────────────────────────────

/** The card renderer's two width constants, as the card spec states them. */
export const CARD_MIN_WIDTH = 120;
export const CARD_ABILITY_GATE = 200;

/** A deck's positions, and the decks a player may hold. */
export const DECK_SIZE = 9;
export const MAX_DECKS = 9;

/** Navigates to the Cards page and waits for the collection to be on screen. */
export async function openCards(page: Page): Promise<void> {
  await page.goto('/cards');
  await expect(page.locator('app-collection-grid').first()).toBeVisible();
  await expect(collectionTiles(page).first()).toBeVisible();
}

/** The deck buttons, in the order the row lays them out. */
export function deckTabs(page: Page): Locator {
  return page.locator('app-deck-bar .deck-btn');
}

/** The button for one deck, by its full positional name. */
export function deckButton(page: Page, name: string): Locator {
  return page.locator('app-deck-bar').getByRole('button', { name, exact: true });
}

/** The selected deck's nine positions, filled or free. */
export function deckSlots(page: Page): Locator {
  return page.locator('app-deck-bar .slot');
}

/** Only the positions a card occupies. */
export function deckCards(page: Page): Locator {
  return page.locator('app-deck-bar .slot app-card');
}

/** One line of the selected deck's standing: what kind it is, and what it says. */
export interface StandingLine {
  readonly kind: 'invalid' | 'incomplete' | 'ready';
  readonly text: string;
}

/** The selected deck's standing, in the order the region states it. */
export async function deckStanding(page: Page): Promise<StandingLine[]> {
  return page.locator('app-deck-bar .deck-standing .standing-item').evaluateAll((els) =>
    els.map((el) => ({
      kind: (['invalid', 'incomplete', 'ready'] as const).find((k) =>
        el.classList.contains(`is-${k}`),
      )!,
      text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
    })),
  );
}

/** The deck controls, found by the names assistive technology announces. */
export function deckControls(page: Page): { create: Locator; remove: Locator; group: Locator } {
  return {
    create: page.getByRole('button', { name: 'New deck', exact: true }),
    remove: page
      .locator('app-deck-bar .deck-controls')
      .getByRole('button', { name: /^Delete Deck/ }),
    group: page.locator('app-deck-bar .deck-controls'),
  };
}

/**
 * Replaces the stored user and loads the Cards page on it. The app reads the
 * store once at start, so the record is written from a page that is already
 * up and then a fresh navigation picks it up.
 */
export async function openCardsAs(
  page: Page,
  user: {
    geo?: number;
    collection: { set: string; number: number; quantity: number }[];
    decks: { set: string; number: number }[][];
  },
): Promise<void> {
  await page.goto('/battle');
  await page.evaluate(
    (record) => localStorage.setItem('hollowmaster.user.v1', JSON.stringify(record)),
    { version: 2, geo: user.geo ?? 0, collection: user.collection, decks: user.decks },
  );
  await openCards(page);
}

/** One tile per distinct card the collection holds. */
export function collectionTiles(page: Page): Locator {
  return page.locator('app-collection-grid .tile');
}

/**
 * The held count a tile's badge states. With a deck selected the badge reads
 * `used / held`, and this is the held figure; with none it reads `×held`.
 */
export async function badgeCount(tile: Locator): Promise<number> {
  const badge = tile.locator('.badge');
  const held = badge.locator('.held');
  const text = (await held.count()) > 0 ? await held.innerText() : await badge.innerText();
  return Number(text.replace(/\D/g, ''));
}

/** The collection tile for the card of that name. */
export function tileNamed(page: Page, name: string): Locator {
  return collectionTiles(page).filter({
    has: page.locator('.cf-name-text', { hasText: new RegExp(`^${name}$`, 'i') }),
  });
}

/** The one open action menu, if any. */
export function openMenu(page: Page): Locator {
  return page.locator('app-card-menu');
}

/** Selects a card and waits for its menu, which is where its actions live. */
export async function openCardMenu(holder: Locator): Promise<Locator> {
  await holder.locator('app-card button').click();
  const menu = holder.locator('app-card-menu');
  await expect(menu).toBeVisible();
  return menu;
}

/**
 * Waits out the staggered entrances so a measurement or a screenshot reads the
 * screen at rest. Every tile and every position fades in; all of them at full
 * opacity is the whole page having arrived.
 */
export async function cardsSettled(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page
        .locator('app-collection-grid .tile, app-deck-bar .slot')
        .evaluateAll((els) => els.every((el) => getComputedStyle(el).opacity === '1')),
    )
    .toBe(true);
}

/** The measured width of the card a holder renders, not its declared track. */
export async function cardWidth(holder: Locator): Promise<number> {
  const box = await holder.locator('app-card').boundingBox();
  return box?.width ?? 0;
}

/**
 * The width a card is *laid out* at, which a viewing transform does not change.
 *
 * The deck region lays its positions out above the renderer's minimum and then
 * scales the whole region to fit, so the rendered box is smaller than the
 * layout on a narrow viewport. It is the layout the renderer's guarantees are
 * stated against — see the card spec — so that is what this reads.
 */
export async function laidOutCardWidth(holder: Locator): Promise<number> {
  return holder.locator('app-card').evaluate((el) => (el as HTMLElement).offsetWidth);
}

/** How much of the card the ability section occupies — zero below the gate. */
export async function abilitySectionWidth(holder: Locator): Promise<number> {
  const box = await holder.locator('app-card .cf-ability').boundingBox();
  return box?.width ?? 0;
}

/** Where the collection's sections and tiles start, measured against its left edge. */
export interface CollectionAlignment {
  /** The collection region's left edge: the grid's content box, inside its side padding. */
  edge: number;
  /** The first tile's left edge, whatever the order. */
  firstTile: number;
  /** Per rarity section: its label's left edge, its first tile's, and what is drawn before it. */
  sections: { label: number; firstTile: number; leadingRule: string }[];
}

/**
 * Measures the collection's left alignment. Measured at rest, so a tile's
 * entrance transform does not shift what is read; under reduced motion there is
 * no entrance to wait out.
 */
export async function collectionAlignment(page: Page): Promise<CollectionAlignment> {
  await cardsSettled(page);
  return page.locator('app-collection-grid').evaluate((host) => {
    const grid = host.querySelector('.grid')!;
    const edge = grid.getBoundingClientRect().left + parseFloat(getComputedStyle(grid).paddingLeft);
    const left = (el: Element) => el.getBoundingClientRect().left;
    return {
      edge,
      firstTile: left(host.querySelector('.tile')!),
      sections: [...host.querySelectorAll('.rarity-section')].map((section) => {
        const head = section.querySelector('.section-head')!;
        return {
          label: left(head.firstElementChild!),
          firstTile: left(section.querySelector('.tile')!),
          leadingRule: getComputedStyle(head, '::before').content,
        };
      }),
    };
  });
}

/** Asserts the collection is left aligned: every section head and first tile on one edge. */
export async function expectCollectionLeftAligned(page: Page): Promise<CollectionAlignment> {
  const aligned = await collectionAlignment(page);
  expect(Math.abs(aligned.firstTile - aligned.edge)).toBeLessThanOrEqual(1);
  for (const section of aligned.sections) {
    expect(Math.abs(section.label - aligned.edge)).toBeLessThanOrEqual(1);
    expect(Math.abs(section.firstTile - aligned.edge)).toBeLessThanOrEqual(1);
    // No rule ahead of the label.
    expect(section.leadingRule).toBe('none');
  }
  return aligned;
}
