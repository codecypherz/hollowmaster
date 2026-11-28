export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

/** The eight compass directions a card's arrows may occupy, in compass order. */
export const DIRECTIONS: readonly Direction[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Everything a card must state about itself. Nothing here is defaulted or derived. */
export interface CardOptions {
  name: string;
  arrows: Direction[];
  stars: number;
  /** Bare artwork filename; the constructor resolves it under `/images/`. */
  image: string;
  attack: number;
  defense: number;
  ability: string;
  set: string;
  number: number;
}

/** The lowest and the highest rarity a card may have. */
export const STARS_MIN = 1;
export const STARS_MAX = 6;
const STAT_MIN = 1;
const STAT_MAX = 100;

/**
 * A single card.
 *
 * Every property is stated by the card's author — none is calculated from
 * another — and the constructor rejects anything out of range. Card definitions
 * are static and hand-written, so an invalid card is a defect to surface at
 * once, not a condition to recover from. That guarantee is what lets renderers
 * read `stars`, `attack`, and `defense` without clamping them.
 */
export class Card {
  readonly name: string;
  readonly arrows: readonly Direction[];
  readonly stars: number;
  /** Resolved artwork path, e.g. `/images/crawlid.webp`. */
  readonly image: string;
  readonly attack: number;
  readonly defense: number;
  /** The card's rules text. The ability has no name — the text is the whole of it. */
  readonly ability: string;
  readonly set: string;
  readonly number: number;

  constructor(options: CardOptions) {
    this.name = requireText('name', options.name);
    this.ability = requireText('ability', options.ability);
    this.set = requireText('set', options.set);
    this.stars = requireInteger('stars', options.stars, STARS_MIN, STARS_MAX);
    this.attack = requireInteger('attack', options.attack, STAT_MIN, STAT_MAX);
    this.defense = requireInteger('defense', options.defense, STAT_MIN, STAT_MAX);
    this.number = requireInteger('number', options.number, 1, Number.MAX_SAFE_INTEGER);
    this.image = '/images/' + requireText('image', options.image);
    this.arrows = Object.freeze(requireArrows(options.arrows));
  }

  hasArrow(dir: Direction): boolean {
    return this.arrows.includes(dir);
  }
}

function requireText(field: string, value: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`Card ${field} must be non-empty text, got ${JSON.stringify(value)}`);
  }
  return value;
}

function requireInteger(field: string, value: number, min: number, max: number): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new TypeError(`Card ${field} must be a whole number from ${min} to ${max}, got ${value}`);
  }
  return value;
}

function requireArrows(arrows: Direction[]): Direction[] {
  if (!Array.isArray(arrows)) {
    throw new TypeError(`Card arrows must be an array, got ${JSON.stringify(arrows)}`);
  }
  const seen = new Set<Direction>();
  for (const dir of arrows) {
    if (!DIRECTIONS.includes(dir)) {
      throw new TypeError(`Card arrows contains an unknown direction ${JSON.stringify(dir)}`);
    }
    if (seen.has(dir)) {
      throw new TypeError(`Card arrows repeats the direction ${JSON.stringify(dir)}`);
    }
    seen.add(dir);
  }
  return [...arrows];
}

/** The set every card in the database belongs to. `FC` is the set's name, not
    an abbreviation of it — the face prints it verbatim. */
const FC = 'FC';

