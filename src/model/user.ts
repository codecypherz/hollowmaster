import { Card, CardKey, CARD_BY_KEY, STARS_MAX, cardKey, cardKeyOf } from './card';
import { DECK_SIZE, Deck, MAX_DECKS, emptyDeck } from './deck';

/**
 * What the player has at some time held, whatever they hold now. Each only ever
 * rises, through `withMilestones`.
 */
export interface Milestones {
  /** The highest Rosary balance ever held. */
  readonly peakRosaries: number;
  /** The highest star rating of any card ever held; zero before the first. */
  readonly rarestHeld: number;
}

/**
 * Everything a player owns: the cards they hold, the Geo and the Rosaries they
 * can spend, the decks they have built, and the milestones they have reached.
 *
 * None is derived from another, and the whole shape is plain data — no
 * class, no methods — so serializing it is a near-identity mapping rather than
 * a translation layer. The operations that change it are the pure functions
 * below; `UserService` is what holds one of these and publishes it.
 */
export interface UserState {
  /** Whole number of Geo, never negative. */
  readonly geo: number;
  /** Whole number of Rosaries, never negative. Earned by selling cards; see `exchange.ts`. */
  readonly rosaries: number;
  /**
   * How many copies of each card the player holds, keyed by catalogue identity.
   * A card absent from the map is owned zero times — read it through
   * `quantityOf` so no caller has to special-case absence.
   */
  readonly collection: ReadonlyMap<CardKey, number>;
  /**
   * The decks the player has built, in their own order. A deck is named by its
   * position, so this array *is* the naming — see `deck.ts`, which holds the
   * rules that bound it and the operations that change it.
   */
  readonly decks: readonly Deck[];
  /**
   * The position of the deck last chosen for battle, or `null` for none. Kept
   * pointing at the same deck by `deleteDeck`; not cleared when that deck stops
   * being Ready — it only stops being the default. See `deck.ts`.
   */
  readonly battleDeck: number | null;
  /** Bounded below by what is held now, but not derivable from it. */
  readonly milestones: Milestones;
}

/**
 * The nine cards a new player starts with — Crawlid, Vengefly, Gruzzer,
 * Tiktik, Aspid Hatchling, Wandering Husk, Husk Hornhead, Leaping Husk, and
 * Husk Bully.
 *
 * Nine is `HAND_SIZE`: a new player owns exactly enough cards to field a hand,
 * and every one of them is the weakest rarity, so the Shop has somewhere to
 * go. They were chosen when they were exactly the one-star cards; the
 * catalogue has since gained others, and the set did not follow them. That is
 * why it is *stated* rather than derived: "every one-star card" would silently
 * change both the starter set and how many cards a new player gets each time a
 * one-star card is catalogued.
 */
export const STARTER_CARD_KEYS: readonly CardKey[] = Object.freeze([
  cardKeyOf('FC', 1), // Crawlid
  cardKeyOf('FC', 3), // Vengefly
  cardKeyOf('FC', 5), // Gruzzer
  cardKeyOf('FC', 2), // Tiktik
  cardKeyOf('FC', 9), // Aspid Hatchling
  cardKeyOf('FC', 11), // Wandering Husk
  cardKeyOf('FC', 12), // Husk Hornhead
  cardKeyOf('FC', 13), // Leaping Husk
  cardKeyOf('FC', 14), // Husk Bully
] as const);

/** How many cards a new player is seeded with. */
const STARTER_COUNT = 9;

/**
 * The starter list names cards by identity, so it can name one the catalogue
 * does not hold. Like the catalogue's own uniqueness check this runs at module
 * load, so a mis-stated key fails at app start rather than seeding a player a
 * card short.
 */
function assertStarterSet(keys: readonly CardKey[]): void {
  if (keys.length !== STARTER_COUNT) {
    throw new Error(`The starter set must hold exactly ${STARTER_COUNT} cards, got ${keys.length}`);
  }
  for (const key of keys) {
    if (!CARD_BY_KEY.has(key)) {
      throw new Error(`Starter card ${key} is not in the catalogue`);
    }
  }
}

assertStarterSet(STARTER_CARD_KEYS);

/**
 * A user with no prior data: no Geo, no Rosaries, one copy of each starter card, and one
 * empty deck, so the Decks page has somewhere to build on first arrival.
 */
