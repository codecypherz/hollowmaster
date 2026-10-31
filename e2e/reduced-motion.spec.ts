import { expect, test } from '@playwright/test';
import {
  PACK_SIZE,
  buyPack,
  collected,
  collectionTiles,
  deckCards,
  deckSlots,
  deckTabs,
  expectCollectionLeftAligned,
  expectNoScroll,
  expectNothingClipped,
  grantGeo,
  exchangeTile,
  exchangeTiles,
  openCardMenu,
  openCollectionAs,
  rosaryPurse,
  openDecks,
  openDecksAs,
  openShop,
  revealedCards,
  revealedRarities,
  startMatch,
  type Size,
} from './helpers';

/**
 * This spec runs only in the `reduced-motion` project, which expresses the
 * preference through the browser — see `playwright.config.ts`.
 */
const VIEWPORT: Size = { width: 1440, height: 900 };

test('a card can be played, and the screen still fits, under reduced motion', async ({ page }) => {
  // The browser is honouring the preference for this project.
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  await page.setViewportSize(VIEWPORT);
  await startMatch(page);

  const centre = page.locator('app-game .board-cell[data-cell="2-2"]');
  await expect(centre).toHaveClass(/cell-empty/);

  // Choose a card, then the cell to play it into.
  await page.locator('app-game .rack-player .slot app-card .frame').first().click();
  await expect(centre).toHaveClass(/cell-placeable/);
  await centre.click();

  // The post-placement state is reached with the motion suppressed: the card is
  // on the board, and the position it came from is empty.
  await expect(centre).toHaveClass(/cell-occupied/);
  await expect(centre.locator('app-card')).toBeVisible();
  await expect(page.locator('app-game .rack-player .slot-empty')).toHaveCount(1);

  // And the fit still holds around it.
  await expectNoScroll(page);
  await expectNothingClipped(page, VIEWPORT);
});

test('a pack opens without animated arrival, and still reads as rare', async ({ page }) => {
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  await page.setViewportSize(VIEWPORT);
  await openShop(page);
  await grantGeo(page);
  await buyPack(page, 'level-3');

  // The preference collapses the sequence: the result is present at once
  // rather than arriving over five staged beats.
  await expect(revealedCards(page)).toHaveCount(PACK_SIZE);
  await expect(page.getByRole('button', { name: 'Return to the Shop' })).toBeVisible();

  // The same common-to-rare order the animated sequence would have used.
  const rarities = await revealedRarities(page);
  expect(rarities).toHaveLength(PACK_SIZE);
  for (let i = 1; i < rarities.length; i++) {
    expect(rarities[i]).toBeGreaterThanOrEqual(rarities[i - 1]);
  }

  // Nothing is animating, and nothing is mid-transition.
  const animating = await collected(page).evaluateAll((els) =>
    els.map((el) => {
      const style = getComputedStyle(el.querySelector('.card-reveal')!);
      return {
        animation: style.animationName,
        transition: style.transitionDuration,
        opacity: style.opacity,
      };
    }),
  );
  for (const card of animating) {
    expect(card.animation).toBe('none');
    expect(Number.parseFloat(card.transition)).toBe(0);
    expect(card.opacity).toBe('1');
  }

  // The rarity emphasis is not carried by the motion, so removing the motion
  // leaves it: every card still states its rarity and still carries its glow.
  const emphasis = await collected(page).evaluateAll((els) =>
    els.map((el) => ({
      stars: el.getAttribute('data-stars'),
      klass: el.className,
      label: el.querySelector('.rarity-label')?.textContent?.trim() ?? '',
      glow: getComputedStyle(el.querySelector('.card-reveal')!).filter,
    })),
  );
  for (const card of emphasis) {
    expect(card.klass).toContain(`rarity-${card.stars}`);
    expect(card.label).toBe(`${card.stars}-star`);
    expect(card.glow).not.toBe('none');
  }

  // And the surface still fits.
  await expectNoScroll(page);
});

