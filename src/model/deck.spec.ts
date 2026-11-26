import { CARD_BY_KEY, Card, CardKey, cardKey, cardKeyOf } from './card';
import { HAND_SIZE } from './game';
import {
  DECK_SIZE,
  Deck,
  MAX_DECKS,
  RARITY_LIMIT,
  addCardToDeck,
  addRefusal,
  chooseBattleDeck,
  copiesInDeck,
  createDeck,
  defaultBattleDeck,
  deckName,
  deckStanding,
  deleteDeck,
  emptyDeck,
  isBattleReady,
  listOf,
  randomReadyDeck,
  removeCardFromDeck,
  trimDecks,
} from './deck';
import {
  STARTER_CARD_KEYS,
  UserState,
  distinctCards,
  quantityOf,
  seedUser,
  totalCards,
  withMilestones,
} from './user';
import { settleOrder } from './exchange';
import { CARD_DB } from './card';
import { addSixStarCard } from '../testing/six-star';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!;
const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 7))!;
const gruzzer = CARD_BY_KEY.get(cardKeyOf('FC', 8))!;
const tiktik = CARD_BY_KEY.get(cardKeyOf('FC', 9))!;
/** Not a starter card, so a seeded user holds none of it. */
const goam = CARD_BY_KEY.get(cardKeyOf('FC', 6))!;

function withDecks(decks: readonly Deck[]): UserState {
  return { ...seedUser(), decks };
}

function deckOf(...keys: CardKey[]): Deck {
  return { cards: keys };
}

/** `count` keys drawn from the starter set, for decks built directly. */
function lowKeys(count: number): CardKey[] {
  return STARTER_CARD_KEYS.slice(0, count);
}

/** A seeded user with one empty deck who holds `quantity` copies of `card`. */
function holding(card: Card, quantity: number): UserState {
  const user = seedUser();
  return { ...user, collection: new Map([...user.collection, [cardKey(card), quantity]]) };
}

describe('the deck constants', () => {
  it('sizes a deck as a hand, and holds both at nine', () => {
    expect(DECK_SIZE).toBe(HAND_SIZE);
    expect(DECK_SIZE).toBe(9);
    expect(MAX_DECKS).toBe(9);
  });
});

describe('deck names', () => {
  it('numbers decks from one', () => {
    expect(deckName(0)).toBe('Deck 1');
    expect(deckName(8)).toBe('Deck 9');
  });

  it('renames what follows a deletion', () => {
    const state = withDecks([emptyDeck(), deckOf(cardKey(crawlid)), deckOf(cardKey(vengefly))]);
    const next = deleteDeck(state, 1)!;

    expect(deckName(1)).toBe('Deck 2');
    expect(next.decks[1].cards).toEqual([cardKey(vengefly)]);
  });
});

describe('creating a deck', () => {
  it('appends an empty deck after the last one', () => {
    const state = withDecks([deckOf(cardKey(crawlid)), deckOf(cardKey(vengefly))]);
    const next = createDeck(state)!;

    expect(next.decks).toHaveLength(3);
    expect(next.decks[2].cards).toEqual([]);
    expect(next.decks[0].cards).toEqual([cardKey(crawlid)]);
    expect(next.decks[1].cards).toEqual([cardKey(vengefly)]);
  });

  it('allows the ninth deck and refuses the tenth', () => {
    let state = withDecks([]);
    for (let i = 0; i < MAX_DECKS; i++) {
      const next = createDeck(state);
      expect(next).not.toBeNull();
      state = next!;
    }
    expect(state.decks).toHaveLength(MAX_DECKS);
    expect(createDeck(state)).toBeNull();
  });

  it('leaves the state it refused untouched', () => {
    const state = withDecks(Array.from({ length: MAX_DECKS }, emptyDeck));
    const decksBefore = state.decks;

    expect(createDeck(state)).toBeNull();
    expect(state.decks).toBe(decksBefore);
    expect(state.decks).toHaveLength(MAX_DECKS);
  });
});

