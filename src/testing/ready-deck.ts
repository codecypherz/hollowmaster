import { Deck } from '../model/deck';
import { STARTER_CARD_KEYS } from '../model/user';

/**
 * A Ready deck for specs: the nine starter cards, in starter order. Every one
 * is one star, so it is full and under the rarity limit by construction, and a
 * seeded user holds every card in it.
 */
export const READY_TEST_DECK: Deck = Object.freeze({ cards: [...STARTER_CARD_KEYS] });