export const CARD_DB: Card[] = [
  new Card({
    name: 'Crawlid',
    arrows: ['E', 'W'],
    stars: 1,
    image: 'crawlid.png',
    attack: 1,
    defense: 5,
    ability: 'None',
    set: FC,
    number: 1,
  }),
  new Card({
    name: 'Tiktik',
    arrows: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
    stars: 1,
    image: 'tiktik.png',
    attack: 7,
    defense: 5,
    ability: 'To be added',
    set: FC,
    number: 2,
  }),
  new Card({
    name: 'Vengefly',
    arrows: ['N', 'NE', 'E', 'W', 'NW'],
    stars: 1,
    image: 'vengefly.png',
    attack: 3,
    defense: 4,
    ability: 'To be added',
    set: FC,
    number: 3,
  }),
  new Card({
    name: 'Vengefly King',
    arrows: ['E', 'SE', 'S', 'SW', 'W'],
    stars: 3,
    image: 'vengefly-king.png',
    attack: 35,
    defense: 28,
    ability: 'To be added',
    set: FC,
    number: 4,
  }),
  new Card({
    name: 'Gruzzer',
    arrows: ['E', 'S', 'NW'],
    stars: 1,
    image: 'gruzzer.png',
    attack: 2,
    defense: 2,
    ability: 'To be added',
    set: FC,
    number: 5,
  }),
  new Card({
    name: 'Gruz Mother',
    arrows: ['NE', 'E', 'SW', 'W'],
    stars: 3,
    image: 'gruz-mother.png',
    attack: 34,
    defense: 34,
    ability: 'To be added',
    set: FC,
    number: 6,
  }),
  new Card({
    name: 'Aspid Hunter',
    arrows: ['SE', 'SW', 'W', 'NW'],
    stars: 2,
    image: 'aspid-hunter.png',
    attack: 23,
    defense: 10,
    ability: 'To be added',
    set: FC,
    number: 7,
  }),
  new Card({
    name: 'Aspid Mother',
    arrows: ['SE', 'S', 'SW'],
    stars: 2,
    image: 'aspid-mother.png',
    attack: 11,
    defense: 21,
    ability: 'To be added',
    set: FC,
    number: 8,
  }),
  new Card({
    name: 'Aspid Hatchling',
    arrows: ['N', 'S'],
    stars: 1,
    image: 'aspid-hatchling.png',
    attack: 3,
    defense: 1,
    ability: 'To be added',
    set: FC,
    number: 9,
  }),
  new Card({
    name: 'Goam',
    arrows: ['N', 'NE', 'E', 'SE', 'SW', 'W', 'NW'],
    stars: 3,
    image: 'goam.png',
    attack: 52,
    defense: 20,
    ability: 'To be added',
    set: FC,
    number: 10,
  }),
  new Card({
    name: 'Wandering Husk',
    arrows: ['NE', 'E', 'SE', 'W'],
    stars: 1,
    image: 'wandering-husk.png',
    attack: 5,
    defense: 8,
    ability: 'To be added',
    set: FC,
    number: 11,
  }),
  new Card({
    name: 'Husk Hornhead',
    arrows: ['E', 'S', 'SW'],
    stars: 1,
    image: 'husk-hornhead.png',
    attack: 10,
    defense: 4,
    ability: 'To be added',
    set: FC,
    number: 12,
  }),
  new Card({
    name: 'Leaping Husk',
    arrows: ['N', 'E', 'SE', 'S', 'W', 'NW'],
    stars: 1,
    image: 'leaping-husk.png',
    attack: 6,
    defense: 6,
    ability: 'To be added',
    set: FC,
    number: 13,
  }),
  new Card({
    name: 'Husk Bully',
    arrows: ['NE', 'SE', 'SW'],
    stars: 1,
    image: 'husk-bully.png',
    attack: 3,
    defense: 9,
    ability: 'To be added',
    set: FC,
    number: 14,
  }),
  new Card({
    name: 'Husk Warrior',
    arrows: ['E', 'SW', 'W', 'NW'],
    stars: 2,
    image: 'husk-warrior.png',
    attack: 25,
    defense: 5,
    ability: 'To be added',
    set: FC,
    number: 15,
  }),
  new Card({
    name: 'Husk Guard',
    arrows: ['N', 'NE', 'SW', 'W', 'NW'],
    stars: 2,
    image: 'husk-guard.png',
    attack: 32,
    defense: 21,
    ability: 'To be added',
    set: FC,
    number: 16,
  }),
  new Card({
    name: 'False Knight',
    arrows: ['NE', 'E', 'SE', 'S', 'SW'],
    stars: 4,
    image: 'false-knight.png',
    attack: 45,
    defense: 65,
    ability: 'To be added',
    set: FC,
    number: 17,
  }),
  new Card({
    name: 'Failed Champion',
    arrows: ['NE', 'SE', 'S', 'SW', 'W', 'NW'],
    stars: 4,
    image: 'failed-champion.png',
    attack: 63,
    defense: 47,
    ability: 'To be added',
    set: FC,
    number: 18,
  }),
  new Card({
    name: 'Maggot',
    arrows: ['NW'],
    stars: 1,
    image: 'maggot.png',
    attack: 6,
    defense: 2,
    ability: 'To be added',
    set: FC,
    number: 19,
  }),
  new Card({
    name: 'Mender Bug',
    arrows: ['E', 'S', 'SW'],
    stars: 5,
    image: 'mender-bug.png',
    attack: 61,
    defense: 72,
    ability: 'To be added',
    set: FC,
    number: 20,
  }),
  new Card({
    name: 'Life Seed',
    arrows: ['NE', 'W', 'NW'],
    stars: 1,
    image: 'life-seed.png',
    attack: 3,
    defense: 3,
    ability: 'To be added',
    set: FC,
    number: 21,
  }),
  new Card({
    name: "Lifeblood Cocoon (King's Pass)",
    arrows: ['NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
    stars: 2,
    image: 'lifeblood-kp.png',
    attack: 22,
    defense: 22,
    ability: 'To be added',
    set: FC,
    number: 22,
  }),
  new Card({
    name: 'Lifeblood Cocoon (Ancestral Mound)',
    arrows: ['NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
    stars: 2,
    image: 'tbd.png',
    attack: 16,
    defense: 16,
    ability: 'To be added',
    set: FC,
    number: 23,
  }),
  new Card({
    name: 'Baulder',
    arrows: ['NE', 'SE', 'W', 'NW'],
    stars: 1,
    image: 'baulder.png',
    attack: 8,
    defense: 12,
    ability: 'To be added',
    set: FC,
    number: 24,
  }),
  new Card({
    name: 'Elder Baulder',
    arrows: ['N', 'E', 'S', 'SW'],
    stars: 2,
    image: 'elder-baulder.png',
    attack: 24,
    defense: 28,
    ability: 'To be added',
    set: FC,
    number: 25,
  }),
  new Card({
    name: 'Brooding Mawlek',
    arrows: ['NE', 'E', 'W', 'NW'],
    stars: 3,
    image: 'brooding-mawlek.png',
    attack: 37,
    defense: 43,
    ability: 'To be added',
    set: FC,
    number: 26,
  }),
  new Card({
    name: 'Tiso',
    arrows: ['NE'],
    stars: 1,
    image: 'tiso.png',
    attack: 1,
    defense: 14,
    ability: 'To be added',
    set: FC,
    number: 27,
  }),
  new Card({
    name: 'Sly',
    arrows: ['NE', 'E', 'SE', 'S', 'NW'],
    stars: 3,
    image: 'sly.png',
    attack: 41,
    defense: 39,
    ability: 'To be added',
    set: FC,
    number: 28,
  }),
  new Card({
    name: 'Nailmaster Sly',
    arrows: ['NE', 'S', 'SW', 'W', 'NW'],
    stars: 5,
    image: 'nailmaster-sly.png',
    attack: 81,
    defense: 53,
    ability: 'To be added',
    set: FC,
    number: 29,
  }),
  new Card({
    name: 'Snail Shaman',
    arrows: ['NE', 'E', 'S'],
    stars: 3,
    image: 'snail-shaman.png',
    attack: 66,
    defense: 33,
    ability: 'To be added',
    set: FC,
    number: 30,
  }),
  new Card({
    name: 'Confessor Jiji',
    arrows: ['N', 'SE', 'SW'],
    stars: 2,
    image: 'confessor-jiji.png',
    attack: 12,
    defense: 26,
    ability: 'To be added',
    set: FC,
    number: 31,
  }),
  new Card({
    name: 'Steel Soul Jinn',
    arrows: ['NE', 'S', 'NW'],
    stars: 4,
    image: 'steel-soul-jinn.png',
    attack: 62,
    defense: 56,
    ability: 'To be added',
    set: FC,
    number: 32,
  }),
  new Card({
    name: 'Iselda',
    arrows: ['NE', 'W'],
    stars: 1,
    image: 'iselda.png',
    attack: 10,
    defense: 18,
    ability: 'To be added',
    set: FC,
    number: 33,
  }),
  new Card({
    name: 'Cornifer (Forgotten Crossroads)',
    arrows: ['E', 'SE', 'SW', 'NW'],
    stars: 2,
    image: 'cornifer-fc.png',
    attack: 17,
    defense: 24,
    ability: 'To be added',
    set: FC,
    number: 34,
  }),
  new Card({
    name: 'Grub',
    arrows: ['N', 'E', 'SW', 'W'],
    stars: 1,
    image: 'grub.png',
    attack: 14,
    defense: 11,
    ability: 'To be added',
    set: FC,
    number: 35,
  }),
  new Card({
    name: 'Grubfather',
    arrows: ['NE', 'E', 'S', 'W'],
    stars: 4,
    image: 'grubfather.png',
    attack: 51,
    defense: 54,
    ability: 'To be added',
    set: FC,
    number: 36,
  }),
  new Card({
    name: 'Elder Bug',
    arrows: ['N', 'NE', 'SE', 'S', 'SW', 'W', 'NW'],
    stars: 1,
    image: 'elder-bug.png',
    attack: 6,
    defense: 20,
    ability: 'To be added',
    set: FC,
    number: 37,
  }),
  new Card({
    name: 'The Last Stag (Forgotten Crossroads)',
    arrows: ['N', 'NE', 'E', 'SE', 'S', 'W'],
    stars: 3,
    image: 'the-last-stag-fc.png',
    attack: 49,
    defense: 32,
    ability: 'To be added',
    set: FC,
    number: 38,
  }),
  new Card({
    name: 'Gravedigger',
    arrows: ['NE', 'S', 'SW'],
    stars: 1,
    image: 'gravedigger.png',
    attack: 12,
    defense: 9,
    ability: 'To be added',
    set: FC,
    number: 39,
  }),
  new Card({
    name: 'Colosseum Travelers',
    arrows: ['N', 'NE', 'SE', 'S', 'SW', 'W'],
    stars: 2,
    image: 'colosseum-travelers.png',
    attack: 33,
    defense: 18,
    ability: 'To be added',
    set: FC,
    number: 40,
  }),
  new Card({
    name: 'Glowing Womb Aspid',
    arrows: ['E', 'SW'],
    stars: 6,
    image: 'glowing-womb-aspid.png',
    attack: 84,
    defense: 80,
    ability: 'To be added',
    set: FC,
    number: 41,
  }),
  new Card({
    name: 'Mace Bug',
    arrows: ['N', 'E', 'S', 'W'],
    stars: 6,
    image: 'mace-bug.png',
    attack: 78,
    defense: 93,
    ability: 'To be added',
    set: FC,
    number: 42,
  }),
  new Card({
    name: 'Cornifer (Dirtmouth)',
    arrows: ['N', 'NE', 'E', 'NW'],
    stars: 6,
    image: 'cornifer-dm.png',
    attack: 93,
    defense: 81,
    ability: 'To be added',
    set: FC,
    number: 43,
  }),
];

/**
 * A card's catalogue identity as one string: its set, a `#`, and its number
 * within that set. `FC#7` is Vengefly. This is what a collection is keyed by
 * and what persisted data resolves against, so it is stated once here rather
 * than reassembled by every caller.
 */
export type CardKey = `${string}#${number}`;

export function cardKeyOf(set: string, number: number): CardKey {
  return `${set}#${number}`;
}

export function cardKey(card: Card): CardKey {
  return cardKeyOf(card.set, card.number);
}

/**
 * Every card by its key.
 *
 * A card can vouch for its own values, but not for its uniqueness. Building
 * this index *is* that check — a collision is a duplicate key — so the index
 * and the assertion are one pass rather than the same fact stated twice. It
 * runs once, when the module loads, so a collision fails at app start and in
 * tests rather than surfacing as two cards that look like one.
 */
export function indexByKey(cards: readonly Card[]): ReadonlyMap<CardKey, Card> {
  const index = new Map<CardKey, Card>();
  for (const card of cards) {
    const key = cardKey(card);
    if (index.has(key)) {
      throw new Error(`Duplicate card number ${card.number} in set "${card.set}"`);
    }
    index.set(key, card);
  }
  return index;
}

export const CARD_BY_KEY: ReadonlyMap<CardKey, Card> = indexByKey(CARD_DB);

/**
 * A card's collection number as the player reads it, e.g. `FC#1`: never
 * padded. Display text that happens to match `cardKey`, which is the identity:
 * this is never stored, looked up, or parsed back.
 */
export function collectionNumber(card: Card): string {
  return `${card.set}#${card.number}`;
}

// ─── Sets ───────────────────────────────────────────────────────────────────

/** A card set: the identity a card carries, and the name the player reads. */
export interface CardSet {
  /** The identity printed on the card face and stored with it, e.g. `FC`. */
  readonly id: string;
  /** What the set is called on screen, e.g. `Forgotten Crossroads`. */
  readonly name: string;
}

/**
 * Every set the application knows, in the order it presents them.
 *
 * Stated rather than derived from `CARD_DB`: a set is announced before its
 * cards are catalogued (the Greenpath and City of Tears pack posters already
 * exist), and a derived list could neither name nor order a set that holds
 * nothing yet.
 */
export const CARD_SETS: readonly CardSet[] = Object.freeze([
  Object.freeze({ id: 'FC', name: 'Forgotten Crossroads' }),
  Object.freeze({ id: 'GP', name: 'Greenpath' }),
  Object.freeze({ id: 'CT', name: 'City of Tears' }),
]);

/**
 * Checks that the sets are uniquely named and that every card belongs to one.
 * Run at module load beside `indexByKey`, so a card naming an unlisted set
 * fails at app start and in tests rather than vanishing from the Collection.
 * A set with no cards is allowed: it is forthcoming, not wrong.
 */
export function assertCatalogueSets(sets: readonly CardSet[], cards: readonly Card[]): void {
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const set of sets) {
    if (ids.has(set.id)) throw new Error(`Duplicate set id "${set.id}"`);
    if (names.has(set.name)) throw new Error(`Duplicate set name "${set.name}"`);
    ids.add(set.id);
    names.add(set.name);
  }
  for (const card of cards) {
    if (!ids.has(card.set)) {
      throw new Error(`Card "${card.name}" belongs to set "${card.set}", which is not a named set`);
    }
  }
}

assertCatalogueSets(CARD_SETS, CARD_DB);

/** The named set with that identity, or undefined for one the list does not hold. */
export function cardSet(id: string): CardSet | undefined {
  return CARD_SETS.find((set) => set.id === id);
}

/** Every catalogued card in that set, lowest number first. Empty for a forthcoming set. */
export function cardsInSet(id: string, cards: readonly Card[] = CARD_DB): Card[] {
  return cards.filter((card) => card.set === id).sort((a, b) => a.number - b.number);
}
