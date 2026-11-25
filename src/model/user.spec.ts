import { addSixStarCard } from '../testing/six-star';
import { Card, CardKey, CARD_BY_KEY, CARD_DB, cardKey, cardKeyOf } from './card';
import {
  STARTER_CARD_KEYS,
  UserState,
  distinctCards,
  grantAll,
  quantityOf,
  seedUser,
  totalCards,
  withMilestones,
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

  it('starts with no Rosaries', () => {
    expect(seedUser().rosaries).toBe(0);
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

describe('the milestones', () => {
  const twoStar = CARD_DB.find((card) => card.stars === 2)!;

  it('start at no Rosaries and the rarest starter card', () => {
    expect(seedUser().milestones).toEqual({ peakRosaries: 0, rarestHeld: 1 });
  });

  it('rise to the balance and to the rarest card held', () => {
    const state = withMilestones({
      ...seedUser(),
      rosaries: 600,
      collection: grantAll(empty, [crawlid, twoStar]),
    });
    expect(state.milestones).toEqual({ peakRosaries: 600, rarestHeld: 2 });

    const six = addSixStarCard();
    const rarer = withMilestones({ ...state, collection: grantAll(state.collection, [six]) });
    expect(rarer.milestones).toEqual({ peakRosaries: 600, rarestHeld: 6 });
  });

  it('never fall when the Rosaries are spent or the cards are sold', () => {
    const peak = { ...seedUser(), milestones: { peakRosaries: 600, rarestHeld: 4 } };
    const after = withMilestones({ ...peak, rosaries: 100 });
    expect(after.milestones).toEqual({ peakRosaries: 600, rarestHeld: 4 });
    expect(withMilestones({ ...after, rosaries: 0, collection: empty }).milestones).toEqual({
      peakRosaries: 600,
      rarestHeld: 4,
    });
  });

  it('return the same object when neither is passed', () => {
    const seeded = seedUser();
    expect(withMilestones(seeded)).toBe(seeded);
    const spent = { ...seeded, milestones: { peakRosaries: 9, rarestHeld: 3 } };
    expect(withMilestones(spent)).toBe(spent);
  });

  it('are nothing for an empty collection that has never held a card', () => {
    const state = {
      ...seedUser(),
      collection: empty,
      milestones: { peakRosaries: 0, rarestHeld: 0 },
    };
    expect(withMilestones(state)).toBe(state);
  });
});