export function seedUser(): UserState {
  return withMilestones({
    geo: 0,
    rosaries: 0,
    collection: new Map(STARTER_CARD_KEYS.map((key) => [key, 1])),
    decks: [emptyDeck()],
    battleDeck: null,
    milestones: NO_MILESTONES,
  });
}

// ─── Milestones ─────────────────────────────────────────────────────────────

/** Nothing ever held: what `withMilestones` raises from. */
export const NO_MILESTONES: Milestones = Object.freeze({ peakRosaries: 0, rarestHeld: 0 });

/**
 * The user with each milestone raised to what their balance and collection now
 * prove, or the same object when neither is passed. Run on every settled state
 * rather than by the operations that earn, so a new way of gaining cards or
 * Rosaries cannot forget to.
 */
export function withMilestones(state: UserState): UserState {
  const { peakRosaries, rarestHeld } = state.milestones;
  const peak = Math.max(peakRosaries, state.rosaries);
  let rarest = rarestHeld;
  for (const key of state.collection.keys()) {
    rarest = Math.max(rarest, CARD_BY_KEY.get(key)?.stars ?? 0);
  }
  if (peak === peakRosaries && rarest === rarestHeld) return state;
  return { ...state, milestones: { peakRosaries: peak, rarestHeld: rarest } };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** How many copies of `card` the collection holds. Zero for one never owned. */
export function quantityOf(collection: ReadonlyMap<CardKey, number>, card: Card): number {
  return collection.get(cardKey(card)) ?? 0;
}

/**
 * The collection with `cards` added to it, one quantity each. Returns a new
 * map: the caller's collection is never touched, so a grant that is part of a
 * larger step can be discarded by simply not using the result.
 */
export function grantAll(
  collection: ReadonlyMap<CardKey, number>,
  cards: readonly Card[],
): ReadonlyMap<CardKey, number> {
  const next = new Map(collection);
  for (const card of cards) {
    const key = cardKey(card);
    next.set(key, (next.get(key) ?? 0) + 1);
  }
  return next;
}

/** Every copy of every card — three of one and one of another is four. */
export function totalCards(collection: ReadonlyMap<CardKey, number>): number {
  let total = 0;
  for (const quantity of collection.values()) total += quantity;
  return total;
}

/** How many different cards are held, regardless of quantity. */
export function distinctCards(collection: ReadonlyMap<CardKey, number>): number {
  return collection.size;
}

// ─── Persistence ────────────────────────────────────────────────────────────

/**
 * The shape persisted data is written in.
 *
 * Version 1 held a collection and a balance; version 2 adds the decks; version
 * 3 adds the Rosary balance; version 4 adds the milestones; version 5 adds
 * the remembered battle deck; version 6 changes no field but renumbers the
 * cards, so every earlier record names its cards by the first catalogue's
 * numbers and is translated through `FIRST_CATALOGUE_RENUMBERING`. A read
 * dispatches on the version rather than demanding equality: a version this
 * application knows an *earlier* shape for is upgraded, because an earlier
 * record is a complete user of its own time and a player must not lose their
 * collection or their Geo because the shape around it grew. A version it knows
 * nothing about is still unreadable rather than hopefully-current.
 */
export const SCHEMA_VERSION = 6;

/** The first shape written: a collection and a balance, and no decks. */
const VERSION_WITHOUT_DECKS = 1;

/** The second shape: decks beside the collection and the Geo, but no Rosaries. */
const VERSION_WITHOUT_ROSARIES = 2;

/** The third shape: Rosaries beside the rest, but no milestones. */
const VERSION_WITHOUT_MILESTONES = 3;

/** The fourth shape: milestones beside the rest, but no remembered battle deck. */
const VERSION_WITHOUT_BATTLE_DECK = 4;

/** The fifth shape: the current fields, but cards numbered by the first catalogue. */
const VERSION_BEFORE_RENUMBERING = 5;

/** One first-catalogue card: the number it was stored under, its name, and its number now. */
export interface Renumbering {
  readonly from: number;
  readonly name: string;
  readonly to: number;
}

/**
 * Where each of the first catalogue's fifteen `FC` cards went when the
 * catalogue was renumbered. The old catalogue no longer exists, so this table
 * is the only record of what a number in an old save meant; `name` is what
 * lets `assertRenumbering` prove at module load that every row still lands on
 * the card it names. A first-catalogue number absent here named no card.
 */
export const FIRST_CATALOGUE_RENUMBERING: readonly Renumbering[] = Object.freeze([
  { from: 1, name: 'Crawlid', to: 1 },
  { from: 2, name: 'Gruz Mother', to: 6 },
  { from: 3, name: 'Vengefly King', to: 4 },
  { from: 4, name: 'Aspid Hunter', to: 7 },
  { from: 5, name: 'Aspid Mother', to: 8 },
  { from: 6, name: 'Goam', to: 10 },
  { from: 7, name: 'Vengefly', to: 3 },
  { from: 8, name: 'Gruzzer', to: 5 },
  { from: 9, name: 'Tiktik', to: 2 },
  { from: 10, name: 'Aspid Hatchling', to: 9 },
  { from: 11, name: 'Wandering Husk', to: 11 },
  { from: 12, name: 'Husk Hornhead', to: 12 },
  { from: 13, name: 'Leaping Husk', to: 13 },
  { from: 14, name: 'Husk Bully', to: 14 },
  { from: 15, name: 'Husk Warrior', to: 15 },
] as const);

/** The set the first catalogue's cards belonged to — the only set it had. */
const FIRST_CATALOGUE_SET = 'FC';

/**
 * Every row must land on a distinct catalogued card bearing its name. Runs at
 * module load, so a later edit that moves one of these cards again — without a
 * new schema version — fails at app start instead of silently changing what
 * players' saves hold.
 */
export function assertRenumbering(
  rows: readonly Renumbering[],
  byKey: ReadonlyMap<CardKey, Card> = CARD_BY_KEY,
): void {
  const from = new Set<number>();
  const to = new Set<number>();
  for (const row of rows) {
    const card = byKey.get(cardKeyOf(FIRST_CATALOGUE_SET, row.to));
    if (card?.name !== row.name) {
      throw new Error(
        `Renumbering row FC#${row.from} names ${row.name}, but FC#${row.to} is ${card?.name ?? 'no card'}`,
      );
    }
    if (from.has(row.from)) throw new Error(`Renumbering repeats FC#${row.from}`);
    if (to.has(row.to)) throw new Error(`Renumbering sends two cards to FC#${row.to}`);
    from.add(row.from);
    to.add(row.to);
  }
}

assertRenumbering(FIRST_CATALOGUE_RENUMBERING);

const RENUMBERED = new Map(FIRST_CATALOGUE_RENUMBERING.map((row) => [row.from, row.to]));

/**
 * A first-catalogue card reference in today's numbering, or `null` for a
 * number that named no card. A ref outside the first catalogue's set is left
 * alone: it named nothing then, and `fromPersisted` drops what is unknown now.
 */
/** How a read card reference reaches today's numbering, or `null` for none. */
type Translate = <T extends PersistedCardRef>(ref: T) => T | null;

/** A current record's reference, which already speaks today's numbering. */
function asWritten<T extends PersistedCardRef>(ref: T): T {
  return ref;
}

function renumber<T extends PersistedCardRef>(ref: T): T | null {
  if (ref.set !== FIRST_CATALOGUE_SET) return ref;
  const to = RENUMBERED.get(ref.number);
  return to === undefined ? null : { ...ref, number: to };
}

/** One card's holding, as it is stored: identity and quantity, nothing else. */
export interface PersistedEntry {
  readonly set: string;
  readonly number: number;
  readonly quantity: number;
}

/** One card's identity, as a deck position stores it. No quantity: a deck
    position holds exactly one card, and the position is the count. */
export interface PersistedCardRef {
  readonly set: string;
  readonly number: number;
}

/** One deck, as it is stored: its cards' identities in the deck's own order. */
export type PersistedDeck = readonly PersistedCardRef[];

/**
 * The whole persisted record.
 *
 * The collection is an array of self-describing entries rather than an object
 * keyed by `FC#7`, because a composite key would have to be parsed back out of
 * a string and a hand-inspected record should say what its fields are. This is
 * the one place the array shape beats the map shape, and it is a boundary, so
 * the conversion is paid once on each side. The decks follow the same rule,
 * minus the quantity.
 *
 * Card *properties* — name, artwork, stats, arrows, ability — are deliberately
 * absent: a card's text can be rewritten without invalidating anyone's save.
 *
 * `version` is the version the record was *read* at, not the one it will be
 * written at. An upgraded record still reports the version it came from, which
 * is how the loader knows to write it back at the current one.
 */
export interface PersistedUser {
  readonly version: number;
  readonly geo: number;
  readonly rosaries: number;
  readonly collection: readonly PersistedEntry[];
  readonly decks: readonly PersistedDeck[];
  /** The remembered battle deck's position, or `null` for none. */
  readonly battleDeck: number | null;
  /** As the record states them; `fromPersisted` lifts them to what it proves. */
  readonly milestones: Milestones;
}

export function toPersisted(state: UserState): PersistedUser {
  const collection: PersistedEntry[] = [];
  for (const [key, quantity] of state.collection) {
    const card = CARD_BY_KEY.get(key);
    if (!card) continue;
    collection.push({ set: card.set, number: card.number, quantity });
  }

  const decks: PersistedDeck[] = state.decks.map((deck) => {
    const cards: PersistedCardRef[] = [];
    for (const key of deck.cards) {
      const card = CARD_BY_KEY.get(key);
      if (!card) continue;
      cards.push({ set: card.set, number: card.number });
    }
    return cards;
  });

  return {
    version: SCHEMA_VERSION,
    geo: state.geo,
    rosaries: state.rosaries,
    collection,
    decks,
    battleDeck: state.battleDeck,
    milestones: state.milestones,
  };
}

/**
 * Reads a stored record back, or reports that it cannot.
 *
 * `card.ts` throws on invalid input because its input is hand-authored source.
 * This is the application's first *external* input and the opposite rule
 * applies: it never throws. A malformed envelope — an unrecognised version, a
 * wrong root shape, an impossible balance — costs the whole record and the
 * caller seeds a fresh user. A malformed *entry* costs only that entry, so one
 * unknown or corrupt card never costs the player the rest of their collection,
 * the rest of a deck, or their Geo. A milestone that cannot be read costs only
 * itself.
 */
export function parsePersistedUser(raw: unknown): PersistedUser | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;

  const version = record['version'];
  if (
    version !== SCHEMA_VERSION &&
    version !== VERSION_BEFORE_RENUMBERING &&
    version !== VERSION_WITHOUT_BATTLE_DECK &&
    version !== VERSION_WITHOUT_MILESTONES &&
    version !== VERSION_WITHOUT_ROSARIES &&
    version !== VERSION_WITHOUT_DECKS
  ) {
    return null;
  }
  if (!isCount(record['geo'])) return null;

  // Records written before Rosaries existed upgrade to a user holding none. A
  // later record must state a possible balance, the same rule Geo follows.
  const beforeRosaries = version === VERSION_WITHOUT_DECKS || version === VERSION_WITHOUT_ROSARIES;
  const rosaries = beforeRosaries ? 0 : record['rosaries'];
  if (!isCount(rosaries)) return null;

  if (!Array.isArray(record['collection'])) return null;

  // Every record before the renumbering names its cards by the first
  // catalogue's numbers. They are translated here, as each is read, so that
  // `PersistedUser` always speaks today's numbering and `fromPersisted`'s
  // rules judge the translated cards. A number with no translation is dropped
  // like any other entry naming no card.
  const translate: Translate = version === SCHEMA_VERSION ? asWritten : renumber;

  const collection: PersistedEntry[] = [];
  for (const entry of record['collection'] as unknown[]) {
    const parsed = parseEntry(entry);
    const translated = parsed && translate(parsed);
    if (translated) collection.push(translated);
  }

  // A version 1 record predates decks entirely, so it upgrades to a user with
  // none rather than being discarded. A version 2 record whose `decks` is not
  // an array at all has lost only its decks — the same "one bad entry costs
  // one entry" rule the collection follows, applied to the whole field.
  const decks = version === VERSION_WITHOUT_DECKS ? [] : parseDecks(record['decks'], translate);

  // Before milestones a record states none, so it proves its own.
  const milestones =
    version === SCHEMA_VERSION ||
    version === VERSION_BEFORE_RENUMBERING ||
    version === VERSION_WITHOUT_BATTLE_DECK
      ? parseMilestones(record['milestones'])
      : NO_MILESTONES;

  // Before the battle deck was remembered a record remembers none. A later
  // value that is not a possible position costs only itself.
  const storedDeck =
    version === SCHEMA_VERSION || version === VERSION_BEFORE_RENUMBERING
      ? record['battleDeck']
      : null;
  const battleDeck = isCount(storedDeck) ? storedDeck : null;

  return { version, geo: record['geo'], rosaries, collection, decks, battleDeck, milestones };
}

