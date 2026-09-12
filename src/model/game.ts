import { Card } from './card';

/**
 * The board's dimensions, stated once. Placement legality, capture adjacency,
 * edge bounds, and board fullness all derive from this — nothing restates it.
 */
export const BOARD_SIZE = 5;

/** How many cards each player is dealt at the start of a match. */
export const HAND_SIZE = 9;

export type Owner = 'player' | 'opponent';
export type GamePhase = 'player-turn' | 'opponent-turn' | 'game-over';

/** A cell on the board, addressed by row and column. */
export interface Coord {
  row: number;
  col: number;
}

export interface PlacedCard {
  card: Card;
  owner: Owner;
}

/**
 * A hand slot keeps its position for the whole match: playing the card in a
 * slot leaves `null` behind rather than shifting the cards after it.
 */
export interface PlayerState {
  hand: (Card | null)[];
}

/**
 * A match in progress.
 *
 * Score is deliberately absent: a player's score is the number of cards they
 * own on the board, so it is derived from this state rather than stored
 * alongside it and cannot drift out of sync with the board.
 */
export interface GameState {
  board: (PlacedCard | null)[][];
  player: PlayerState;
  opponent: PlayerState;
  phase: GamePhase;
  selectedCardIndex: number | null;
  winner: Owner | 'draw' | null;
  /** Cells captured by the most recent placement, in the order they fell. */
  lastFlipped: Coord[];
  /** The cell the most recent placement landed in, for the landing animation. */
  lastPlaced: Coord | null;
  /** The card being read in the inspector. Independent of selection. */
  inspected: Card | null;
}