describe('deleting a deck', () => {
  it('leaves the other decks with their exact contents in order', () => {
    const state = withDecks([
      deckOf(cardKey(crawlid)),
      deckOf(cardKey(vengefly), cardKey(gruzzer)),
      deckOf(cardKey(gruzzer)),
    ]);
    const next = deleteDeck(state, 0)!;

    expect(next.decks).toHaveLength(2);
    expect(next.decks[0].cards).toEqual([cardKey(vengefly), cardKey(gruzzer)]);
    expect(next.decks[1].cards).toEqual([cardKey(gruzzer)]);
  });

  it('costs no cards and no Geo', () => {
    const state = { ...withDecks([deckOf(...Array(9).fill(cardKey(crawlid)))]), geo: 120 };
    const next = deleteDeck(state, 0)!;

    expect(next.geo).toBe(120);
    expect(quantityOf(next.collection, crawlid)).toBe(quantityOf(state.collection, crawlid));
    expect(totalCards(next.collection)).toBe(totalCards(state.collection));
  });

  it('leaves the user holding no decks when the last is deleted', () => {
    const next = deleteDeck(withDecks([emptyDeck()]), 0)!;
    expect(next.decks).toEqual([]);
  });

  it('refuses an index no deck occupies', () => {
    const state = withDecks([emptyDeck()]);
    expect(deleteDeck(state, 1)).toBeNull();
    expect(deleteDeck(state, -1)).toBeNull();
  });
});

describe('adding a card to a deck', () => {
  it('fills the positions in the order the cards were added', () => {
    let state = withDecks([emptyDeck()]);
    state = addCardToDeck(state, 0, crawlid)!;
    state = addCardToDeck(state, 0, vengefly)!;
    state = addCardToDeck(state, 0, gruzzer)!;

    expect(state.decks[0].cards).toEqual([cardKey(crawlid), cardKey(vengefly), cardKey(gruzzer)]);
  });

  it('lets one held copy into a deck once, and refuses the second', () => {
    // Replaces "lets one held copy fill a whole deck": the quantity held now
    // bounds the copies one deck may hold.
    let state = withDecks([emptyDeck()]);
    expect(quantityOf(state.collection, crawlid)).toBe(1);

    state = addCardToDeck(state, 0, crawlid)!;
    expect(state).not.toBeNull();
    expect(addCardToDeck(state, 0, crawlid)).toBeNull();

    expect(state.decks[0].cards).toEqual([cardKey(crawlid)]);
    expect(quantityOf(state.collection, crawlid)).toBe(1);
  });

  it('lets three held copies in three times, and refuses the fourth', () => {
    let state = holding(crawlid, 3);
    for (let i = 0; i < 3; i++) {
      const next = addCardToDeck(state, 0, crawlid);
      expect(next).not.toBeNull();
      state = next!;
    }
    expect(addCardToDeck(state, 0, crawlid)).toBeNull();
    expect(state.decks[0].cards).toEqual(Array(3).fill(cardKey(crawlid)));
  });

  it('allows the add again once a copy is removed from an exhausted deck', () => {
    let state = addCardToDeck(withDecks([emptyDeck()]), 0, crawlid)!;
    expect(addRefusal(state, 0, crawlid)).toBe('exhausted');

    state = removeCardFromDeck(state, 0, 0)!;
    expect(addRefusal(state, 0, crawlid)).toBeNull();
    expect(addCardToDeck(state, 0, crawlid)).not.toBeNull();
  });

  it('leaves the state untouched when an over-limit add is refused', () => {
    const state = addCardToDeck(withDecks([emptyDeck()]), 0, crawlid)!;
    const decksBefore = state.decks;
    const deckBefore = state.decks[0];

    expect(addCardToDeck(state, 0, crawlid)).toBeNull();
    expect(state.decks).toBe(decksBefore);
    expect(state.decks[0]).toBe(deckBefore);
  });

  it('serves several decks from one held copy', () => {
    let state = withDecks([emptyDeck(), emptyDeck(), emptyDeck()]);
    state = addCardToDeck(state, 0, crawlid)!;
    state = addCardToDeck(state, 1, crawlid)!;
    state = addCardToDeck(state, 2, crawlid)!;

    for (const deck of state.decks) expect(deck.cards).toEqual([cardKey(crawlid)]);
    expect(quantityOf(state.collection, crawlid)).toBe(1);
  });

  it('refuses a tenth card and changes nothing', () => {
    const full = deckOf(...Array<CardKey>(DECK_SIZE).fill(cardKey(crawlid)));
    const state = withDecks([full]);

    expect(addCardToDeck(state, 0, vengefly)).toBeNull();
    expect(state.decks[0]).toBe(full);
    expect(state.decks[0].cards).toHaveLength(DECK_SIZE);
  });

  it('refuses a deck that does not exist and changes nothing', () => {
    const state = withDecks([emptyDeck()]);
    const decksBefore = state.decks;

    expect(addCardToDeck(state, 4, crawlid)).toBeNull();
    expect(state.decks).toBe(decksBefore);
  });

  it('refuses a card the collection does not hold and changes nothing', () => {
    const state = withDecks([emptyDeck()]);
    expect(quantityOf(state.collection, goam)).toBe(0);

    expect(addCardToDeck(state, 0, goam)).toBeNull();
    expect(state.decks[0].cards).toEqual([]);
  });
});

