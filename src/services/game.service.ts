import { Injectable, computed, signal } from '@angular/core';
import { Card, Direction, CARD_DB } from '../model/card';
import { GameState, Owner, PlacedCard } from '../model/game';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly _state = signal<GameState | null>(null);

  readonly state = this._state.asReadonly();
  readonly isActive = computed(() => this._state() !== null);

  startGame(): void {
    const deck = [...CARD_DB].sort(() => Math.random() - 0.5);
    this._state.set({
      board: Array.from({ length: 4 }, () => Array(4).fill(null)),
      player: { hand: deck.slice(0, 5) as (Card | null)[], score: 5 },
      opponent: { hand: deck.slice(5, 10) as (Card | null)[], score: 5 },
      phase: 'player-turn',
      selectedCardIndex: null,
      winner: null,
      lastFlipped: [],
    });
  }

  selectCard(index: number): void {
    const s = this._state();
    if (!s || s.phase !== 'player-turn' || !s.player.hand[index]) return;
    this._state.update((st) => ({
      ...st!,
      selectedCardIndex: st!.selectedCardIndex === index ? null : index,
    }));
  }

  placeCard(row: number, col: number): void {
    const s = this._state();
    if (!s || s.phase !== 'player-turn' || s.selectedCardIndex === null) return;
    if (s.board[row][col] !== null) return;
    const card = s.player.hand[s.selectedCardIndex];
    if (!card) return;

    const board = s.board.map((r) => [...r]);
    board[row][col] = { card, owner: 'player' };

    const hand = [...s.player.hand];
    hand[s.selectedCardIndex] = null;

    const { board: resolved, flipped } = resolveBattles(board, row, col, 'player');
    const scores = calcScores(resolved);

    const next: GameState = {
      ...s,
      board: resolved,
      player: { hand, score: scores.player },
      opponent: { ...s.opponent, score: scores.opponent },
      selectedCardIndex: null,
      lastFlipped: flipped,
      phase: 'opponent-turn',
    };

    if (isGameOver(next)) {
      this._state.set(finalize(next));
      return;
    }

    this._state.set(next);
    setTimeout(() => this.opponentMove(), 900);
  }

  private opponentMove(): void {
    const s = this._state();
    if (!s || s.phase !== 'opponent-turn') return;

    const cardIdx = s.opponent.hand.findIndex((c) => c !== null);
    if (cardIdx === -1) {
      this._state.update((st) => ({ ...st!, phase: 'player-turn' }));
      return;
    }

    const empties: [number, number][] = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (!s.board[r][c]) empties.push([r, c]);

    if (empties.length === 0) {
      this._state.set(finalize(s));
      return;
    }

    const [row, col] = empties[Math.floor(Math.random() * empties.length)];
    const card = s.opponent.hand[cardIdx]!;

    const board = s.board.map((r) => [...r]);
    board[row][col] = { card, owner: 'opponent' };

    const oppHand = [...s.opponent.hand];
    oppHand[cardIdx] = null;

    const { board: resolved, flipped } = resolveBattles(board, row, col, 'opponent');
    const scores = calcScores(resolved);

    const next: GameState = {
      ...s,
      board: resolved,
      player: { ...s.player, score: scores.player },
      opponent: { hand: oppHand, score: scores.opponent },
      lastFlipped: flipped,
      phase: 'player-turn',
    };

    this._state.set(isGameOver(next) ? finalize(next) : next);
  }

  exitGame(): void {
    this._state.set(null);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const DIR_DELTA: Record<string, [number, number]> = {
  N: [-1, 0],  NE: [-1, 1],  E: [0, 1],   SE: [1, 1],
  S: [1, 0],   SW: [1, -1],  W: [0, -1],  NW: [-1, -1],
};

function resolveBattles(
  board: (PlacedCard | null)[][],
  row: number,
  col: number,
  attacker: Owner,
): { board: (PlacedCard | null)[][]; flipped: { row: number; col: number }[] } {
  const placed = board[row][col]!;
  const flipped: { row: number; col: number }[] = [];

  for (const dir of placed.card.stats.arrows) {
    const [dr, dc] = DIR_DELTA[dir];
    const nr = row + dr;
    const nc = col + dc;
    if (nr < 0 || nr > 3 || nc < 0 || nc > 3) continue;
    const target = board[nr][nc];
    if (!target || target.owner === attacker) continue;

    if (roll(placed.card.stats.attack) - roll(target.card.stats.defense) > 0) {
      board[nr][nc] = { ...target, owner: attacker };
      flipped.push({ row: nr, col: nc });
      const combo = resolveBattles(board, nr, nc, attacker);
      flipped.push(...combo.flipped);
    }
  }

  return { board, flipped };
}

function roll(base: number): number {
  return base * (0.8 + Math.random() * 0.4); // ±20%
}

function calcScores(board: (PlacedCard | null)[][]): { player: number; opponent: number } {
  let player = 0;
  let opponent = 0;
  for (const cell of board.flat()) {
    if (cell?.owner === 'player') player++;
    else if (cell?.owner === 'opponent') opponent++;
  }
  return { player, opponent };
}

function isGameOver(s: GameState): boolean {
  const placed = s.board.flat().filter(Boolean).length;
  return placed >= 10 || (s.player.hand.every((c) => !c) && s.opponent.hand.every((c) => !c));
}

function finalize(s: GameState): GameState {
  const { player, opponent } = calcScores(s.board);
  const winner = player > opponent ? 'player' : opponent > player ? 'opponent' : 'draw';
  return { ...s, phase: 'game-over', winner };
}
