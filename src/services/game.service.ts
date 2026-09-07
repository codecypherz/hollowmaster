import { Injectable, computed, signal } from '@angular/core';
import { Card, Direction, CARD_DB } from '../model/card';
import { BOARD_SIZE, Coord, GameState, HAND_SIZE, Owner, PlacedCard } from '../model/game';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly _state = signal<GameState | null>(null);

  readonly state = this._state.asReadonly();
  readonly isActive = computed(() => this._state() !== null);

  /**
   * Both players' scores, derived rather than stored: a player's score is the
   * number of cards they own, in hand plus on the board. The pair therefore
   * always sums to the number of cards dealt.
   */
  readonly scores = computed(() => countOwned(this._state()));

  startGame(): void {
    const [playerHand, opponentHand] = dealHands(CARD_DB, 2, HAND_SIZE);
    this._state.set({
      board: emptyBoard(),
      player: { hand: playerHand },
      opponent: { hand: opponentHand },
      phase: 'player-turn',
      selectedCardIndex: null,
      winner: null,
      lastFlipped: [],
      lastPlaced: null,
      inspected: null,
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

  /**
   * Shows a card in the inspector. Reading a card is not playing one, so this
   * deliberately carries no phase guard: the player may study a card while the
   * opponent is moving and after the match has ended.
   */
  inspect(card: Card): void {
    if (!this._state()) return;
    this._state.update((st) => ({ ...st!, inspected: card }));
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

    const next: GameState = {
      ...s,
      board: resolved,
      player: { hand },
      selectedCardIndex: null,
      lastFlipped: flipped,
      lastPlaced: { row, col },
      phase: 'opponent-turn',
    };

    if (isGameOver(next)) {
      this._state.set(finalize(next));
      return;
    }

    this._state.set(next);
    setTimeout(() => this.opponentMove(), OPPONENT_THINK_MS);
  }

  private opponentMove(): void {
    const s = this._state();
    if (!s || s.phase !== 'opponent-turn') return;

    const cardIdx = s.opponent.hand.findIndex((c) => c !== null);
    if (cardIdx === -1) {
      this._state.update((st) => ({ ...st!, phase: 'player-turn' }));
      return;
    }

    const empties = emptyCells(s.board);
    if (empties.length === 0) {
      this._state.set(finalize(s));
      return;
    }

    const { row, col } = empties[Math.floor(Math.random() * empties.length)];
    const card = s.opponent.hand[cardIdx]!;

    const board = s.board.map((r) => [...r]);
    board[row][col] = { card, owner: 'opponent' };

    const oppHand = [...s.opponent.hand];
    oppHand[cardIdx] = null;

    const { board: resolved, flipped } = resolveBattles(board, row, col, 'opponent');

    const next: GameState = {
      ...s,
      board: resolved,
      opponent: { hand: oppHand },
      lastFlipped: flipped,
      lastPlaced: { row, col },
      phase: 'player-turn',
    };

    this._state.set(isGameOver(next) ? finalize(next) : next);
  }

  exitGame(): void {
    this._state.set(null);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** How long the opponent appears to deliberate before placing its card. */
const OPPONENT_THINK_MS = 900;

/** Combat varies each stat by up to this fraction of its stated value. */
const STAT_VARIANCE = 0.2;

const DIR_DELTA: Record<Direction, [number, number]> = {
  N: [-1, 0],
  NE: [-1, 1],
  E: [0, 1],
  SE: [1, 1],
  S: [1, 0],
  SW: [1, -1],
  W: [0, -1],
  NW: [-1, -1],
};

export function emptyBoard(): (PlacedCard | null)[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

function onBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function emptyCells(board: (PlacedCard | null)[][]): Coord[] {
  const empties: Coord[] = [];
  for (let row = 0; row < BOARD_SIZE; row++)
    for (let col = 0; col < BOARD_SIZE; col++) if (!board[row][col]) empties.push({ row, col });
  return empties;
}

/**
 * Deals `hands` hands of `size` cards each from `db`.
 *
 * The database is shuffled and dealt through in order, reshuffling only once
 * the pool runs out. A database smaller than the deal therefore still fills
 * every hand — duplicates are permitted — while no card is dealt a second time
 * until every other card has been dealt once, which keeps the spread as varied
 * as the database allows.
 */
export function dealHands(db: readonly Card[], hands: number, size: number): Card[][] {
  if (db.length === 0) throw new Error('cannot deal a hand from an empty card database');
  const dealt: Card[][] = [];
  let pool: Card[] = [];
  for (let h = 0; h < hands; h++) {
    const hand: Card[] = [];
    while (hand.length < size) {
      if (pool.length === 0) pool = shuffle(db);
      hand.push(pool.pop()!);
    }
    dealt.push(hand);
  }
  return dealt;
}

function shuffle(cards: readonly Card[]): Card[] {
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function resolveBattles(
  board: (PlacedCard | null)[][],
  row: number,
  col: number,
  attacker: Owner,
): { board: (PlacedCard | null)[][]; flipped: Coord[] } {
  const placed = board[row][col]!;
  const flipped: Coord[] = [];

  for (const dir of placed.card.arrows) {
    const [dr, dc] = DIR_DELTA[dir];
    const nr = row + dr;
    const nc = col + dc;
    if (!onBoard(nr, nc)) continue;
    const target = board[nr][nc];
    if (!target || target.owner === attacker) continue;

    if (roll(placed.card.attack) - roll(target.card.defense) > 0) {
      board[nr][nc] = { ...target, owner: attacker };
      flipped.push({ row: nr, col: nc });
      const combo = resolveBattles(board, nr, nc, attacker);
      flipped.push(...combo.flipped);
    }
  }

  return { board, flipped };
}

function roll(base: number): number {
  return base * (1 - STAT_VARIANCE + Math.random() * STAT_VARIANCE * 2);
}

/**
 * A player's score: the cards left in their hand plus the cards they own on the
 * board. Counting both halves is what makes the two scores sum to the number of
 * cards dealt at every point in the match.
 */
export function countOwned(s: GameState | null): { player: number; opponent: number } {
  if (!s) return { player: 0, opponent: 0 };
  let player = s.player.hand.filter(Boolean).length;
  let opponent = s.opponent.hand.filter(Boolean).length;
  for (const cell of s.board.flat()) {
    if (cell?.owner === 'player') player++;
    else if (cell?.owner === 'opponent') opponent++;
  }
  return { player, opponent };
}

export function isGameOver(s: GameState): boolean {
  return s.player.hand.every((c) => !c) && s.opponent.hand.every((c) => !c);
}

export function finalize(s: GameState): GameState {
  const { player, opponent } = countOwned(s);
  const winner = player > opponent ? 'player' : opponent > player ? 'opponent' : 'draw';
  return { ...s, phase: 'game-over', winner };
}