describe('removing a card from a deck', () => {
  it('takes out one of three copies and leaves the other two', () => {
    const state = withDecks([
      deckOf(cardKey(crawlid), cardKey(crawlid), cardKey(crawlid), cardKey(vengefly)),
    ]);
    const next = removeCardFromDeck(state, 0, 1)!;

    expect(next.decks[0].cards).toEqual([cardKey(crawlid), cardKey(crawlid), cardKey(vengefly)]);
  });

  it('closes the gap behind a removal from the middle', () => {
    const six: CardKey[] = [
      cardKey(crawlid),
      cardKey(vengefly),
      cardKey(gruzzer),
      cardKey(crawlid),
      cardKey(vengefly),
      cardKey(gruzzer),
    ];
    const next = removeCardFromDeck(withDecks([deckOf(...six)]), 0, 2)!;

    expect(next.decks[0].cards).toEqual([six[0], six[1], six[3], six[4], six[5]]);
  });

  it('refuses a position no card occupies', () => {
    const state = withDecks([deckOf(cardKey(crawlid))]);
    expect(removeCardFromDeck(state, 0, 1)).toBeNull();
    expect(removeCardFromDeck(state, 0, -1)).toBeNull();
    expect(removeCardFromDeck(withDecks([emptyDeck()]), 0, 0)).toBeNull();
  });

  it('refuses a deck that does not exist', () => {
    expect(removeCardFromDeck(withDecks([emptyDeck()]), 2, 0)).toBeNull();
  });
});

describe('the reason an addition is refused', () => {
  it('reports each of the five outcomes', () => {
    const fresh = withDecks([emptyDeck()]);
    expect(addRefusal(fresh, 0, crawlid)).toBeNull();
    expect(addRefusal(fresh, 3, crawlid)).toBe('no-deck');
    expect(addRefusal(fresh, 0, goam)).toBe('unowned');
    expect(addRefusal(withDecks([deckOf(...lowKeys(DECK_SIZE))]), 0, crawlid)).toBe('full');
    expect(addRefusal(withDecks([deckOf(cardKey(crawlid))]), 0, crawlid)).toBe('exhausted');
  });

  it('agrees with the operation in every case', () => {
    const cases: [UserState, number, Card][] = [
      [withDecks([emptyDeck()]), 0, crawlid],
      [withDecks([emptyDeck()]), 3, crawlid],
      [withDecks([emptyDeck()]), 0, goam],
      [withDecks([deckOf(...lowKeys(DECK_SIZE))]), 0, crawlid],
      [withDecks([deckOf(cardKey(crawlid))]), 0, crawlid],
    ];
    for (const [state, deck, card] of cases) {
      expect(addCardToDeck(state, deck, card) === null).toBe(
        addRefusal(state, deck, card) !== null,
      );
    }
  });
});

