import { CARD_BY_KEY, CARD_DB, CardKey, cardKey, cardKeyOf } from './card';
import { DEFAULT_SORT, OwnedCard, SORTS, SortKey, ownedCards, sortOwned } from './collection';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!; // 1 star
const goam = CARD_BY_KEY.get(cardKeyOf('FC', 6))!;
const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 7))!; // 1 star

const keys = (owned: readonly OwnedCard[]): CardKey[] => owned.map((o) => cardKey(o.card));

describe('the owned-card projection', () => {
  it('reports one entry per distinct card, with the quantity held', () => {
    const owned = ownedCards(
      new Map([
        [cardKey(crawlid), 3],
        [cardKey(goam), 1],
      ]),
    );

    expect(owned).toHaveLength(2);
    expect(owned.map((o) => o.quantity).sort()).toEqual([1, 3]);
    expect(owned.find((o) => o.card === crawlid)!.quantity).toBe(3);
    expect(owned.find((o) => o.card === goam)!.quantity).toBe(1);
  });

  it('omits a card held zero times', () => {
    const owned = ownedCards(
      new Map([
        [cardKey(crawlid), 1],
        [cardKey(goam), 0],
      ]),
    );
    expect(keys(owned)).toEqual([cardKey(crawlid)]);
  });

  it('omits a card the collection has no entry for at all', () => {
    expect(ownedCards(new Map())).toEqual([]);
  });

  it('reads the same however the collection was built up', () => {
    const forwards = new Map<CardKey, number>();
    forwards.set(cardKey(crawlid), 1);
    forwards.set(cardKey(goam), 2);
    forwards.set(cardKey(vengefly), 1);

    const backwards = new Map<CardKey, number>();
    backwards.set(cardKey(vengefly), 1);
    backwards.set(cardKey(goam), 2);
    backwards.set(cardKey(crawlid), 1);

    expect(keys(ownedCards(forwards))).toEqual(keys(ownedCards(backwards)));
  });

  it('reads in catalogue order', () => {
    const all = new Map(CARD_DB.map((card) => [cardKey(card), 1] as const));
    expect(keys(ownedCards(all))).toEqual(CARD_DB.map(cardKey));
  });
});

describe('the orders', () => {
  it('offers exactly five, each with a distinct key and a stated label', () => {
    expect(SORTS).toHaveLength(5);
    expect(new Set(SORTS.map((s) => s.key)).size).toBe(5);
    for (const sort of SORTS) expect(sort.label.trim()).not.toBe('');
    expect(SORTS.map((s) => s.key).sort()).toEqual(
      ['attack', 'defense', 'name', 'quantity', 'rarity'].sort(),
    );
  });

  it('states rarity as the order the collection arrives in', () => {
    expect(DEFAULT_SORT).toBe('rarity');
  });

  it('descends on the four numeric orders and ascends on name', () => {
    const direction = (key: SortKey) => SORTS.find((s) => s.key === key)!.direction;
    expect(direction('rarity')).toBe('desc');
    expect(direction('quantity')).toBe('desc');
    expect(direction('attack')).toBe('desc');
    expect(direction('defense')).toBe('desc');
    expect(direction('name')).toBe('asc');
  });
});

describe('sorting the collection', () => {
  const whole = ownedCards(new Map(CARD_DB.map((card) => [cardKey(card), 1] as const)));

  /** The first entry the given order puts before the given other one. */
  function precedes(owned: readonly OwnedCard[], key: SortKey, a: CardKey, b: CardKey): boolean {
    const sorted = keys(sortOwned(owned, key));
    return sorted.indexOf(a) < sorted.indexOf(b);
  }

  it('puts a rarer card before a commoner one', () => {
    const fourStar = CARD_DB.find((c) => c.stars === 4)!;
    expect(precedes(whole, 'rarity', cardKey(fourStar), cardKey(crawlid))).toBe(true);
    const sorted = sortOwned(whole, 'rarity');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].card.stars).toBeGreaterThanOrEqual(sorted[i].card.stars);
    }
  });

  it('puts a card held three times before one held once', () => {
    const owned = ownedCards(
      new Map([
        [cardKey(crawlid), 1],
        [cardKey(goam), 3],
      ]),
    );
    expect(precedes(owned, 'quantity', cardKey(goam), cardKey(crawlid))).toBe(true);
  });

  it('reads names A to Z', () => {
    const names = sortOwned(whole, 'name').map((o) => o.card.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  });

  it('puts the higher attack and the higher defense first', () => {
    const byAttack = sortOwned(whole, 'attack');
    for (let i = 1; i < byAttack.length; i++) {
      expect(byAttack[i - 1].card.attack).toBeGreaterThanOrEqual(byAttack[i].card.attack);
    }
    const byDefense = sortOwned(whole, 'defense');
    for (let i = 1; i < byDefense.length; i++) {
      expect(byDefense[i - 1].card.defense).toBeGreaterThanOrEqual(byDefense[i].card.defense);
    }
  });
});

describe('every order is total', () => {
  // The whole catalogue held at quantities that repeat, so cards tie on
  // quantity as well as on the rarities and stats they already tie on.
  const tied = ownedCards(new Map(CARD_DB.map((card, i) => [cardKey(card), (i % 3) + 1] as const)));
  const everyKey = SORTS.map((s) => s.key);

  it('reads the same sequence every time it is applied', () => {
    for (const key of everyKey) {
      expect(keys(sortOwned(tied, key))).toEqual(keys(sortOwned(tied, key)));
    }
  });

  it('restores the first sequence when an order is left and returned to', () => {
    for (const key of everyKey) {
      const first = keys(sortOwned(tied, key));
      for (const other of everyKey) sortOwned(tied, other);
      const again = keys(sortOwned(sortOwned(tied, 'name'), key));
      expect(again).toEqual(first);
    }
  });

  it('leaves no two entries comparing as equal under any order', () => {
    for (const key of everyKey) {
      const sorted = sortOwned(tied, key);
      // Re-sorting an already-sorted sequence and its reverse must give the
      // same answer: only a total order does that.
      expect(keys(sortOwned(sorted, key))).toEqual(keys(sorted));
      expect(keys(sortOwned([...sorted].reverse(), key))).toEqual(keys(sorted));
    }
  });

  it('breaks a tie by name before identity', () => {
    const oneStars = CARD_DB.filter((c) => c.stars === 1);
    expect(oneStars.length).toBeGreaterThan(1);
    const sorted = sortOwned(
      ownedCards(new Map(oneStars.map((card) => [cardKey(card), 1] as const))),
      'rarity',
    );
    const names = sorted.map((o) => o.card.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  });
});

describe('sortOwned', () => {
  it('leaves its input array alone and returns a new one', () => {
    const owned = ownedCards(
      new Map([
        [cardKey(crawlid), 1],
        [cardKey(goam), 2],
      ]),
    );
    const before = keys(owned);

    const sorted = sortOwned(owned, 'rarity');

    expect(sorted).not.toBe(owned);
    expect(keys(owned)).toEqual(before);
  });
});