test('a pack keeps a still foil highlight with the travel taken away', async ({ page }) => {
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  await page.setViewportSize(VIEWPORT);
  await page.goto('/style-guide');
  await expect(page.locator('app-pack').first()).toBeVisible();

  // The sheen settles rather than disappearing: the face still reads as foil,
  // it is simply no longer lit from a moving source.
  const sheens = await page.locator('app-pack').evaluateAll((els) =>
    els.map((el) => {
      const sheen = el.querySelector('.pack-sheen') as HTMLElement;
      const style = getComputedStyle(sheen);
      const face = el.querySelector('.wrapper')!.getBoundingClientRect();
      const box = sheen.getBoundingClientRect();
      return {
        animation: style.animationName,
        opacity: Number.parseFloat(style.opacity),
        highlight: style.backgroundImage,
        width: box.width,
        // The still highlight rests on the face rather than off its edge.
        onFace: box.right > face.left && box.left < face.right,
      };
    }),
  );

  expect(sheens.length).toBeGreaterThan(0);
  for (const sheen of sheens) {
    expect(sheen.animation).toBe('none');
    expect(sheen.opacity).toBeGreaterThan(0);
    expect(sheen.width).toBeGreaterThan(0);
    expect(sheen.onFace).toBe(true);
    expect(sheen.highlight).toContain('gradient');
  }
});

