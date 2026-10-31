import { CARD_BY_KEY, CARD_DB, CardKey, cardKey, cardKeyOf } from './card';
import { Deck } from './deck';
import {
  ROSARY_PRICE_PER_STAR,
  buyCard,
  decksTrimmedBySale,
  purchasePrice,
  salePrice,
  sellCard,
} from './exchange';
import { UserState, distinctCards, quantityOf, seedUser } from './user';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!; // one star
const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 7))!;
const gruzzer = CARD_BY_KEY.get(cardKeyOf('FC', 8))!;
const fourStar = CARD_DB.find((card) => card.stars === 4)!;
const twoStar = CARD_DB.find((card) => card.stars === 2)!;

function user(rosaries: number, holdings: [CardKey, number][] = [], decks: Deck[] = []): UserState {
  return { ...seedUser(), geo: 55, rosaries, collection: new Map(holdings), decks };
}

describe('Rosary prices', () => {
  it('are ten per star to sell and a hundred per star to buy', () => {
    expect(ROSARY_PRICE_PER_STAR).toEqual({ sell: 10, buy: 100 });
    expect(crawlid.stars).toBe(1);
    expect(salePrice(crawlid)).toBe(10);
    expect(purchasePrice(crawlid)).toBe(100);
    expect(salePrice(fourStar)).toBe(40);
    expect(purchasePrice(fourStar)).toBe(400);
  });

  it('never pay more to sell than they cost to buy, for any catalogued card', () => {
    for (const card of CARD_DB) {
      expect(Number.isInteger(salePrice(card))).toBe(true);
      expect(Number.isInteger(purchasePrice(card))).toBe(true);
      expect(salePrice(card)).toBeLessThan(purchasePrice(card));
    }
  });
});

describe('buying a card', () => {
  it('spends exactly the balance when it is the price', () => {
    const next = buyCard(user(100), crawlid)!;
    expect(next).not.toBeNull();
    expect(next.rosaries).toBe(0);
    expect(quantityOf(next.collection, crawlid)).toBe(1);
  });

  it('adds a further copy of a card already held', () => {
    const next = buyCard(user(500, [[cardKey(crawlid), 2]]), crawlid)!;
    expect(quantityOf(next.collection, crawlid)).toBe(3);
    expect(next.rosaries).toBe(400);
  });

  it('is refused, changing nothing, when the balance is short', () => {
    const state = user(99);
    expect(buyCard(state, crawlid)).toBeNull();
    expect(state.rosaries).toBe(99);
    expect(state.collection.size).toBe(0);
  });

  it('leaves Geo and the decks alone', () => {
    const decks = [{ cards: [cardKey(vengefly)] }];
    const next = buyCard(user(100, [[cardKey(vengefly), 1]], decks), crawlid)!;
    expect(next.geo).toBe(55);
    expect(next.decks).toBe(decks);
  });
});

describe('selling a card', () => {
  it('removes one copy and credits its sale price', () => {
    const next = sellCard(user(0, [[cardKey(twoStar), 3]]), twoStar)!;
    expect(quantityOf(next.collection, twoStar)).toBe(2);
    expect(next.rosaries).toBe(20);
  });

  it('un-owns a card when the last copy goes', () => {
    const state = user(0, [
      [cardKey(crawlid), 1],
      [cardKey(vengefly), 1],
    ]);
    const next = sellCard(state, crawlid)!;
    expect(quantityOf(next.collection, crawlid)).toBe(0);
    expect(next.collection.has(cardKey(crawlid))).toBe(false);
    expect(distinctCards(next.collection)).toBe(1);
  });

  it('is refused, changing nothing, for a card not held', () => {
    const decks = [{ cards: [cardKey(vengefly)] }];
    const state = user(30, [[cardKey(vengefly), 1]], decks);
    expect(sellCard(state, crawlid)).toBeNull();
    expect(state.rosaries).toBe(30);
    expect(state.decks).toBe(decks);
  });

  it('leaves Geo unchanged', () => {
    expect(sellCard(user(0, [[cardKey(crawlid), 1]]), crawlid)!.geo).toBe(55);
  });

  it('trims the decks the sale leaves over the quantity, and only those', () => {
    const c = cardKey(crawlid);
    const v = cardKey(vengefly);
    const g = cardKey(gruzzer);
    const decks = [{ cards: [c, v] }, { cards: [v, g] }, { cards: [g, c] }];
    const next = sellCard(user(0, [[c, 1]], decks), crawlid)!;
    expect(next.decks[0].cards).toEqual([v]);
    expect(next.decks[1]).toBe(decks[1]);
    expect(next.decks[2].cards).toEqual([g]);
  });
});

describe('the decks a sale would trim', () => {
  const c = cardKey(crawlid);
  const v = cardKey(vengefly);

  it('are exactly the decks the sale then changes', () => {
    const cases: [number, Deck[]][] = [
      [1, [{ cards: [c] }, { cards: [v] }, { cards: [v, c] }]],
      [2, [{ cards: [c, c] }, { cards: [c] }, { cards: [] }]],
      [3, [{ cards: [c, c] }, { cards: [v] }]],
      [1, []],
    ];
    for (const [held, decks] of cases) {
      const state = user(0, [[c, held]], decks);
      const sold = sellCard(state, crawlid)!;
      const changed = sold.decks.flatMap((deck, i) => (deck === state.decks[i] ? [] : [i]));
      expect(decksTrimmedBySale(state, crawlid)).toEqual(changed);
    }
  });

  it('names Deck 1 and Deck 3 for the only copy they both use', () => {
    const state = user(0, [[c, 1]], [{ cards: [c] }, { cards: [v] }, { cards: [c, v] }]);
    expect(decksTrimmedBySale(state, crawlid)).toEqual([0, 2]);
  });

  it('are none when copies remain for every deck', () => {
    const state = user(0, [[c, 3]], [{ cards: [c, c] }]);
    expect(decksTrimmedBySale(state, crawlid)).toEqual([]);
  });

  it('are none for a card not held', () => {
    expect(decksTrimmedBySale(user(0, [], [{ cards: [c] }]), crawlid)).toEqual([]);
  });
});

describe('the Rosary balance', () => {
  it('is never negative over a run of exchanges', () => {
    let state: UserState = user(0, [[cardKey(crawlid), 3]]);
    const steps = [sellCard, buyCard, sellCard, sellCard, buyCard, buyCard, sellCard];
    for (const step of steps) {
      state = step(state, crawlid) ?? state;
      expect(state.rosaries).toBeGreaterThanOrEqual(0);
    }
  });
});
