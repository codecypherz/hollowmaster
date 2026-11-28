import { expect, test } from '@playwright/test';
import {
  PACK_SIZE,
  addButton,
  buyPack,
  cartControl,
  cartDialog,
  collected,
  collectionTiles,
  deckCards,
  deckSlots,
  deckTabs,
  exchangeRates,
  exchangeRow,
  exchangeTile,
  exchangeTiles,
  expectCollectionLeftAligned,
  expectNoScroll,
  expectNothingClipped,
  grantGeo,
  openCollectionAs,
  openDecks,
  openDecksAs,
  openDeckSelect,
  openShop,
  purseButton,
  readCard,
  revealedCards,
  revealedRarities,
  rosaryPurse,
  READY_STARTER_USER,
  cellToPlay,
  clashLayer,
  playableHandCard,
  playUntil,
  seedRandom,
  startMatch,
  storeUser,
  type Size,
  yourTurn,
} from './helpers';

/**
 * This spec runs only in the `reduced-motion` project, which expresses the
 * preference through the browser — see `playwright.config.ts`.
 */
const VIEWPORT: Size = { width: 1440, height: 900 };

/** A seed whose match fights a combat by the third card down; see `seedRandom`. */
const COMBAT_SEED = 2;

test('a card can be played, and the screen still fits, under reduced motion', async ({ page }) => {
  // The browser is honouring the preference for this project.
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  await page.setViewportSize(VIEWPORT);
  await startMatch(page);

  // The opponent may move first; play only once it is our turn, into a cell
  // that is still empty.
  await yourTurn(page);
  const cell = await cellToPlay(page);
  await expect(cell).toHaveClass(/cell-empty/);

  // Choose a card, then the cell to play it into.
  await playableHandCard(page).click();
  await expect(cell).toHaveClass(/cell-placeable/);
  await cell.click();

  // The post-placement state is reached with the motion suppressed: the card is
  // on the board, and the position it came from is empty.
  await expect(cell).toHaveClass(/cell-occupied/);
  await expect(cell.locator('app-card')).toBeVisible();
  await expect(page.locator('app-game .rack-player .slot-empty')).toHaveCount(1);

  // And the fit still holds around it.
  await expectNoScroll(page);
  await expectNothingClipped(page, VIEWPORT);
});

