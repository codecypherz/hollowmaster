export class Card {

  private readonly defaultImage = "crawlid.webp";

  name: string = "Name";
  rarity: number = 1;
  image: string = "";

  constructor(name: string, rarity: number, image?: string) {
    this.name = name;
    this.rarity = rarity;
    this.image = "/images/"+(image || this.defaultImage);
  }
}

export const CARD_DB: Card[] = [
  new Card('Crawlid', 1, "crawlid.webp"),
  new Card('Gruz Mother', 3, "gruz-mother.png"),
  new Card('Vengefly King', 3, "vengefly-king.webp"),
  new Card('Aspid Hunter', 2, "aspid-hunter.webp"),
  new Card('Aspid Mother', 2, "aspid-mother.webp"),
  new Card('Goam', 4, "goam.webp"),
  new Card('Vengefly', 1, "vengefly.webp"),
  new Card('Gruzzer', 1, "gruzzer.webp"),
  new Card('Tiktik', 1, "tiktik.webp"),
  new Card('Aspid Hatchling', 1),
  new Card('Wandering Husk', 1),
  new Card('Husk Hornhead', 1),
  new Card('Leaping Husk', 1),
  new Card('Husk Bully', 1),
  new Card('Husk Warrior', 2)
];
