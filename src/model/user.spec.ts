import { Card, CardKey, CARD_BY_KEY, CARD_DB, cardKey, cardKeyOf } from './card';
import {
  STARTER_CARD_KEYS,
  UserState,
  distinctCards,
  grantAll,
  quantityOf,
  seedUser,
  totalCards,
} from './user';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!;
const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 7))!;
const goam = CARD_BY_KEY.get(cardKeyOf('FC', 6))!;

const empty: ReadonlyMap<CardKey, number> = new Map();

describe('the collection', () => {
  it('reports zero for a card never owned', () => {
    expect(quantityOf(empty, crawlid)).toBe(0);
    expect(quantityOf(seedUser().collection, goam)).toBe(0);
  });

  it('raises a held card to two without changing the distinct count', () => {
    const one = grantAll(empty, [crawlid]);
    const two = grantAll(one, [crawlid]);
    expect(quantityOf(two, crawlid)).toBe(2);
    expect(distinctCards(two)).toBe(distinctCards(one));
    expect(distinctCards(two)).toBe(1);
  });

  it('counts two copies of one card as one distinct card, not two', () => {
    const twice = grantAll(empty, [crawlid, crawlid]);
    expect(distinctCards(twice)).toBe(1);
    expect(totalCards(twice)).toBe(2);
  });

  it('reports 2 distinct and 4 total for three of one card and one of another', () => {
    const held = grantAll(empty, [crawlid, crawlid, crawlid, vengefly]);
    expect(distinctCards(held)).toBe(2);
    expect(totalCards(held)).toBe(4);
  });

  it('never mutates the collection it is granted against', () => {
    const before = grantAll(empty, [crawlid, vengefly]);
    const sizeBefore = before.size;
    const crawlidBefore = quantityOf(before, crawlid);

    grantAll(before, [crawlid, crawlid, goam]);

    expect(before.size).toBe(sizeBefore);
    expect(quantityOf(before, crawlid)).toBe(crawlidBefore);
    expect(quantityOf(before, goam)).toBe(0);
  });
});

describe('the starter set', () => {
  it('states exactly nine cards', () => {
    expect(STARTER_CARD_KEYS).toHaveLength(9);
  });

  it('names only catalogued cards', () => {
    for (const key of STARTER_CARD_KEYS) {
      expect(CARD_BY_KEY.get(key)).toBeInstanceOf(Card);
    }
  });

  it('names only one-star cards', () => {
    for (const key of STARTER_CARD_KEYS) {
      expect(CARD_BY_KEY.get(key)!.stars).toBe(1);
    }
  });
});

describe('seedUser', () => {
  it('starts with no Geo', () => {
    expect(seedUser().geo).toBe(0);
  });

  it('holds nine cards, one copy each', () => {
    const seeded: UserState = seedUser();
    expect(totalCards(seeded.collection)).toBe(9);
    expect(distinctCards(seeded.collection)).toBe(9);
    for (const key of STARTER_CARD_KEYS) expect(seeded.collection.get(key)).toBe(1);
  });

  it('gives every new user the same nine cards', () => {
    const a = seedUser();
    const b = seedUser();
    expect([...a.collection.entries()].sort()).toEqual([...b.collection.entries()].sort());
    expect(a.collection).not.toBe(b.collection);
  });

  it('seeds cards the catalogue actually holds', () => {
    for (const key of seedUser().collection.keys()) {
      expect(CARD_DB.some((c) => cardKey(c) === key)).toBe(true);
    }
  });

  it('holds exactly one deck, and it is empty', () => {
    const seeded = seedUser();
    expect(seeded.decks).toHaveLength(1);
    expect(seeded.decks[0].cards).toEqual([]);
  });

  it('gives every new user the same one empty deck', () => {
    const a = seedUser();
    const b = seedUser();
    expect(a.decks).toEqual(b.decks);
    expect(a.decks).not.toBe(b.decks);
    expect(a.geo).toBe(b.geo);
  });
});