describe('copies in a deck', () => {
  it('counts only the copies of that card', () => {
    const deck = deckOf(cardKey(crawlid), cardKey(vengefly), cardKey(crawlid));
    expect(copiesInDeck(deck, crawlid)).toBe(2);
    expect(copiesInDeck(deck, vengefly)).toBe(1);
    expect(copiesInDeck(deck, gruzzer)).toBe(0);
  });
});

describe('every deck operation', () => {
  it('leaves its input state, its deck list, and its decks untouched', () => {
    const state = withDecks([deckOf(cardKey(crawlid)), emptyDeck()]);
    const decksBefore = state.decks;
    const cardsBefore = state.decks[0].cards;

    createDeck(state);
    deleteDeck(state, 1);
    addCardToDeck(state, 0, vengefly);
    removeCardFromDeck(state, 0, 0);

    expect(state.decks).toBe(decksBefore);
    expect(state.decks[0].cards).toBe(cardsBefore);
    expect(state.decks[0].cards).toEqual([cardKey(crawlid)]);
    expect(state.decks).toHaveLength(2);
  });

  it('never touches the collection or the balance across a long sequence', () => {
    const start = { ...withDecks([emptyDeck()]), geo: 250 };
    const collectionBefore = new Map(start.collection);
    let state = start;

    const check = () => {
      expect(state.geo).toBe(250);
      expect(new Map(state.collection)).toEqual(collectionBefore);
      expect(distinctCards(state.collection)).toBe(distinctCards(collectionBefore));
      expect(totalCards(state.collection)).toBe(totalCards(collectionBefore));
    };

    for (let i = 0; i < 4; i++) {
      state = createDeck(state)!;
      check();
    }
    for (let deck = 0; deck < 4; deck++) {
      for (const card of [crawlid, vengefly, gruzzer, tiktik]) {
        state = addCardToDeck(state, deck, card)!;
        check();
      }
    }
    for (let deck = 0; deck < 4; deck++) {
      state = removeCardFromDeck(state, deck, 1)!;
      check();
    }
    while (state.decks.length > 0) {
      state = deleteDeck(state, 0)!;
      check();
    }

    expect(state.decks).toEqual([]);
  });
});

// ─── Standing ───────────────────────────────────────────────────────────────

/** A card at any rating, for ratings the catalogue does not hold yet. */
function rated(stars: number, number: number): Card {
  return new Card({
    name: `Rated ${stars}`,
    arrows: [],
    stars,
    image: 'crawlid.webp',
    attack: 10,
    defense: 10,
    ability: 'None.',
    set: 'TEST',
    number,
  });
}

/** Looks a key up among test-only cards first, then the catalogue. */
function lookupWith(...extra: Card[]) {
  const byKey = new Map(extra.map((c) => [cardKey(c), c] as const));
  return (key: CardKey) => byKey.get(key) ?? CARD_BY_KEY.get(key);
}

const low = [crawlid, vengefly, gruzzer].map(cardKey);

function lows(count: number): CardKey[] {
  return Array.from({ length: count }, (_, i) => low[i % low.length]);
}

describe('the rarity limit', () => {
  it('allows two cards of four stars or more', () => {
    expect(RARITY_LIMIT).toEqual({ minStars: 4, allowed: 2 });
    expect(goam.stars).toBe(4);
  });
});

