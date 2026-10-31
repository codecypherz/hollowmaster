import { CARD_BY_KEY, CARD_DB, CardKey, cardKey, cardKeyOf } from './card';
import {
  DEFAULT_SORT,
  DEFAULT_SORT_STATE,
  OwnedCard,
  SORTS,
  SortDirection,
  SortKey,
  groupByRarity,
  nextSort,
  ownedCards,
  sortOwned,
} from './collection';

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
    expect(DEFAULT_SORT_STATE).toEqual({ key: 'rarity', direction: 'desc' });
  });

  it('descends on the four numeric orders and ascends on name', () => {
    const direction = (key: SortKey) => SORTS.find((s) => s.key === key)!.defaultDirection;
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

// ─── Direction ──────────────────────────────────────────────────────────────

describe('reversing an order', () => {
  const tied = ownedCards(new Map(CARD_DB.map((card, i) => [cardKey(card), (i % 3) + 1] as const)));
  const everyKey = SORTS.map((s) => s.key);
  const opposite = (d: SortDirection): SortDirection => (d === 'asc' ? 'desc' : 'asc');

  function primary(entry: OwnedCard, key: SortKey): number | string {
    switch (key) {
      case 'rarity':
        return entry.card.stars;
      case 'quantity':
        return entry.quantity;
      case 'attack':
        return entry.card.attack;
      case 'defense':
        return entry.card.defense;
      case 'name':
        return entry.card.name;
    }
  }

  it('reverses the primary value for each of the five keys', () => {
    for (const key of everyKey) {
      const forward = sortOwned(tied, key).map((e) => primary(e, key));
      const def = SORTS.find((s) => s.key === key)!.defaultDirection;
      const back = sortOwned(tied, key, opposite(def)).map((e) => primary(e, key));
      expect(back).toEqual([...forward].reverse());
    }
  });

  it('keeps tied cards in their relative order', () => {
    for (const key of everyKey) {
      const forward = keys(sortOwned(tied, key, 'desc'));
      const back = sortOwned(tied, key, 'asc');
      // Group both by primary value: within each value, the run must match.
      const runs = new Map<number | string, CardKey[]>();
      for (const e of back) {
        const v = primary(e, key);
        runs.set(v, [...(runs.get(v) ?? []), cardKey(e.card)]);
      }
      for (const run of runs.values()) {
        const inForward = forward.filter((k) => run.includes(k));
        expect(run).toEqual(inForward);
      }
    }
  });

  it('reads name descending Z to A', () => {
    const names = sortOwned(tied, 'name', 'desc').map((o) => o.card.name);
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a, 'en')));
  });

  it("defaults to the key's own direction when none is given", () => {
    for (const sort of SORTS) {
      expect(keys(sortOwned(tied, sort.key))).toEqual(
        keys(sortOwned(tied, sort.key, sort.defaultDirection)),
      );
    }
  });
});

describe('choosing an order', () => {
  it('flips the direction when the same key is chosen again', () => {
    expect(nextSort({ key: 'attack', direction: 'desc' }, 'attack')).toEqual({
      key: 'attack',
      direction: 'asc',
    });
    expect(nextSort({ key: 'attack', direction: 'asc' }, 'attack')).toEqual({
      key: 'attack',
      direction: 'desc',
    });
  });

  it('opens a new key in its default direction', () => {
    expect(nextSort({ key: 'attack', direction: 'asc' }, 'name')).toEqual({
      key: 'name',
      direction: 'asc',
    });
    expect(nextSort({ key: 'name', direction: 'desc' }, 'rarity')).toEqual({
      key: 'rarity',
      direction: 'desc',
    });
  });
});

// ─── Rarity sections ────────────────────────────────────────────────────────

describe('grouping by rarity', () => {
  const whole = ownedCards(new Map(CARD_DB.map((card) => [cardKey(card), 1] as const)));

  it('follows the direction of its input', () => {
    const down = groupByRarity(sortOwned(whole, 'rarity', 'desc')).map((s) => s.stars);
    const up = groupByRarity(sortOwned(whole, 'rarity', 'asc')).map((s) => s.stars);
    expect(down).toEqual([...down].sort((a, b) => b - a));
    expect(up).toEqual([...down].reverse());
  });

  it('presents no empty section and no rating twice', () => {
    const owned = ownedCards(
      new Map([
        [cardKey(crawlid), 1],
        [cardKey(goam), 1],
      ]),
    );
    const sections = groupByRarity(sortOwned(owned, 'rarity'));
    expect(sections.map((s) => s.stars)).toEqual([4, 1]);
    for (const s of sections) expect(s.entries.length).toBeGreaterThan(0);
  });

  it("states each section's first flat index", () => {
    const sorted = sortOwned(whole, 'rarity');
    for (const section of groupByRarity(sorted)) {
      expect(sorted[section.start]).toBe(section.entries[0]);
    }
  });

  it('reproduces its input exactly when the sections are concatenated', () => {
    const sorted = sortOwned(whole, 'rarity', 'asc');
    expect(groupByRarity(sorted).flatMap((s) => s.entries)).toEqual(sorted);
  });

  it('holds only cards of its own rating in each section', () => {
    for (const section of groupByRarity(sortOwned(whole, 'rarity'))) {
      for (const entry of section.entries) expect(entry.card.stars).toBe(section.stars);
    }
  });

  it('returns nothing for an empty collection', () => {
    expect(groupByRarity([])).toEqual([]);
  });
});