/** Turns a read record back into state, dropping cards the catalogue has lost. */
export function fromPersisted(persisted: PersistedUser): UserState {
  const collection = new Map<CardKey, number>();
  for (const entry of persisted.collection) {
    const key = cardKeyOf(entry.set, entry.number);
    if (!CARD_BY_KEY.has(key)) continue;
    collection.set(key, (collection.get(key) ?? 0) + entry.quantity);
  }

  // A deck position survives only if the catalogue still holds the card *and*
  // the deck has not already kept as many copies of it as the restored
  // collection holds. That means no load can produce a deck using a card the
  // player has not unlocked, or more copies than they hold, so the rest of the
  // application never has to defend against either. The count is per deck —
  // the copy limit is not shared — and the earliest copies are the ones kept.
  const decks: Deck[] = persisted.decks.slice(0, MAX_DECKS).map((deck) => {
    const cards: CardKey[] = [];
    const kept = new Map<CardKey, number>();
    for (const ref of deck.slice(0, DECK_SIZE)) {
      const key = cardKeyOf(ref.set, ref.number);
      if (!CARD_BY_KEY.has(key)) continue;
      const copies = kept.get(key) ?? 0;
      if (copies >= (collection.get(key) ?? 0)) continue;
      kept.set(key, copies + 1);
      cards.push(key);
    }
    return { cards };
  });

  return withMilestones({
    geo: persisted.geo,
    rosaries: persisted.rosaries,
    collection,
    decks,
    // A position no restored deck occupies names nothing. One whose deck is
    // not Ready is kept: `user/decks` only passes it over as the default.
    battleDeck:
      persisted.battleDeck !== null && persisted.battleDeck < decks.length
        ? persisted.battleDeck
        : null,
    milestones: persisted.milestones,
  });
}