test('a combat is drawn finished, rolls and powers and victor, under reduced motion', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize(VIEWPORT);
  await seedRandom(page, COMBAT_SEED);
  await startMatch(page);
  await playUntil(page, 'clash');

  const clash = clashLayer(page);
  // Nothing in the clash animates: it is in its finished state from the start.
  const moving = await clash.evaluate(
    (root) =>
      [root, ...root.querySelectorAll('*')].filter(
        (el) => getComputedStyle(el).animationName !== 'none',
      ).length,
  );
  expect(moving).toBe(0);

  // Both sides' roll and power, and the victor, are all legible at once.
  const rolls = clash.locator('.fighter-roll');
  await expect(rolls).toHaveCount(2);
  for (const roll of await rolls.all()) {
    await expect(roll).toBeVisible();
    await expect(roll).toHaveText(/^(Roll \d+|Carried)$/);
  }
  const powers = clash.locator('.fighter-power');
  for (const power of await powers.all()) {
    await expect(power).toBeVisible();
    await expect(power).toHaveText(/^(\d+|WIN|FAIL)$/);
    expect(await power.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  }
  await expect(clash.locator('.fighter-victor', { hasText: 'Victor' })).toHaveCount(1);
  await expect(clash.locator('.fighter-victor', { hasText: 'Victor' })).toBeVisible();
  await expect(clash.locator('.fighter-role')).toHaveText(['ATK', 'DEF']);

  await page.screenshot({ path: test.info().outputPath('clash-reduced-motion.png') });
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

test('the Decks page presents its cards and reader without animation', async ({ page }) => {
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
  await addButton(tile).click();
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
  const reader = await readCard(deckSlots(page).first());
  expect(
    await reader.locator('.reader-panel').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await expect(reader.locator('.cf-ability-text')).toBeVisible();
  await page.keyboard.press('Escape');

  // And every state the motion would have carried is still distinguishable:
  // the selected deck button, the unavailable add, and the card's place in the
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

  const adds = await page.locator('app-collection-grid .add').evaluateAll((els) =>
    els.map((el) => ({
      unavailable: el.getAttribute('aria-disabled') === 'true',
      opacity: getComputedStyle(el).opacity,
      outline: getComputedStyle(el).borderTopStyle,
      transition: getComputedStyle(el).transitionDuration,
    })),
  );
  const off = adds.find((add) => add.unavailable)!;
  const on = adds.find((add) => !add.unavailable)!;
  expect(off.opacity).not.toBe(on.opacity);
  expect(off.outline).not.toBe(on.outline);
  expect(new Set(adds.map((add) => add.transition))).toEqual(new Set(['0s']));
  await expect(deckCards(page)).toHaveCount(1);
  await expect(page.locator('app-deck-bar .slot-empty')).toHaveCount(8);

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
  // Starters, one two-star card, and False Knight: three rarity sections.
  await openDecksAs(page, {
    collection: [1, 3, 5, 2, 9, 11, 12, 13, 14, 7, 17].map((number) => ({
      set: 'FC',
      number,
      quantity: 1,
    })),
    decks: [[]],
  });
  const aligned = await expectCollectionLeftAligned(page);
  expect(aligned.sections).toHaveLength(3);
});

test('the Collection page presents its tiles, cart, and purse without animation', async ({
  page,
}) => {
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  await page.setViewportSize(VIEWPORT);
  await openCollectionAs(page, {
    rosaries: 50,
    collection: [1, 3, 5, 2, 9, 11, 12, 13, 14].map((number) => ({
      set: 'FC',
      number,
      quantity: number === 3 ? 3 : 1,
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
  for (const corner of [page.locator('app-collection .purse'), cartControl(page)]) {
    const still = await corner.evaluate((el) => {
      const { animationName, opacity, transitionDuration } = getComputedStyle(el);
      return { animationName, opacity, transitionDuration };
    });
    expect(still).toEqual({ animationName: 'none', opacity: '1', transitionDuration: '0s' });
  }

  // Every treatment the motion might have carried is still there.
  const crawlid = exchangeTile(page, 'FC', 1);
  const vengefly = exchangeTile(page, 'FC', 3);
  const gruzMother = exchangeTile(page, 'FC', 6);
  await expect(vengefly.locator('.badge')).toHaveAccessibleName('3 held');
  await expect(gruzMother.locator('.badge')).toHaveAccessibleName('Not owned');
  await expect(gruzMother.locator('.veil')).toBeVisible();
  const unowned = exchangeRow(gruzMother, 'sell');
  await expect(unowned.raise).toHaveAttribute('aria-disabled', 'true');
  await expect(unowned.raise).toHaveAttribute('title', 'You hold none to sell');
  const controls = await exchangeRow(gruzMother, 'buy')
    .row.locator('button')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).transitionDuration));
  expect(new Set(controls)).toEqual(new Set(['0s']));

  // A pending quantity, its warning, and the cart's count settle at once.
  await exchangeRow(crawlid, 'sell').raise.click();
  await expect(exchangeRow(crawlid, 'sell').value).toHaveValue('1');
  await expect(exchangeRow(crawlid, 'sell').warning).toBeVisible();
  await exchangeRow(vengefly, 'sell').raise.click();
  await expect(cartControl(page)).toHaveAccessibleName('Cart, 2 cards pending');
  await expect(vengefly.locator('.badge')).toHaveAccessibleName('3 held');

  // The dialog is there, and then not, with nothing in between.
  await cartControl(page).click();
  const dialog = cartDialog(page);
  await expect(dialog).toBeVisible();
  for (const part of [dialog, page.locator('app-cart-dialog .cart-scrim')]) {
    const still = await part.evaluate((el) => ({
      animation: getComputedStyle(el).animationName,
      opacity: getComputedStyle(el).opacity,
    }));
    expect(still).toEqual({ animation: 'none', opacity: '1' });
  }
  await expect(dialog.locator('.line-warning')).toBeVisible();
  await dialog.locator('.cart-confirm').click();
  await expect(dialog).toHaveCount(0);
  await expect(vengefly.locator('.badge')).toHaveAccessibleName('2 held');
  await expect(rosaryPurse(page)).toHaveText('52');

  // So are the exchange rates, and the card being read.
  await purseButton(page).click();
  const rates = exchangeRates(page);
  await expect(rates).toBeVisible();
  expect(
    await rates.evaluate((el) => {
      const { animationName, opacity } = getComputedStyle(el);
      return { animationName, opacity };
    }),
  ).toEqual({ animationName: 'none', opacity: '1' });
  expect(
    await page
      .locator('app-collection .purse-chevron')
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s');
  await page.keyboard.press('Escape');
  await expect(rates).toBeHidden();

  const reader = await readCard(gruzMother);
  expect(
    await reader.locator('.reader-panel').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await page.keyboard.press('Escape');
  await expect(reader).toHaveCount(0);
});

test('deck selection renders finished, with every deck, position, and control at once', async ({
  page,
}) => {
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  await page.setViewportSize(VIEWPORT);
  await storeUser(page, {
    ...READY_STARTER_USER,
    decks: [...READY_STARTER_USER.decks, []],
  });
  await openDeckSelect(page);

  // Read in one pass, straight after arrival: nothing is waited out, so
  // anything still entering would be caught part-way.
  const parts = await page.evaluate(() => {
    const read = (el: Element) => {
      const style = getComputedStyle(el);
      return {
        opacity: style.opacity,
        animation: style.animationName,
        visible: el.getBoundingClientRect().width > 0,
        // A deck that is not Ready is dimmed at rest, on purpose.
        dimmed: el.classList.contains('is-disabled'),
      };
    };
    const select = (selector: string) => [...document.querySelectorAll(selector)].map(read);
    return {
      buttons: select('app-deck-select .deck-btn'),
      slots: select('app-deck-select .slot'),
      begin: select('app-deck-select button.begin'),
    };
  });

  expect(parts.buttons).toHaveLength(2);
  expect(parts.slots).toHaveLength(9);
  expect(parts.begin).toHaveLength(1);
  for (const part of [...parts.buttons, ...parts.slots, ...parts.begin]) {
    expect(part.visible).toBe(true);
    expect(part.opacity).toBe(part.dimmed ? '0.45' : '1');
    expect(part.animation).toBe('none');
  }
  expect(parts.buttons.map((b) => b.dimmed)).toEqual([false, true]);

  await expectNoScroll(page);
});
