import { DestroyRef, Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { CARD_BY_KEY, CARD_DB, Card } from '../model/card';
import {
  Resolution,
  ResolutionEvent,
  beginResolution,
  fight,
  finish,
  opponentCombatOrder,
} from '../model/combat';
import { Deck, isBattleReady, randomReadyDeck } from '../model/deck';
import {
  BOARD_SIZE,
  Board,
  Coord,
  GameState,
  Owner,
  PlaceEvent,
  TurnEvent,
  decideFirstTurn,
  starTotal,
} from '../model/game';

/**
 * Where every chance in a match comes from — each roll, the opponent's deal,
 * the first-turn coin, and the opponent's choice of cell. A uniform [0, 1)
 * source like `Math.random`, which is the default; specs provide a scripted
 * sequence so a rule can be pinned to the exact rolls it turns on.
 */
export const GAME_RANDOM = new InjectionToken<() => number>('GAME_RANDOM', {
  providedIn: 'root',
  // Wrapped rather than handed over, so a stubbed `Math.random` is still seen.
  factory: () => () => Math.random(),
});

/** How long the opponent appears to deliberate before placing its card. */
export const OPPONENT_THINK_MS = 900;

/**
 * How long one combat's clash takes to play, in milliseconds — mirrors
 * `--dur-clash`, the same mirrored-constant convention as the scoreboard's
 * `SCORE_STEP_MS`. The opponent waits this long per combat of the turn before
 * it, so it does not place over a clash that is still playing. The screen
 * queues its presentation regardless, so a mismatch only delays visuals.
 */
export const CLASH_MS = 1800;

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly _state = signal<GameState | null>(null);
  private readonly rng = inject(GAME_RANDOM);

  readonly state = this._state.asReadonly();
  readonly isActive = computed(() => this._state() !== null);

  /**
   * Both players' scores, derived rather than stored: a player's score is the
   * number of cards they own on the board. Cards still in hand count for
   * nothing, so the pair sums to the number of cards played so far.
   */
  readonly scores = computed(() => countOwned(this._state()));

  /** The deck the current match was begun with, so Play Again deals it again. */
  private deck: Deck | null = null;

  /** The last event `seq` handed out. Never reset, so it only ever grows. */
  private seq = 0;

  /** The opponent's scheduled move, so a new match or a retreat can cancel it. */
  private opponentTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cancelOpponent());
  }

  /**
   * Begins a match with `deck` as the player's hand, in deck order, and an
   * opponent dealt a random Ready deck from the card database. The heavier
   * deck moves first; when that is the opponent, its move is scheduled at once.
   * Refused, changing nothing, for a deck that is not `isBattleReady`.
   *
   * Handed a deck rather than reaching for the user, so the game knows
   * nothing about where decks are kept. A Ready deck has survived the load's
   * catalogue check, so every key resolves.
   */
  startGame(deck: Deck): boolean {
    if (!isBattleReady(deck)) return false;
    this.cancelOpponent();
    this.deck = deck;
    const playerHand = deck.cards.map((key) => CARD_BY_KEY.get(key)!);
    const opponentHand = randomReadyDeck(CARD_DB, this.rng).cards.map((key) =>
      CARD_BY_KEY.get(key)!,
    );
    const firstTurn = decideFirstTurn(starTotal(playerHand), starTotal(opponentHand), this.rng);
    this._state.set({
      board: emptyBoard(),
      player: { hand: playerHand },
      opponent: { hand: opponentHand },
      phase: firstTurn.first === 'player' ? 'player-turn' : 'opponent-turn',
      selectedCardIndex: null,
      winner: null,
      events: [],
      resolution: null,
      firstTurn,
      inspected: null,
    });
    if (firstTurn.first === 'opponent') this.scheduleOpponent(OPPONENT_THINK_MS);
    return true;
  }

  /** Begins a fresh match with the deck the last one was begun with. */
  restartGame(): boolean {
    return this.deck !== null && this.startGame(this.deck);
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
   * opponent is moving, while choosing a combat, and after the match has ended.
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

    const hand = [...s.player.hand];
    hand[s.selectedCardIndex] = null;
    this.place({ ...s, player: { hand }, selectedCardIndex: null }, card, { row, col }, 'player');
  }

  /**
   * Fights the combat against the card at `row`, `col` while the player is
   * choosing. Refused, changing nothing, for any cell that is not one of the
   * placement's remaining combat targets.
   */
  chooseCombat(row: number, col: number): void {
    const s = this._state();
    if (!s || s.phase !== 'player-choosing' || !s.resolution) return;
    if (!s.resolution.combatTargets.some((t) => t.row === row && t.col === col)) return;
    this.resolve(s, s.board, s.resolution, { row, col }, [...s.events]);
  }

  exitGame(): void {
    this.cancelOpponent();
    this._state.set(null);
  }

  private opponentMove(): void {
    this.opponentTimer = null;
    const s = this._state();
    if (!s || s.phase !== 'opponent-turn') return;

    const cardIdx = s.opponent.hand.findIndex((c) => c !== null);
    if (cardIdx === -1) {
      this._state.set({ ...s, phase: 'player-turn' });
      return;
    }

    const empties = emptyCells(s.board);
    if (empties.length === 0) {
      this._state.set(finalize(s));
      return;
    }

    const at = empties[Math.floor(this.rng() * empties.length)];
    const card = s.opponent.hand[cardIdx]!;
    const hand = [...s.opponent.hand];
    hand[cardIdx] = null;
    this.place({ ...s, opponent: { hand } }, card, at, 'opponent');
  }

  /** Puts `card` down at `at` for `side`, opening a fresh record, and resolves it. */
  private place(s: GameState, card: Card, at: Coord, side: Owner): void {
    const board = s.board.map((r) => [...r]);
    board[at.row][at.col] = { card, owner: side };
    const placed: PlaceEvent = { kind: 'place', at, side };
    const events = [this.stamp(placed)];
    this.resolve(s, board, beginResolution(board, at, side), null, events);
  }

  /**
   * The one driver for a placement's resolution, for both sides.
   *
   * `chosen` is fought first when given. After that, while combats remain:
   * the player is asked to choose whenever two or more are left, and the
   * opponent picks by its own policy; a lone combat is simply fought. When the
   * combats are done — or the attacker has lost — the defenseless targets are
   * taken (if the attacker survived) and the turn passes.
   */
  private resolve(
    s: GameState,
    board: Board,
    res: Resolution | null,
    chosen: Coord | null,
    events: TurnEvent[],
  ): void {
    const side = res!.side;
    let target = chosen;

    while (res && (target || res.combatTargets.length > 0)) {
      if (!target) {
        if (side === 'player' && res.combatTargets.length >= 2) {
          this._state.set({ ...s, board, events, resolution: res, phase: 'player-choosing' });
          return;
        }
        target =
          side === 'player'
            ? res.combatTargets[0]
            : opponentCombatOrder(board, res.combatTargets)[0];
      }
      const step = fight(board, res, target, this.rng);
      board = step.board;
      res = step.res;
      events.push(...step.events.map((e) => this.stamp(e)));
      target = null;
    }

    if (res) {
      const end = finish(board, res);
      board = end.board;
      events.push(...end.events.map((e) => this.stamp(e)));
    }

    const next: GameState = {
      ...s,
      board,
      events,
      resolution: null,
      phase: side === 'player' ? 'opponent-turn' : 'player-turn',
    };

    if (isGameOver(next)) {
      this._state.set(finalize(next));
      return;
    }
    this._state.set(next);
    if (next.phase === 'opponent-turn') {
      const combats = events.filter((e) => e.kind === 'combat').length;
      this.scheduleOpponent(OPPONENT_THINK_MS + combats * CLASH_MS);
    }
  }

  private stamp(event: PlaceEvent | ResolutionEvent): TurnEvent {
    return { ...event, seq: ++this.seq };
  }

  private scheduleOpponent(delay: number): void {
    this.cancelOpponent();
    this.opponentTimer = setTimeout(() => this.opponentMove(), delay);
  }

  private cancelOpponent(): void {
    if (this.opponentTimer !== null) clearTimeout(this.opponentTimer);
    this.opponentTimer = null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

export function emptyCells(board: Board): Coord[] {
  const empties: Coord[] = [];
  for (let row = 0; row < BOARD_SIZE; row++)
    for (let col = 0; col < BOARD_SIZE; col++) if (!board[row][col]) empties.push({ row, col });
  return empties;
}

/**
 * A player's score: the cards they own on the board, and nothing else. A card
 * in hand is not yet a claim on the board, so it scores nothing until it is
 * played; the two scores therefore sum to the number of cards placed so far.
 */
export function countOwned(s: GameState | null): { player: number; opponent: number } {
  if (!s) return { player: 0, opponent: 0 };
  let player = 0;
  let opponent = 0;
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
  return { ...s, phase: 'game-over', winner, resolution: null };
}
