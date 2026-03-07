export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface CardStats {
  attack: number;   // 1–100 (whole numbers)
  defense: number;  // 1–100 (whole numbers)
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
  return {
    attack: Math.min(100, Math.max(1, rarity * 12 + 5)),
    defense: Math.min(100, Math.max(1, rarity * 10 + 5)),
    arrows: ['N', 'E'],
  };
}

export const CARD_DB: Card[] = [
  new Card('Crawlid', 1, 'crawlid.webp',            { attack: 5,  defense: 5,  arrows: ['N'] }),
  new Card('Gruz Mother', 3, 'gruz-mother.png',      { attack: 45, defense: 40, arrows: ['N', 'S', 'E', 'W'] }),
  new Card('Vengefly King', 3, 'vengefly-king.webp', { attack: 40, defense: 28, arrows: ['N', 'NE', 'NW'] }),
  new Card('Aspid Hunter', 2, 'aspid-hunter.webp',   { attack: 26, defense: 14, arrows: ['N', 'E'] }),
  new Card('Aspid Mother', 2, 'aspid-mother.webp',   { attack: 33, defense: 21, arrows: ['N', 'S'] }),
  new Card('Goam', 4, 'goam.webp',                   { attack: 58, defense: 52, arrows: ['N', 'E', 'SE', 'SW'] }),
  new Card('Vengefly', 1, 'vengefly.webp',            { attack: 12, defense: 7,  arrows: ['N', 'NE'] }),
  new Card('Gruzzer', 1, 'gruzzer.webp',              { attack: 7,  defense: 14, arrows: ['S'] }),
  new Card('Tiktik', 1, 'tiktik.webp',                { attack: 14, defense: 7,  arrows: ['W', 'E'] }),
  new Card('Aspid Hatchling', 1, undefined,           { attack: 5,  defense: 5,  arrows: ['N'] }),
  new Card('Wandering Husk', 1, undefined,            { attack: 5,  defense: 12, arrows: ['E'] }),
  new Card('Husk Hornhead', 1, undefined,             { attack: 12, defense: 7,  arrows: ['N', 'W'] }),
  new Card('Leaping Husk', 1, undefined,              { attack: 20, defense: 7,  arrows: ['N', 'SE'] }),
  new Card('Husk Bully', 1, undefined,                { attack: 12, defense: 20, arrows: ['S', 'W'] }),
  new Card('Husk Warrior', 2, undefined,              { attack: 26, defense: 20, arrows: ['N', 'E', 'S'] }),
];