describe("a deck's standing", () => {
  it('is Ready for a full deck within the limit', () => {
    const deck = deckOf(cardKey(goam), ...lows(8));
    expect(deckStanding(deck).problems).toEqual([]);
  });

  it('reports how many more cards a short deck needs', () => {
    expect(deckStanding(deckOf(...lows(5))).problems).toEqual([{ kind: 'incomplete', needed: 4 }]);
  });

  it('reports an empty deck as needing nine', () => {
    expect(deckStanding(emptyDeck()).problems).toEqual([{ kind: 'incomplete', needed: 9 }]);
  });

  it('is Ready with two different four-star cards', () => {
    const otherFour = rated(4, 1);
    const deck = deckOf(cardKey(goam), cardKey(otherFour), ...lows(7));
    expect(deckStanding(deck, lookupWith(otherFour)).problems).toEqual([]);
  });

  it('is Ready with two copies of one four-star card', () => {
    const deck = deckOf(cardKey(goam), cardKey(goam), ...lows(7));
    expect(deckStanding(deck).problems).toEqual([]);
  });

  it('is Invalid with three different four-star cards', () => {
    const others = [rated(4, 1), rated(4, 2)];
    const deck = deckOf(cardKey(goam), ...others.map(cardKey), ...lows(6));
    expect(deckStanding(deck, lookupWith(...others)).problems).toEqual([
      { kind: 'invalid', rule: 'rarity', held: 3, allowed: 2, minStars: 4 },
    ]);
  });

  it('is Invalid with three copies of one four-star card', () => {
    const deck = deckOf(cardKey(goam), cardKey(goam), cardKey(goam), ...lows(6));
    expect(deckStanding(deck).problems).toEqual([
      { kind: 'invalid', rule: 'rarity', held: 3, allowed: 2, minStars: 4 },
    ]);
  });

  it('counts ratings above four toward the limit', () => {
    for (const stars of [5, 6]) {
      const high = rated(stars, stars);
      const deck = deckOf(cardKey(goam), cardKey(goam), cardKey(high), ...lows(6));
      expect(deckStanding(deck, lookupWith(high)).problems).toEqual([
        { kind: 'invalid', rule: 'rarity', held: 3, allowed: 2, minStars: 4 },
      ]);
    }
  });

  it('never counts ratings below four', () => {
    const three = rated(3, 3);
    const deck = deckOf(...Array.from({ length: 9 }, () => cardKey(three)));
    expect(deckStanding(deck, lookupWith(three)).problems).toEqual([]);
  });

  it('reports both problems, Invalid first', () => {
    const deck = deckOf(cardKey(goam), cardKey(goam), cardKey(goam), ...lows(3));
    expect(deckStanding(deck).problems).toEqual([
      { kind: 'invalid', rule: 'rarity', held: 3, allowed: 2, minStars: 4 },
      { kind: 'incomplete', needed: 3 },
    ]);
  });

  it('counts a key the catalogue does not resolve toward size only', () => {
    const deck = deckOf(cardKeyOf('NOPE', 1), ...lows(8));
    expect(deckStanding(deck).problems).toEqual([]);
  });

  it('is the same every time the same contents are evaluated', () => {
    const deck = deckOf(cardKey(goam), cardKey(goam), cardKey(goam), ...lows(1));
    expect(deckStanding(deck)).toEqual(deckStanding(deck));
  });
});

describe('battle eligibility', () => {
  it('admits only a Ready deck', () => {
    expect(isBattleReady(deckOf(cardKey(goam), ...lows(8)))).toBe(true);
    expect(isBattleReady(deckOf(cardKey(goam), cardKey(goam), ...lows(7)))).toBe(true);
    expect(isBattleReady(deckOf(cardKey(goam), cardKey(goam), cardKey(goam), ...lows(6)))).toBe(
      false,
    );
    expect(isBattleReady(deckOf(...lows(8)))).toBe(false);
    expect(isBattleReady(deckOf(cardKey(goam), cardKey(goam), cardKey(goam), ...lows(1)))).toBe(
      false,
    );
  });

  it('admits no deck for a freshly seeded user', () => {
    const user = seedUser();
    expect(user.decks).toHaveLength(1);
    expect(deckStanding(user.decks[0]).problems).toEqual([{ kind: 'incomplete', needed: 9 }]);
    expect(user.decks.some(isBattleReady)).toBe(false);
  });
});

