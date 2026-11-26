import { Deck } from '../model/deck';
import { STARTER_CARD_KEYS } from '../model/user';
import { cardKeyOf } from '../model/card';

/**
 * A Ready deck for specs: the nine starter cards, in starter order. Every one
 * is one star, so it is full and under the rarity limit by construction, and a
 * seeded user holds every card in it.
 */
export const READY_TEST_DECK: Deck = Object.freeze({ cards: [...STARTER_CARD_KEYS] });

/**
 * A Ready deck heavier in stars than any deck the opponent can be dealt from
 * the real database — two four-star Goams and seven three-star Gruz Mothers —
 * so a match begun with it always opens on the player's turn.
 */
export const HEAVY_TEST_DECK: Deck = Object.freeze({
  cards: [cardKeyOf('FC', 6), cardKeyOf('FC', 6), ...Array(7).fill(cardKeyOf('FC', 2))],
});
