import { CARD_BY_KEY, Card, CardKey, cardKey } from './card';
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

/**
 * The rarity limit: a deck may hold at most `allowed` cards rated `minStars`
 * or higher.
 *
 * "Four or more" rather than "exactly four": ratings run to six, and a limit
 * that caught four-star cards while letting any number of five- and six-star
 * cards through would be backwards. Both numbers live here and nowhere else —
 * the standing, its message, and battle eligibility all read them.
 */
export const RARITY_LIMIT = Object.freeze({ minStars: 4, allowed: 2 });

/** One thing wrong with a deck. Invalid outranks Incomplete. */
export type DeckProblem =
  | {
      readonly kind: 'invalid';
      readonly rule: 'rarity';
      /** How many cards at or above `minStars` the deck holds. */
      readonly held: number;
      readonly allowed: number;
      readonly minStars: number;
    }
  | {
      readonly kind: 'incomplete';
      /** How many more cards the deck needs to be full. */
      readonly needed: number;
    };

/**
 * What a deck's contents say about it: every problem it has, most serious
 * first. An empty list is a Ready deck.
 */
export interface DeckStanding {
  readonly problems: readonly DeckProblem[];
}

/**
 * The deck's standing, worked out from its cards and nothing else.
 *
 * Derived, never stored: the same contents always give the same standing, so
 * there is nothing to persist and nothing to fall out of date. A key the
 * catalogue does not resolve still occupies a position — it counts toward
 * size — but has no rating to count toward rarity.
 *
 * `lookup` exists so tests can state ratings the catalogue does not yet hold.
 */
export function deckStanding(
  deck: Deck,
  lookup: (key: CardKey) => Card | undefined = (key) => CARD_BY_KEY.get(key),
): DeckStanding {
  const problems: DeckProblem[] = [];

  const held = deck.cards.filter(
    (key) => (lookup(key)?.stars ?? 0) >= RARITY_LIMIT.minStars,
  ).length;
  if (held > RARITY_LIMIT.allowed) {
    problems.push({
      kind: 'invalid',
      rule: 'rarity',
      held,
      allowed: RARITY_LIMIT.allowed,
      minStars: RARITY_LIMIT.minStars,
    });
  }

  const needed = DECK_SIZE - deck.cards.length;
  if (needed > 0) problems.push({ kind: 'incomplete', needed });

  return { problems };
}

/** Whether the deck may be taken into battle: only when nothing is wrong with it. */
export function isBattleReady(deck: Deck): boolean {
  return deckStanding(deck).problems.length === 0;
}

/**
 * A random Ready deck drawn from `db`: what the opponent is dealt.
 *
 * The database is shuffled and dealt through in order, reshuffling only once
 * the pool runs out, so no card is dealt a second time until every other card
 * has had its turn and a database smaller than a deck still fills one. Once
 * the rarity limit's allowance is held, any card at or above its threshold is
 * passed over — the opponent is held to the same rule as the player.
 *
 * Throws for a database with no card below the threshold, the one case where
 * no Ready deck can be built from it.
 */