describe('building past the rarity limit', () => {
  /** Four-star cards distinct from Goam; the catalogue holds only one. */
  const other4 = rated(4, 99);
  const another4 = rated(4, 98);

  /** A seeded user who also holds `goams` Goam and one of each test four-star card. */
  function holdingGoam(goams = 1): UserState {
    const user = seedUser();
    return {
      ...user,
      collection: new Map([
        ...user.collection,
        [cardKey(goam), goams],
        [cardKey(other4), 1],
        [cardKey(another4), 1],
      ]),
    };
  }

  it('accepts a second, different four-star card and the deck is not Invalid', () => {
    let state = holdingGoam();
    state = addCardToDeck(state, 0, goam)!;
    state = addCardToDeck(state, 0, other4)!;

    expect(state).not.toBeNull();
    expect(state.decks[0].cards).toEqual([cardKey(goam), cardKey(other4)]);
    const standing = deckStanding(state.decks[0], lookupWith(other4));
    expect(standing.problems.map((p) => p.kind)).toEqual(['incomplete']);
  });

  it('accepts a third, different four-star card and the deck becomes Invalid', () => {
    let state = holdingGoam();
    state = addCardToDeck(state, 0, goam)!;
    state = addCardToDeck(state, 0, other4)!;
    state = addCardToDeck(state, 0, another4)!;

    expect(state).not.toBeNull();
    expect(state.decks[0].cards).toEqual([cardKey(goam), cardKey(other4), cardKey(another4)]);
    const standing = deckStanding(state.decks[0], lookupWith(other4, another4));
    expect(standing.problems[0].kind).toBe('invalid');
  });

  it('accepts a third copy of a four-star card held three times', () => {
    let state = holdingGoam(3);
    for (let i = 0; i < 3; i++) state = addCardToDeck(state, 0, goam)!;

    expect(state.decks[0].cards).toEqual([cardKey(goam), cardKey(goam), cardKey(goam)]);
    expect(deckStanding(state.decks[0]).problems[0].kind).toBe('invalid');
  });

  it('becomes valid again when one is removed', () => {
    let state = holdingGoam(3);
    for (let i = 0; i < 3; i++) state = addCardToDeck(state, 0, goam)!;
    state = removeCardFromDeck(state, 0, 1)!;

    expect(deckStanding(state.decks[0]).problems.map((p) => p.kind)).toEqual(['incomplete']);
  });
});

describe('trimming decks to a quantity', () => {
  const c = cardKey(crawlid);
  const v = cardKey(vengefly);
  const g = cardKey(gruzzer);
  const t = cardKey(tiktik);

  it('takes the only copy out of every deck that used it', () => {
    const decks = [deckOf(c, v, g), deckOf(v, g), deckOf(g, c, t)];
    const trimmed = trimDecks(decks, c, 0);
    expect(trimmed[0].cards).toEqual([v, g]);
    expect(trimmed[2].cards).toEqual([g, t]);
    expect(trimmed[1]).toBe(decks[1]);
  });

  it('removes the latest copy and closes the deck up', () => {
    // Crawlid at the second and fifth positions; two held becomes one.
    const deck = deckOf(v, c, g, t, c, v, g);
    const [trimmed] = trimDecks([deck], c, 1);
    expect(trimmed.cards).toEqual([v, c, g, t, v, g]);
  });

  it('leaves a deck within the quantity as it was', () => {
    const deck = deckOf(c, v, c);
    const decks = [deck];
    const trimmed = trimDecks(decks, c, 2);
    expect(trimmed[0]).toBe(deck);
    expect(trimmed[0].cards).toEqual([c, v, c]);
  });

  it('leaves every other card in a trimmed deck alone', () => {
    const [trimmed] = trimDecks([deckOf(c, c, c, v)], c, 1);
    expect(trimmed.cards).toEqual([c, v]);
  });

  it('turns a full deck incomplete when it trims one out', () => {
    const full = deckOf(c, ...lowKeys(9).slice(1));
    expect(full.cards).toHaveLength(DECK_SIZE);
    expect(isBattleReady(full)).toBe(true);
    const [trimmed] = trimDecks([full], c, 0);
    expect(trimmed.cards).toHaveLength(DECK_SIZE - 1);
    expect(deckStanding(trimmed).problems).toEqual([{ kind: 'incomplete', needed: 1 }]);
  });
});