test('the Decks page presents its cards, menus, and reader without animation', async ({ page }) => {
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  await page.setViewportSize(VIEWPORT);
  await openDecks(page);
  await page.getByRole('button', { name: 'New deck', exact: true }).click();
  await expect(deckTabs(page)).toHaveCount(2);

  // The collection is present at once rather than arriving over a stagger.
  const arriving = await collectionTiles(page).evaluateAll((els) =>
    els.map((el) => {
      const style = getComputedStyle(el);
      return { animation: style.animationName, opacity: style.opacity };
    }),
  );
  expect(arriving.length).toBeGreaterThan(0);
  for (const tile of arriving) {
    expect(tile.animation).toBe('none');
    expect(tile.opacity).toBe('1');
  }

  // The card takes its place in the deck without travelling there.
  const tile = collectionTiles(page).first();
  await openCardMenu(tile);
  const menu = await page.locator('app-card-menu .menu').evaluate((el) => ({
    animation: getComputedStyle(el).animationName,
    opacity: getComputedStyle(el).opacity,
  }));
  expect(menu.animation).toBe('none');
  expect(menu.opacity).toBe('1');

  await page.getByRole('button', { name: 'Add to Deck 2' }).click();
  await expect(deckCards(page)).toHaveCount(1);
  const placed = await deckSlots(page)
    .first()
    .evaluate((el) => ({
      animation: getComputedStyle(el).animationName,
      opacity: getComputedStyle(el).opacity,
    }));
  expect(placed.animation).toBe('none');
  expect(placed.opacity).toBe('1');

  // The reader opens without animation, and still reads.
  await openCardMenu(deckSlots(page).first());
  await page.getByRole('button', { name: 'Read' }).click();
  const reader = page.locator('app-card-reader');
  await expect(reader).toBeVisible();
  expect(
    await reader.locator('.reader-panel').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await expect(reader.locator('.cf-ability-text')).toBeVisible();
  await page.keyboard.press('Escape');

  // And every state the motion would have carried is still distinguishable:
  // the selected deck button, the selected card, and the card's place in the
  // deck. The selected button's face — filled and heavier — is not motion.
  const faces = await deckTabs(page).evaluateAll((els) =>
    els.map((el) => ({
      pressed: el.getAttribute('aria-pressed'),
      weight: getComputedStyle(el).fontWeight,
      ground: getComputedStyle(el).backgroundColor,
    })),
  );
  const selected = faces.find((f) => f.pressed === 'true')!;
  const other = faces.find((f) => f.pressed === 'false')!;
  expect(selected.weight).not.toBe(other.weight);
  expect(selected.ground).not.toBe(other.ground);

  await openCardMenu(tile);
  await expect(tile.locator('app-card button')).toHaveAttribute('aria-pressed', 'true');
  await expect(deckCards(page)).toHaveCount(1);
  await expect(page.locator('app-deck-bar .slot-empty')).toHaveCount(8);
  await page.keyboard.press('Escape');

  // A reorder is immediate: the tiles are in their new order with nothing
  // running on any of them.
  await page
    .locator('.sort-options')
    .getByRole('button', { name: /^Name\b/ })
    .click();
  await expect(page.locator('.sort-option.is-active')).toHaveText(/^\s*Name\b/);
  const moving = await collectionTiles(page).evaluateAll((els) =>
    els.map((el) => ({
      animations: el.getAnimations().length,
      opacity: getComputedStyle(el).opacity,
    })),
  );
  expect(moving.length).toBeGreaterThan(0);
  for (const tile of moving) expect(tile).toEqual({ animations: 0, opacity: '1' });

  await expectNoScroll(page);
});

test('the Decks page is left aligned under reduced motion as it is otherwise', async ({ page }) => {
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  await page.setViewportSize(VIEWPORT);
  // Starters, one two-star card, and Goam: three rarity sections.
  await openDecksAs(page, {
    collection: [1, 7, 8, 9, 10, 11, 12, 13, 14, 4, 6].map((number) => ({
      set: 'FC',
      number,
      quantity: 1,
    })),
    decks: [[]],
  });
  const aligned = await expectCollectionLeftAligned(page);
  expect(aligned.sections).toHaveLength(3);
});

test('the Collection page presents its tiles and purse without animation', async ({ page }) => {
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  await page.setViewportSize(VIEWPORT);
  await openCollectionAs(page, {
    rosaries: 50,
    collection: [1, 7, 8, 9, 10, 11, 12, 13, 14].map((number) => ({
      set: 'FC',
      number,
      quantity: number === 7 ? 3 : 1,
    })),
    decks: [[{ set: 'FC', number: 1 }]],
  });

  // Every tile and the purse are at rest at once rather than arriving.
  const arriving = await exchangeTiles(page).evaluateAll((els) =>
    els.map((el) => ({
      animation: getComputedStyle(el).animationName,
      opacity: getComputedStyle(el).opacity,
    })),
  );
  expect(arriving.length).toBeGreaterThan(0);
  for (const tile of arriving) {
    expect(tile.animation).toBe('none');
    expect(tile.opacity).toBe('1');
  }
  await expect(rosaryPurse(page)).toHaveText('50');
  const purse = await page.locator('app-collection .purse').evaluate((el) => ({
    animation: getComputedStyle(el).animationName,
    opacity: getComputedStyle(el).opacity,
  }));
  expect(purse).toEqual({ animation: 'none', opacity: '1' });

  // Every treatment the motion might have carried is still there.
  const crawlid = exchangeTile(page, 'FC', 1);
  const vengefly = exchangeTile(page, 'FC', 7);
  const gruzMother = exchangeTile(page, 'FC', 2);
  await expect(vengefly.locator('.badge')).toHaveAccessibleName('3 held');
  await expect(gruzMother.locator('.badge')).toHaveAccessibleName('Not owned');
  await expect(gruzMother.locator('.veil')).toBeVisible();
  await expect(crawlid.locator('button.sell .warn-mark')).toBeVisible();
  await expect(gruzMother.locator('button.buy')).toHaveAttribute('aria-disabled', 'true');
  await expect(gruzMother.locator('button.buy')).toHaveAttribute('title', 'Not enough Rosaries');

  // A count changing settles at once, too.
  await vengefly.locator('button.sell').click();
  await expect(vengefly.locator('.badge')).toHaveAccessibleName('2 held');
  await expect(rosaryPurse(page)).toHaveText('60');
});
