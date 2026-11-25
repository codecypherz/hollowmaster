import { addSixStarCard } from '../testing/six-star';
import { CARD_BY_KEY, CARD_DB, Card, CardKey, cardKey, cardKeyOf } from './card';
import { Deck } from './deck';
import {
  OrderLine,
  ROSARY_RATES,
  SECRET_RATE_PEAK,
  assertRosaryRates,
  decksTrimmedBySale,
  knowsRate,
  purchasePrice,
  rosariesText,
  rosaryEffect,
  rosaryRates,
  salePrice,
  settleOrder,
} from './exchange';
import { UserState, distinctCards, quantityOf, seedUser, withMilestones } from './user';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!; // one star
const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 7))!;
const gruzzer = CARD_BY_KEY.get(cardKeyOf('FC', 8))!;
const fourStar = CARD_DB.find((card) => card.stars === 4)!;
const twoStar = CARD_DB.find((card) => card.stars === 2)!;

function user(rosaries: number, holdings: [CardKey, number][] = [], decks: Deck[] = []): UserState {
  return withMilestones({
    ...seedUser(),
    geo: 55,
    rosaries,
    collection: new Map(holdings),
    decks,
  });
}

describe('Rosary prices', () => {
  it('are the stated rate of each rarity', () => {
    expect(ROSARY_RATES).toEqual({
      1: { sell: 1, buy: 4 },
      2: { sell: 3, buy: 12 },
      3: { sell: 9, buy: 27 },
      4: { sell: 33, buy: 99 },
      5: { sell: 330, buy: 660 },
      6: { sell: 5000, buy: 9999 },
    });
    expect(crawlid.stars).toBe(1);
    expect(salePrice(crawlid)).toBe(1);
    expect(purchasePrice(crawlid)).toBe(4);
    expect(salePrice(fourStar)).toBe(33);
    expect(purchasePrice(fourStar)).toBe(99);
  });

  it('sell for less than they cost, at every rating', () => {
    for (const { sell, buy } of Object.values(ROSARY_RATES)) expect(sell).toBeLessThan(buy);
  });

  it('reject a table that is missing a rating, fractional, or sells too high', () => {
    expect(() => assertRosaryRates(ROSARY_RATES)).not.toThrow();
    const { 6: _, ...missing } = ROSARY_RATES;
    expect(() => assertRosaryRates(missing)).toThrow();
    expect(() => assertRosaryRates({ ...ROSARY_RATES, 2: { sell: 1.5, buy: 12 } })).toThrow();
    expect(() => assertRosaryRates({ ...ROSARY_RATES, 2: { sell: 12, buy: 12 } })).toThrow();
  });

  it('are worded with the singular', () => {
    expect([0, 1, 4].map(rosariesText)).toEqual(['0 Rosaries', '1 Rosary', '4 Rosaries']);
  });

  it('never pay more to sell than they cost to buy, for any catalogued card', () => {
    for (const card of CARD_DB) {
      expect(Number.isInteger(salePrice(card))).toBe(true);
      expect(Number.isInteger(purchasePrice(card))).toBe(true);
      expect(salePrice(card)).toBeLessThan(purchasePrice(card));
    }
  });
});

const sell = (card: Card, quantity: number): OrderLine => ({
  key: cardKey(card),
  action: 'sell',
  quantity,
});
const buy = (card: Card, quantity: number): OrderLine => ({
  key: cardKey(card),
  action: 'buy',
  quantity,
});

describe('the effect of a line on the balance', () => {
  it('rises by the sale price and falls by the purchase price, per copy', () => {
    expect(rosaryEffect(twoStar, 'sell', 3)).toBe(9);
    expect(rosaryEffect(crawlid, 'buy', 2)).toBe(-8);
  });
});

describe('an order of purchases', () => {
  it('spends exactly the balance when it is the price', () => {
    const next = settleOrder(user(4), [buy(crawlid, 1)])!;
    expect(next).not.toBeNull();
    expect(next.rosaries).toBe(0);
    expect(quantityOf(next.collection, crawlid)).toBe(1);
  });

  it('adds every further copy of a card already held, at once', () => {
    const next = settleOrder(user(20, [[cardKey(crawlid), 2]]), [buy(crawlid, 3)])!;
    expect(quantityOf(next.collection, crawlid)).toBe(5);
    expect(next.rosaries).toBe(8);
  });

  it('is refused, changing nothing, when the balance is short', () => {
    const state = user(98);
    expect(settleOrder(state, [buy(fourStar, 1)])).toBeNull();
    expect(state.rosaries).toBe(98);
    expect(state.collection.size).toBe(0);
  });

  it('leaves Geo and the decks alone', () => {
    const decks = [{ cards: [cardKey(vengefly)] }];
    const next = settleOrder(user(100, [[cardKey(vengefly), 1]], decks), [buy(crawlid, 1)])!;
    expect(next.geo).toBe(55);
    expect(next.decks).toBe(decks);
  });
});