describe('listing deck names', () => {
  it('reads as prose', () => {
    expect(listOf(['Deck 1'])).toBe('Deck 1');
    expect(listOf(['Deck 1', 'Deck 3'])).toBe('Deck 1 and Deck 3');
    expect(listOf(['Deck 1', 'Deck 2', 'Deck 3'])).toBe('Deck 1, Deck 2, and Deck 3');
  });
});

// ─── The remembered battle deck ─────────────────────────────────────────────

describe('the remembered battle deck', () => {
  const ready = (): Deck => deckOf(...lowKeys(9));
  const incomplete = (): Deck => deckOf(...lowKeys(8));
  /** Over the rarity limit, and full — Invalid alone. */
  const invalid = (): Deck => deckOf(cardKey(goam), cardKey(goam), cardKey(goam), ...lowKeys(6));

  function remembering(decks: readonly Deck[], battleDeck: number | null): UserState {
    return { ...withDecks(decks), battleDeck };
  }

  it('starts as none for a new user', () => {
    expect(seedUser().battleDeck).toBeNull();
  });

  describe('choosing', () => {
    it('records a Ready deck', () => {
      const state = withDecks([incomplete(), ready()]);
      expect(chooseBattleDeck(state, 1)!.battleDeck).toBe(1);
    });

    it('changes nothing but the record', () => {
      const state = withDecks([ready()]);
      const next = chooseBattleDeck(state, 0)!;
      expect(next.decks).toBe(state.decks);
      expect(next.collection).toBe(state.collection);
      expect(next.geo).toBe(state.geo);
      expect(next.rosaries).toBe(state.rosaries);
    });

    it('refuses an Incomplete deck', () => {
      expect(chooseBattleDeck(remembering([ready(), incomplete()], 0), 1)).toBeNull();
    });

    it('refuses an Invalid deck', () => {
      expect(isBattleReady(invalid())).toBe(false);
      expect(invalid().cards).toHaveLength(DECK_SIZE);
      expect(chooseBattleDeck(withDecks([ready(), invalid()]), 1)).toBeNull();
    });

    it('refuses an index no deck occupies', () => {
      const state = withDecks([ready()]);
      for (const index of [-1, 1, 9, 0.5, Number.NaN]) {
        expect(chooseBattleDeck(state, index)).toBeNull();
      }
    });
  });

  describe('the default', () => {
    it('is the first Ready deck with no record', () => {
      expect(defaultBattleDeck(withDecks([incomplete(), ready(), ready()]))).toBe(1);
    });

    it('is the record when that deck is Ready', () => {
      expect(defaultBattleDeck(remembering([ready(), ready(), ready()], 2))).toBe(2);
    });

    it('falls back to the first Ready deck when the record is not Ready', () => {
      expect(defaultBattleDeck(remembering([invalid(), ready(), incomplete()], 2))).toBe(1);
    });

    it('is none with no Ready deck', () => {
      expect(defaultBattleDeck(seedUser())).toBeNull();
      expect(defaultBattleDeck(remembering([incomplete(), invalid()], 0))).toBeNull();
    });
  });

  describe('deleting a deck', () => {
    it('moves the record down when an earlier deck is deleted', () => {
      const third = deckOf(...lowKeys(9).reverse());
      const next = deleteDeck(remembering([ready(), ready(), third], 2), 0)!;
      expect(next.battleDeck).toBe(1);
      expect(next.decks[1]).toBe(third);
    });

    it('clears the record when the remembered deck is deleted', () => {
      expect(deleteDeck(remembering([ready(), ready(), ready()], 1), 1)!.battleDeck).toBeNull();
    });

    it('leaves the record when a later deck is deleted', () => {
      expect(deleteDeck(remembering([ready(), ready(), ready()], 1), 2)!.battleDeck).toBe(1);
    });

    it('leaves no record as none', () => {
      expect(deleteDeck(remembering([ready(), ready()], null), 0)!.battleDeck).toBeNull();
    });
  });

  describe('every other operation leaves the record', () => {
    it('creating a deck', () => {
      expect(createDeck(remembering([ready()], 0))!.battleDeck).toBe(0);
    });

    it('adding a card', () => {
      const state = remembering([ready(), incomplete()], 0);
      const next = addCardToDeck(state, 1, CARD_BY_KEY.get(lowKeys(9)[8])!)!;
      expect(next.battleDeck).toBe(0);
    });

    it('removing a card, even one that leaves the remembered deck Incomplete', () => {
      const next = removeCardFromDeck(remembering([ready()], 0), 0, 0)!;
      expect(isBattleReady(next.decks[0])).toBe(false);
      expect(next.battleDeck).toBe(0);
    });

    it('a sale that trims the remembered deck', () => {
      const state = remembering([ready()], 0);
      const sold = settleOrder(state, [{ key: lowKeys(1)[0], action: 'sell', quantity: 1 }])!;
      expect(sold.decks[0].cards).toHaveLength(DECK_SIZE - 1);
      expect(sold.battleDeck).toBe(0);
    });

    it('raising milestones', () => {
      const state: UserState = {
        ...remembering([ready()], 0),
        rosaries: 500,
      };
      const raised = withMilestones(state);
      expect(raised).not.toBe(state);
      expect(raised.battleDeck).toBe(0);
    });
  });
});

