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
 * The heaviest Ready deck the real database allows — two six-star cards
 * (Glowing Womb Aspid and Mace Bug), the most the rarity limit lets in, and
 * seven three-star Gruz Mothers — so a match begun with it opens on the
 * player's turn. No opponent deal can be heavier; one can only tie it by
 * drawing two six-star cards and seven three-star cards, which leaves the
 * opening to the coin.
 */
export const HEAVY_TEST_DECK: Deck = Object.freeze({
  cards: [cardKeyOf('FC', 41), cardKeyOf('FC', 42), ...Array(7).fill(cardKeyOf('FC', 6))],
});
