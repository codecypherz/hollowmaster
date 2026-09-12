import { Card, CardKey, cardKey } from './card';
import { HAND_SIZE } from './game';
import { UserState, quantityOf } from './user';

/**
 * A deck: the player's stated selection of cards, drawn from what they have
 * unlocked.
 *
 * The cards are named by catalogue identity rather than held as `Card`
 * objects, for the same reason the collection is: a deck is a *selection*, and
 * copying catalogue data into the user record is how a card's text comes to
 * live in two places.
 *
 * An ordered list rather than a multiset, even though the deal will not care
 * about order: the screen shows nine positions, and removing "the second of
 * three Crawlids" needs a position to name. A multiset would make every
 * removal ambiguous.
 */
export interface Deck {
  /** Zero to `DECK_SIZE` cards, duplicates permitted, contiguous from the first. */
  readonly cards: readonly CardKey[];
}

/** How many decks a player may hold at once. */
export const MAX_DECKS = 9;

/**
 * How many cards a deck holds when full.
 *
 * Stated as `HAND_SIZE` rather than as a second `9`: a deck is a hand's worth
 * of cards, which is *why* it is nine, and when the deal eventually reads a
 * deck the two must not have been separately declared. `MAX_DECKS` is its own
 * constant — nine decks is a different nine, and its equality with the hand is
 * a coincidence.
 */
export const DECK_SIZE = HAND_SIZE;

/** An empty deck. */
export function emptyDeck(): Deck {
  return { cards: [] };
}

/**
 * What a deck is called: its position in the list, one-based.
 *
 * There is no stored name and nothing to type, so deleting Deck 2 genuinely
 * renames Deck 3 — which is the stated behaviour, not a defect to work around.
 */
export function deckName(deckIndex: number): string {
  return `Deck ${deckIndex + 1}`;
}

// ─── Operations ─────────────────────────────────────────────────────────────
//
// Every operation is a pure function over the whole `UserState` rather than
// over a `Deck`, because the rules need more than one deck: the unlocked-card
// gate reads the collection and the deck limit reads the list. Writing them
// against a bare `Deck` would push those two rules into the service, beside
// the signal, where they could not be tested without one.
//
// `null` is the refusal. Every refused operation must change nothing, report
// that it did not happen, and raise nothing: returning `UserState | null`
// makes a half-applied state unrepresentable, and the caller reads as
// `const next = addCardToDeck(...); if (!next) return false;`.

/** The user with one more empty deck on the end, or `null` at `MAX_DECKS`. */
export function createDeck(state: UserState): UserState | null {
  if (state.decks.length >= MAX_DECKS) return null;
  return { ...state, decks: [...state.decks, emptyDeck()] };
}

/** The user without that deck, or `null` for an index no deck occupies. */
export function deleteDeck(state: UserState, deckIndex: number): UserState | null {
  if (!holdsDeck(state, deckIndex)) return null;
  return { ...state, decks: state.decks.filter((_, i) => i !== deckIndex) };
}

/**
 * The user with `card` in that deck's first free position, or `null`.
 *
 * Refused when the index names no deck, when the deck is already full, or when
 * the collection holds no copy of the card. Quantity is *not* a limit beyond
 * that: one copy held permits nine in this deck and the same card in every
 * other deck at once, and nothing about the collection changes.
 */
export function addCardToDeck(state: UserState, deckIndex: number, card: Card): UserState | null {
  if (!holdsDeck(state, deckIndex)) return null;
  const deck = state.decks[deckIndex];
  if (deck.cards.length >= DECK_SIZE) return null;
  if (quantityOf(state.collection, card) === 0) return null;

  return replaceDeck(state, deckIndex, { cards: [...deck.cards, cardKey(card)] });
}

/**
 * The user without the card at that position, the deck closing up behind it,
 * or `null` for a position no card occupies.
 */
export function removeCardFromDeck(
  state: UserState,
  deckIndex: number,
  position: number,
): UserState | null {
  if (!holdsDeck(state, deckIndex)) return null;
  const deck = state.decks[deckIndex];
  if (!Number.isInteger(position) || position < 0 || position >= deck.cards.length) return null;

  return replaceDeck(state, deckIndex, {
    cards: deck.cards.filter((_, i) => i !== position),
  });
}

function holdsDeck(state: UserState, deckIndex: number): boolean {
  return Number.isInteger(deckIndex) && deckIndex >= 0 && deckIndex < state.decks.length;
}

function replaceDeck(state: UserState, deckIndex: number, deck: Deck): UserState {
  const decks = [...state.decks];
  decks[deckIndex] = deck;
  return { ...state, decks };
}