describe("the opponent's random Ready deck", () => {
  it('is Ready in every one of five hundred deals, rare cards in play', () => {
    const sixStar = addSixStarCard();
    let sawRare = false;
    for (let deal = 0; deal < 500; deal++) {
      const deck = randomReadyDeck(CARD_DB, Math.random);
      expect(deck.cards).toHaveLength(DECK_SIZE);
      expect(isBattleReady(deck), deck.cards.join(',')).toBe(true);
      sawRare ||= deck.cards.some((key) => CARD_BY_KEY.get(key)!.stars >= RARITY_LIMIT.minStars);
      for (const key of deck.cards) expect(CARD_BY_KEY.has(key)).toBe(true);
    }
    expect(sawRare).toBe(true);
    expect(CARD_DB).toContain(sixStar);
  });

  it('deals nine copies from a database of one common card', () => {
    const deck = randomReadyDeck([crawlid], Math.random);
    expect(deck.cards).toEqual(Array(DECK_SIZE).fill(cardKey(crawlid)));
  });

  it('fills a deck from a database smaller than one, rare cards included', () => {
    const rare = CARD_DB.filter((card) => card.stars >= RARITY_LIMIT.minStars);
    expect(rare.length).toBeGreaterThan(0);
    for (let deal = 0; deal < 50; deal++) {
      const deck = randomReadyDeck([crawlid, ...rare], Math.random);
      expect(isBattleReady(deck)).toBe(true);
    }
  });

  it('throws for a database with nothing below the rarity limit', () => {
    const rare = CARD_DB.filter((card) => card.stars >= RARITY_LIMIT.minStars);
    expect(() => randomReadyDeck(rare, Math.random)).toThrow();
    expect(() => randomReadyDeck([], Math.random)).toThrow();
  });

  it('varies between deals', () => {
    const deals = new Set<string>();
    for (let deal = 0; deal < 10; deal++)
      deals.add(randomReadyDeck(CARD_DB, Math.random).cards.join());
    expect(deals.size).toBeGreaterThan(1);
  });
});
