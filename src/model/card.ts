export type CardType = 'P' | 'M' | 'X' | 'A';
export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface CardStats {
  attack: number;   // 0–15 (displayed as hex 0–F)
  physDef: number;  // 0–15
  magDef: number;   // 0–15
  type: CardType;
  arrows: Direction[];
}

export class Card {
  private readonly defaultImage = 'crawlid.webp';

  name: string = 'Name';
  rarity: number = 1;
  image: string = '';
  stats: CardStats;

  constructor(name: string, rarity: number, image?: string, stats?: Partial<CardStats>) {
    this.name = name;
    this.rarity = rarity;
    this.image = '/images/' + (image || this.defaultImage);
    this.stats = { ...defaultStats(rarity), ...stats };
  }
}

function defaultStats(rarity: number): CardStats {
  const types: CardType[] = ['P', 'M', 'X', 'A'];
  return {
    attack: Math.min(15, rarity * 2 + 1),
    physDef: Math.min(15, rarity * 2),
    magDef: Math.min(15, rarity * 2),
    type: types[rarity % types.length],
    arrows: ['N', 'E'],
  };
}

export const CARD_DB: Card[] = [
  new Card('Crawlid', 1, 'crawlid.webp',           { attack: 1,  physDef: 1,  magDef: 0,  type: 'P', arrows: ['N'] }),
  new Card('Gruz Mother', 3, 'gruz-mother.png',     { attack: 7,  physDef: 6,  magDef: 3,  type: 'P', arrows: ['N', 'S', 'E', 'W'] }),
  new Card('Vengefly King', 3, 'vengefly-king.webp',{ attack: 6,  physDef: 4,  magDef: 5,  type: 'M', arrows: ['N', 'NE', 'NW'] }),
  new Card('Aspid Hunter', 2, 'aspid-hunter.webp',  { attack: 4,  physDef: 2,  magDef: 3,  type: 'P', arrows: ['N', 'E'] }),
  new Card('Aspid Mother', 2, 'aspid-mother.webp',  { attack: 5,  physDef: 3,  magDef: 4,  type: 'M', arrows: ['N', 'S'] }),
  new Card('Goam', 4, 'goam.webp',                  { attack: 9,  physDef: 8,  magDef: 5,  type: 'X', arrows: ['N', 'E', 'SE', 'SW'] }),
  new Card('Vengefly', 1, 'vengefly.webp',           { attack: 2,  physDef: 1,  magDef: 2,  type: 'M', arrows: ['N', 'NE'] }),
  new Card('Gruzzer', 1, 'gruzzer.webp',             { attack: 1,  physDef: 2,  magDef: 1,  type: 'P', arrows: ['S'] }),
  new Card('Tiktik', 1, 'tiktik.webp',               { attack: 2,  physDef: 1,  magDef: 1,  type: 'P', arrows: ['W', 'E'] }),
  new Card('Aspid Hatchling', 1, undefined,          { attack: 1,  physDef: 0,  magDef: 1,  type: 'P', arrows: ['N'] }),
  new Card('Wandering Husk', 1, undefined,           { attack: 1,  physDef: 2,  magDef: 0,  type: 'P', arrows: ['E'] }),
  new Card('Husk Hornhead', 1, undefined,            { attack: 2,  physDef: 1,  magDef: 1,  type: 'P', arrows: ['N', 'W'] }),
  new Card('Leaping Husk', 1, undefined,             { attack: 3,  physDef: 1,  magDef: 1,  type: 'X', arrows: ['N', 'SE'] }),
  new Card('Husk Bully', 1, undefined,               { attack: 2,  physDef: 3,  magDef: 0,  type: 'P', arrows: ['S', 'W'] }),
  new Card('Husk Warrior', 2, undefined,             { attack: 4,  physDef: 3,  magDef: 2,  type: 'P', arrows: ['N', 'E', 'S'] }),
];
