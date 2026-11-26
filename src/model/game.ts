import { Card } from './card';
import type { CombatEvent, CaptureEvent, Resolution } from './combat';

/**
 * The board's dimensions, stated once. Placement legality, capture adjacency,
 * edge bounds, and board fullness all derive from this — nothing restates it.
 */
export const BOARD_SIZE = 5;

/** How many cards each player is dealt at the start of a match. */
export const HAND_SIZE = 9;

export type Owner = 'player' | 'opponent';

/**
 * Whose move it is. `'player-choosing'` is still the player's turn: their card
 * is down, and the match is waiting for them to say which of its combats to
 * fight next.
 */
export type GamePhase = 'player-turn' | 'player-choosing' | 'opponent-turn' | 'game-over';

/** A cell on the board, addressed by row and column. */
export interface Coord {
  row: number;
  col: number;
}

export interface PlacedCard {
  card: Card;
  owner: Owner;
}

export type Board = (PlacedCard | null)[][];

/**
 * A hand slot keeps its position for the whole match: playing the card in a
 * slot leaves `null` behind rather than shifting the cards after it.
 */
export interface PlayerState {
  hand: (Card | null)[];
}

/** A card arriving on the board: the event that opens a placement's record. */
export interface PlaceEvent {
  kind: 'place';
  at: Coord;
  side: Owner;
}

/**
 * One entry in a placement's record. `seq` increases across the whole life of
 * the service, never only within a placement, so the screen can tell an event
 * it has already shown from one it has not even when a placement arrives over
 * several state updates.
 */
export type TurnEvent = (PlaceEvent | CombatEvent | CaptureEvent) & { seq: number };

/** Who moves first, and the facts that decided it, for the announcement. */
export interface FirstTurn {
  first: Owner;
  playerStars: number;
  opponentStars: number;
  /** The totals were equal and a coin decided. */
  coinFlip: boolean;
}

/**
 * A match in progress.
 *
 * Score is deliberately absent: a player's score is the number of cards they
 * own on the board, so it is derived from this state rather than stored
 * alongside it and cannot drift out of sync with the board.
 */
export interface GameState {
  board: Board;
  player: PlayerState;
  opponent: PlayerState;
  phase: GamePhase;
  selectedCardIndex: number | null;
  winner: Owner | 'draw' | null;
  /**
   * The current placement's record: where the card landed, then every combat
   * and capture in the order it happened. The only record of a placement —
   * where it landed and what it took are read from here.
   */
  events: TurnEvent[];
  /** The player's placement still waiting on a combat to be chosen, else null. */
  resolution: Resolution | null;
  firstTurn: FirstTurn;
  /** The card being read in the inspector. Independent of selection. */
  inspected: Card | null;
}

/** A deck's or hand's star total: the sum of its cards' rarity stars. */
export function starTotal(cards: readonly (Card | null)[]): number {
  return cards.reduce((sum, card) => sum + (card?.stars ?? 0), 0);
}

/**
 * Who moves first: the heavier deck, so the lighter one answers. Equal totals
 * are decided by a fair coin read from `rng`.
 */
export function decideFirstTurn(
  playerStars: number,
  opponentStars: number,
  rng: () => number,
): FirstTurn {
  const coinFlip = playerStars === opponentStars;
  const first: Owner = coinFlip
    ? rng() < 0.5
      ? 'player'
      : 'opponent'
    : playerStars > opponentStars
      ? 'player'
      : 'opponent';
  return { first, playerStars, opponentStars, coinFlip };
}

/** The other player. */
export function other(side: Owner): Owner {
  return side === 'player' ? 'opponent' : 'player';
}
