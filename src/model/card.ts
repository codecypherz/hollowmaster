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

const STARS_MIN = 1;
const STARS_MAX = 6;
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
    arrows: ['N'],
    stars: 1,
    image: 'crawlid.webp',
    attack: 5,
    defense: 5,
    ability:
      'Trundles the crossroads floor without malice, turning only where the stone runs out. ' +
      'Even a newly fallen wanderer may step over it unharmed.',
    set: FC,
    number: 1,
  }),
  new Card({
    name: 'Gruz Mother',
    arrows: ['N', 'S', 'E', 'W'],
    stars: 3,
    image: 'gruz-mother.png',
    attack: 45,
    defense: 40,
    ability:
      'Bloated with young, she drifts the tunnels until roused, then hurls her bulk from wall ' +
      'to wall. Her death spills a dozen squirming grubs into the dark.',
    set: FC,
    number: 2,
  }),
  new Card({
    name: 'Vengefly King',
    arrows: ['N', 'NE', 'NW'],
    stars: 3,
    image: 'vengefly-king.webp',
    attack: 40,
    defense: 28,
    ability:
      'Crowned by his swarm, he screeches from above and lets lesser flies close the distance. ' +
      'Cut down the escort and the king fights alone.',
    set: FC,
    number: 3,
  }),
  new Card({
    name: 'Aspid Hunter',
    arrows: ['N', 'E'],
    stars: 2,
    image: 'aspid-hunter.webp',
    attack: 26,
    defense: 14,
    ability:
      'Hangs at a careful distance and spits arcs of acid three at a time. ' +
      'It withdraws the moment a nail comes near.',
    set: FC,
    number: 4,
  }),
  new Card({
    name: 'Aspid Mother',
    arrows: ['N', 'S'],
    stars: 2,
    image: 'aspid-mother.webp',
    attack: 33,
    defense: 21,
    ability:
      'She births hatchlings without pause, filling a passage faster than a nail can clear it. ' +
      'Killing her ends the tide; ignoring her does not.',
    set: FC,
    number: 5,
  }),
  new Card({
    name: 'Goam',
    arrows: ['N', 'E', 'SE', 'SW'],
    stars: 4,
    image: 'goam.webp',
    attack: 58,
    defense: 52,
    ability:
      'Sleeps buried in the ceiling until a tremor wakes it, then falls as a spear of shell. ' +
      'Once it drops, nothing turns it aside.',
    set: FC,
    number: 6,
  }),
  new Card({
    name: 'Vengefly',
    arrows: ['N', 'NE'],
    stars: 1,
    image: 'vengefly.webp',
    attack: 12,
    defense: 7,
    ability:
      'Darts in erratic loops and strikes only from behind. ' +
      'Alone it is a nuisance; in numbers it is a storm.',
    set: FC,
    number: 7,
  }),
  new Card({
    name: 'Gruzzer',
    arrows: ['S'],
    stars: 1,
    image: 'gruzzer.webp',
    attack: 7,
    defense: 14,
    ability:
      'Bounces blindly through the tunnels, caroming off stone with no thought for its course. ' +
      'Harmless until it drifts between a wanderer and the way out.',
    set: FC,
    number: 8,
  }),
  new Card({
    name: 'Tiktik',
    arrows: ['W', 'E'],
    stars: 1,
    image: 'tiktik.webp',
    attack: 14,
    defense: 7,
    ability:
      'Clings to the walls behind a shell of grey stone, ticking as it crawls. ' +
      'Its armour turns aside all but a well-struck blow.',
    set: FC,
    number: 9,
  }),
  new Card({
    name: 'Aspid Hatchling',
    arrows: ['N'],
    stars: 1,
    image: 'crawlid.webp',
    attack: 5,
    defense: 5,
    ability:
      'Newly spat from its mother and already spitting in turn. Weak alone, and never alone.',
    set: FC,
    number: 10,
  }),
  new Card({
    name: 'Wandering Husk',
    arrows: ['E'],
    stars: 1,
    image: 'crawlid.webp',
    attack: 5,
    defense: 12,
    ability:
      'A vessel long hollowed by the infection, still walking the roads it walked in life. ' +
      'It swings without aim and never stops.',
    set: FC,
    number: 11,
  }),
  new Card({
    name: 'Husk Hornhead',
    arrows: ['N', 'W'],
    stars: 1,
    image: 'crawlid.webp',
    attack: 12,
    defense: 7,
    ability:
      'Lowers its horned skull and charges the length of a corridor. ' +
      'The horn breaks before the husk does.',
    set: FC,
    number: 12,
  }),
  new Card({
    name: 'Leaping Husk',
    arrows: ['N', 'SE'],
    stars: 1,
    image: 'crawlid.webp',
    attack: 20,
    defense: 7,
    ability:
      'Springs across the gap a wanderer thought safe, arms flailing before it lands. ' +
      'The leap is its only remaining thought.',
    set: FC,
    number: 13,
  }),
  new Card({
    name: 'Husk Bully',
    arrows: ['S', 'W'],
    stars: 1,
    image: 'crawlid.webp',
    attack: 12,
    defense: 20,
    ability:
      'Grown fat on infected orange, it rolls forward heedless of the nail. ' +
      'Its flesh smothers a strike before the strike can bite.',
    set: FC,
    number: 14,
  }),
  new Card({
    name: 'Husk Warrior',
    arrows: ['N', 'E', 'S'],
    stars: 2,
    image: 'crawlid.webp',
    attack: 26,
    defense: 20,
    ability:
      'It remembers the drill of the guard even with its mind burned away. ' +
      'It parries, steps, and strikes as it was taught to.',
    set: FC,
    number: 15,
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