describe('an order of sales', () => {
  it('removes several copies and credits each of them', () => {
    const next = settleOrder(user(0, [[cardKey(twoStar), 3]]), [sell(twoStar, 2)])!;
    expect(quantityOf(next.collection, twoStar)).toBe(1);
    expect(next.rosaries).toBe(6);
  });

  it('un-owns a card when every copy goes', () => {
    const state = user(0, [
      [cardKey(crawlid), 2],
      [cardKey(vengefly), 1],
    ]);
    const next = settleOrder(state, [sell(crawlid, 2)])!;
    expect(quantityOf(next.collection, crawlid)).toBe(0);
    expect(next.collection.has(cardKey(crawlid))).toBe(false);
    expect(distinctCards(next.collection)).toBe(1);
  });

  it('is refused whole when it sells more of a card than are held', () => {
    const decks = [{ cards: [cardKey(crawlid)] }];
    const state = user(500, [[cardKey(crawlid), 1]], decks);
    for (const order of [
      [sell(crawlid, 2), buy(vengefly, 1)],
      [buy(vengefly, 1), sell(crawlid, 2)],
      [sell(gruzzer, 1)],
    ]) {
      expect(settleOrder(state, order)).toBeNull();
    }
    expect(state.rosaries).toBe(500);
    expect(state.decks).toBe(decks);
    expect(quantityOf(state.collection, crawlid)).toBe(1);
  });

  it('leaves Geo unchanged', () => {
    const next = settleOrder(user(0, [[cardKey(crawlid), 1]]), [sell(crawlid, 1)])!;
    expect(next.geo).toBe(55);
  });

  it('trims the decks the sale leaves over the quantity, and only those', () => {
    const c = cardKey(crawlid);
    const v = cardKey(vengefly);
    const g = cardKey(gruzzer);
    const decks = [{ cards: [c, v] }, { cards: [v, g] }, { cards: [g, c] }];
    const next = settleOrder(user(0, [[c, 1]], decks), [sell(crawlid, 1)])!;
    expect(next.decks[0].cards).toEqual([v]);
    expect(next.decks[1]).toBe(decks[1]);
    expect(next.decks[2].cards).toEqual([g]);
  });

  it('trims a deck once for each card sold out of it', () => {
    const c = cardKey(crawlid);
    const v = cardKey(vengefly);
    const state = user(
      0,
      [
        [c, 1],
        [v, 2],
      ],
      [{ cards: [c, v, v] }],
    );
    const next = settleOrder(state, [sell(crawlid, 1), sell(vengefly, 1)])!;
    expect(next.decks[0].cards).toEqual([v]);
  });
});

describe('a mixed order', () => {
  const held: [CardKey, number][] = [[cardKey(crawlid), 1]];

  it('lets its sales pay for its purchases, in either order of lines', () => {
    for (const order of [
      [sell(crawlid, 1), buy(vengefly, 1)],
      [buy(vengefly, 1), sell(crawlid, 1)],
    ]) {
      const next = settleOrder(user(3, held), order)!;
      expect(next.rosaries).toBe(0);
      expect(quantityOf(next.collection, crawlid)).toBe(0);
      expect(quantityOf(next.collection, vengefly)).toBe(1);
    }
  });

  it('is refused whole when its net exceeds the balance, though its sales alone could apply', () => {
    const state = user(2, held);
    expect(settleOrder(state, [sell(crawlid, 1), buy(vengefly, 1)])).toBeNull();
    expect(state.rosaries).toBe(2);
    expect(quantityOf(state.collection, crawlid)).toBe(1);
  });

  it('is refused when it names a card twice, in either direction', () => {
    const state = user(1000, [[cardKey(crawlid), 5]]);
    expect(settleOrder(state, [sell(crawlid, 1), buy(crawlid, 1)])).toBeNull();
    expect(settleOrder(state, [sell(crawlid, 1), sell(crawlid, 1)])).toBeNull();
    expect(settleOrder(state, [buy(crawlid, 1), buy(crawlid, 1)])).toBeNull();
  });

  it('is refused for a quantity that is not a whole number of at least one', () => {
    const state = user(1000, [[cardKey(crawlid), 5]]);
    for (const quantity of [0, -1, 1.5, NaN, Infinity]) {
      expect(settleOrder(state, [sell(crawlid, quantity)]), `${quantity}`).toBeNull();
      expect(settleOrder(state, [buy(crawlid, quantity)]), `${quantity}`).toBeNull();
    }
  });

  it('is refused for a card the catalogue does not hold', () => {
    const key = cardKeyOf('FC', 999);
    expect(settleOrder(user(1000), [{ key, action: 'buy', quantity: 1 }])).toBeNull();
  });
});

