import { CARD_BY_KEY, CardKey, cardKey, cardKeyOf } from './card';
import { HAND_SIZE } from './game';
import {
  DECK_SIZE,
  Deck,
  MAX_DECKS,
  addCardToDeck,
  createDeck,
  deckName,
  deleteDeck,
  emptyDeck,
  removeCardFromDeck,
} from './deck';
import { UserState, distinctCards, quantityOf, seedUser, totalCards } from './user';

const crawlid = CARD_BY_KEY.get(cardKeyOf('FC', 1))!;
const vengefly = CARD_BY_KEY.get(cardKeyOf('FC', 7))!;
const gruzzer = CARD_BY_KEY.get(cardKeyOf('FC', 8))!;
/** Not a starter card, so a seeded user holds none of it. */
const goam = CARD_BY_KEY.get(cardKeyOf('FC', 6))!;

function withDecks(decks: readonly Deck[]): UserState {
  return { ...seedUser(), decks };
}

function deckOf(...keys: CardKey[]): Deck {
  return { cards: keys };
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

  it('lets one held copy fill a whole deck', () => {
    let state = withDecks([emptyDeck()]);
    expect(quantityOf(state.collection, crawlid)).toBe(1);

    for (let i = 0; i < DECK_SIZE; i++) {
      const next = addCardToDeck(state, 0, crawlid);
      expect(next).not.toBeNull();
      state = next!;
    }

    expect(state.decks[0].cards).toHaveLength(DECK_SIZE);
    expect(quantityOf(state.collection, crawlid)).toBe(1);
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
      for (const card of [crawlid, vengefly, gruzzer, crawlid]) {
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