export function randomReadyDeck(db: readonly Card[], rng: () => number): Deck {
  const isRare = (card: Card) => card.stars >= RARITY_LIMIT.minStars;
  if (!db.some((card) => !isRare(card))) {
    throw new Error('cannot deal a Ready deck from a database with no card below the rarity limit');
  }
  const cards: CardKey[] = [];
  let rare = 0;
  let pool: Card[] = [];
  while (cards.length < DECK_SIZE) {
    if (pool.length === 0) pool = shuffle(db, rng);
    const card = pool.pop()!;
    if (isRare(card)) {
      if (rare >= RARITY_LIMIT.allowed) continue;
      rare++;
    }
    cards.push(cardKey(card));
  }
  return { cards };
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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

/** `Deck 1`, `Deck 1 and Deck 3`, `Deck 1, Deck 2, and Deck 3`. */
export function listOf(names: readonly string[]): string {
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
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

/**
 * The user without that deck, or `null` for an index no deck occupies.
 *
 * The remembered battle deck names a position, so it is kept naming the same
 * deck: a deletion before it moves it down one, deleting it clears it, and a
 * deletion after it leaves it alone.
 */
export function deleteDeck(state: UserState, deckIndex: number): UserState | null {
  if (!holdsDeck(state, deckIndex)) return null;
  const remembered = state.battleDeck;
  const battleDeck =
    remembered === null || remembered < deckIndex
      ? remembered
      : remembered === deckIndex
        ? null
        : remembered - 1;
  return { ...state, decks: state.decks.filter((_, i) => i !== deckIndex), battleDeck };
}

/**
 * The user remembering that deck as the one chosen for battle, or `null` for
 * an index no deck occupies or a deck that is not `isBattleReady`.
 */
export function chooseBattleDeck(state: UserState, deckIndex: number): UserState | null {
  if (!holdsDeck(state, deckIndex)) return null;
  if (!isBattleReady(state.decks[deckIndex])) return null;
  return { ...state, battleDeck: deckIndex };
}

/**
 * The deck the deck selection screen opens on: the remembered one if it is
 * still Ready, else the first Ready deck, else `null`.
 *
 * Derived, never stored. A remembered deck that has stopped being Ready keeps
 * its record — it is only passed over here until it is Ready again.
 */
export function defaultBattleDeck(state: UserState): number | null {
  const remembered = state.battleDeck;
  if (
    remembered !== null &&
    holdsDeck(state, remembered) &&
    isBattleReady(state.decks[remembered])
  ) {
    return remembered;
  }
  const first = state.decks.findIndex(isBattleReady);
  return first === -1 ? null : first;
}

/** How many copies of `card` that deck holds. */
export function copiesInDeck(deck: Deck, card: Card): number {
  const key = cardKey(card);
  let copies = 0;
  for (const held of deck.cards) if (held === key) copies++;
  return copies;
}

/** A reason an addition is refused. */
export type AddRefusal = 'no-deck' | 'full' | 'unowned' | 'exhausted';

/**
 * Why adding `card` to that deck would be refused, or `null` when it would not.
 *
 * - `no-deck`: the index names no deck.
 * - `full`: the deck already holds `DECK_SIZE` cards.
 * - `unowned`: the collection holds no copy of the card.
 * - `exhausted`: the deck already holds as many copies as the collection does.
 *
 * `addCardToDeck` reads its refusal from here, so the page's "why not" can
 * never disagree with the operation itself. The rarity limit is deliberately
 * absent: it governs the deck's standing, not what editing allows.
 */
export function addRefusal(state: UserState, deckIndex: number, card: Card): AddRefusal | null {
  if (!holdsDeck(state, deckIndex)) return 'no-deck';
  const deck = state.decks[deckIndex];
  if (deck.cards.length >= DECK_SIZE) return 'full';
  const held = quantityOf(state.collection, card);
  if (held === 0) return 'unowned';
  if (copiesInDeck(deck, card) >= held) return 'exhausted';
  return null;
}

/**
 * The user with `card` in that deck's first free position, or `null`.
 *
 * Refused for any reason `addRefusal` gives. The quantity held bounds how many
 * copies *this* deck may hold, and only this deck: the bound is not shared, so
 * one copy held permits that card once in every deck at the same time. Nothing
 * about the collection changes — a card placed in a deck is not spent.
 */
export function addCardToDeck(state: UserState, deckIndex: number, card: Card): UserState | null {
  if (addRefusal(state, deckIndex, card) !== null) return null;
  const deck = state.decks[deckIndex];
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

/**
 * The decks with no more than `quantity` copies of `key` in any one of them.
 *
 * Decks do not consume cards, so a fall in the quantity held — a sale — can
 * leave a deck holding more copies than the collection does. Each such deck
 * loses its excess copies from its latest positions, keeping the earliest, as
 * `fromPersisted` does on load; the deck then closes up so its positions stay
 * contiguous. A deck within the quantity is returned as the same object, so
 * "which decks changed" is an identity comparison.
 */
export function trimDecks(decks: readonly Deck[], key: CardKey, quantity: number): readonly Deck[] {
  const allowed = Math.max(0, quantity);
  return decks.map((deck) => {
    let excess = deck.cards.filter((held) => held === key).length - allowed;
    if (excess <= 0) return deck;
    const cards = [...deck.cards];
    for (let i = cards.length - 1; i >= 0 && excess > 0; i--) {
      if (cards[i] === key) {
        cards.splice(i, 1);
        excess--;
      }
    }
    return { cards };
  });
}
