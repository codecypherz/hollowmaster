import { Card } from './card';

export type Owner = 'player' | 'opponent';
export type GamePhase = 'player-turn' | 'opponent-turn' | 'game-over';

export interface PlacedCard {
  card: Card;
  owner: Owner;
}

export interface PlayerState {
  hand: (Card | null)[];
  score: number;
}

export interface GameState {
  board: (PlacedCard | null)[][];
  player: PlayerState;
  opponent: PlayerState;
  phase: GamePhase;
  selectedCardIndex: number | null;
  winner: Owner | 'draw' | null;
  lastFlipped: { row: number; col: number }[];
}