/** Each milestone alone: one that is not a possible value reads as nothing held. */
function parseMilestones(raw: unknown): Milestones {
  if (typeof raw !== 'object' || raw === null) return NO_MILESTONES;
  const { peakRosaries, rarestHeld } = raw as Record<string, unknown>;
  return {
    peakRosaries: isCount(peakRosaries) ? peakRosaries : 0,
    rarestHeld: isCount(rarestHeld) && rarestHeld <= STARS_MAX ? rarestHeld : 0,
  };
}

function parseDecks(raw: unknown, translate: Translate): PersistedDeck[] {
  if (!Array.isArray(raw)) return [];

  const decks: PersistedDeck[] = [];
  for (const deck of (raw as unknown[]).slice(0, MAX_DECKS)) {
    // A deck that is not a list of card identities at all is dropped whole;
    // every other deck is restored in full.
    if (!Array.isArray(deck)) continue;
    const cards: PersistedCardRef[] = [];
    for (const ref of (deck as unknown[]).slice(0, DECK_SIZE)) {
      const parsed = parseCardRef(ref);
      const translated = parsed && translate(parsed);
      if (translated) cards.push(translated);
    }
    decks.push(cards);
  }
  return decks;
}

function parseEntry(raw: unknown): PersistedEntry | null {
  const ref = parseCardRef(raw);
  if (!ref) return null;

  const quantity = (raw as Record<string, unknown>)['quantity'];
  // A quantity of zero is not a holding, and neither is a fraction or a
  // negative — none of them is a card the player owns.
  if (!isCount(quantity) || quantity === 0) return null;

  return { set: ref.set, number: ref.number, quantity };
}

function parseCardRef(raw: unknown): PersistedCardRef | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const entry = raw as Record<string, unknown>;

  const set = entry['set'];
  const number = entry['number'];
  if (typeof set !== 'string' || set === '') return null;
  if (!Number.isInteger(number) || (number as number) < 1) return null;

  return { set, number: number as number };
}

/** A whole number of zero or more — what both a balance and a quantity are. */
function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