describe('the decks a sale would trim', () => {
  const c = cardKey(crawlid);
  const v = cardKey(vengefly);

  it('are exactly the decks selling that many then changes', () => {
    const cases: [number, Deck[]][] = [
      [1, [{ cards: [c] }, { cards: [v] }, { cards: [v, c] }]],
      [2, [{ cards: [c, c] }, { cards: [c] }, { cards: [] }]],
      [3, [{ cards: [c, c] }, { cards: [v] }]],
      [1, []],
    ];
    for (const [held, decks] of cases) {
      const state = user(0, [[c, held]], decks);
      for (const quantity of [1, 2].filter((n) => n <= held)) {
        const sold = settleOrder(state, [sell(crawlid, quantity)])!;
        const changed = sold.decks.flatMap((deck, i) => (deck === state.decks[i] ? [] : [i]));
        expect(decksTrimmedBySale(state, crawlid, quantity)).toEqual(changed);
      }
    }
  });

  it('names Deck 1 and Deck 3 for the only copy they both use', () => {
    const state = user(0, [[c, 1]], [{ cards: [c] }, { cards: [v] }, { cards: [c, v] }]);
    expect(decksTrimmedBySale(state, crawlid, 1)).toEqual([0, 2]);
  });

  it('follow the quantity: none while copies remain for every deck', () => {
    const state = user(0, [[c, 3]], [{ cards: [c, c] }]);
    expect(decksTrimmedBySale(state, crawlid, 1)).toEqual([]);
    expect(decksTrimmedBySale(state, crawlid, 2)).toEqual([0]);
  });

  it('are none for a sale that could not happen', () => {
    const state = user(0, [[c, 1]], [{ cards: [c] }]);
    expect(decksTrimmedBySale(state, crawlid, 0)).toEqual([]);
    expect(decksTrimmedBySale(state, crawlid, 2)).toEqual([]);
    expect(decksTrimmedBySale(user(0, [], [{ cards: [c] }]), crawlid, 1)).toEqual([]);
  });
});

describe('whether a rate is known', () => {
  const peaking = (peakRosaries: number, rarestHeld = 5): UserState => ({
    ...user(0),
    milestones: { peakRosaries, rarestHeld },
  });

  it('is so for rarities 1 to 5 from the start, and not for 6', () => {
    const known = [1, 2, 3, 4, 5, 6].map((stars) => knowsRate(seedUser(), stars));
    expect(known).toEqual([true, true, true, true, true, false]);
  });

  it('turns on having held 9999 Rosaries, even once they are spent', () => {
    expect(SECRET_RATE_PEAK).toBe(9999);
    expect(knowsRate(peaking(9998), 6)).toBe(false);
    expect(knowsRate(peaking(9999), 6)).toBe(true);
    expect(knowsRate(user(9999), 6)).toBe(true);
    expect(knowsRate(withMilestones({ ...user(9999), rosaries: 0 }), 6)).toBe(true);
  });

  it('turns on having held a six-star card, even once it is sold', () => {
    const six = addSixStarCard();
    const holding = user(0, [[cardKey(six), 1]]);
    expect(knowsRate(holding, 6)).toBe(true);
    const sold = settleOrder({ ...holding, rosaries: 0 }, [sell(six, 1)])!;
    expect(quantityOf(sold.collection, six)).toBe(0);
    // The milestone alone, with the sale's own 5000 short of the other.
    expect(knowsRate(withMilestones(sold), 6)).toBe(true);
  });

  it('decides which rates are listed', () => {
    expect(rosaryRates(seedUser())).toEqual([
      { stars: 1, sell: 1, buy: 4 },
      { stars: 2, sell: 3, buy: 12 },
      { stars: 3, sell: 9, buy: 27 },
      { stars: 4, sell: 33, buy: 99 },
      { stars: 5, sell: 330, buy: 660 },
    ]);
    expect(rosaryRates(peaking(9999))).toHaveLength(6);
    expect(rosaryRates(peaking(9999)).at(-1)).toEqual({ stars: 6, sell: 5000, buy: 9999 });
  });

  it('refuses a purchase until it is known, though sales in the order would pay for it', () => {
    const six = addSixStarCard();
    const held: [CardKey, number][] = [[cardKey(fourStar), 400]];
    const order = [sell(fourStar, 400), buy(six, 1)];
    const state = user(0, held);
    expect(settleOrder(state, order)).toBeNull();
    expect(state.rosaries).toBe(0);
    expect(quantityOf(state.collection, fourStar)).toBe(400);

    const knowing = { ...state, milestones: { peakRosaries: 9999, rarestHeld: 4 } };
    const next = settleOrder(knowing, order)!;
    expect(quantityOf(next.collection, six)).toBe(1);
    expect(next.rosaries).toBe(400 * 33 - 9999);
  });
});

describe('the Rosary balance', () => {
  it('is never negative over a run of orders', () => {
    let state: UserState = user(0, [[cardKey(crawlid), 3]]);
    const orders = [
      [sell(crawlid, 1)],
      [buy(crawlid, 1)],
      [sell(crawlid, 2), buy(vengefly, 1)],
      [sell(crawlid, 2)],
      [buy(crawlid, 1)],
    ];
    for (const order of orders) {
      state = settleOrder(state, order) ?? state;
      expect(state.rosaries).toBeGreaterThanOrEqual(0);
    }
  });
});
