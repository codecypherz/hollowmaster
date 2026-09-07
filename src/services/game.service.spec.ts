import { TestBed } from '@angular/core/testing';
import { GameService, countOwned, dealHands, finalize, resolveBattles } from './game.service';
import { Card, CARD_DB, Direction } from '../model/card';
import { BOARD_SIZE, GameState, HAND_SIZE, PlacedCard } from '../model/game';

/** A card built for a test, stated only in the properties the test cares about. */
function testCard(
  overrides: Partial<{ arrows: Direction[]; attack: number; defense: number }> = {},
) {
  return new Card({
    name: 'Test Vessel',
    arrows: overrides.arrows ?? ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
    stars: 1,
    image: 'crawlid.webp',
    attack: overrides.attack ?? 50,
    defense: overrides.defense ?? 50,
    ability: 'None',
    set: 'Test',
    number: 1,
  });
}

/** An attacker that always wins its roll, against a defender that always loses. */
const CRUSHING = { attack: 100 };
const FEEBLE = { defense: 1 };

function blankBoard(): (PlacedCard | null)[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

describe('GameService', () => {
  let gs: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    gs = TestBed.inject(GameService);
  });

  // ─── 1.2 The deal ─────────────────────────────────────────────────────────

  describe('the deal', () => {
    it('fills both hands to nine cards', () => {
      gs.startGame();
      const s = gs.state()!;
      expect(s.player.hand.filter(Boolean)).toHaveLength(HAND_SIZE);
      expect(s.opponent.hand.filter(Boolean)).toHaveLength(HAND_SIZE);
    });

    it('succeeds from a database holding a single card', () => {
      const only = testCard();
      const [player, opponent] = dealHands([only], 2, HAND_SIZE);
      expect(player).toHaveLength(HAND_SIZE);
      expect(opponent).toHaveLength(HAND_SIZE);
      expect([...player, ...opponent].every((c) => c === only)).toBe(true);
    });

    it('deals no card more than twice from the fifteen-card database', () => {
      expect(CARD_DB).toHaveLength(15);
      for (let attempt = 0; attempt < 50; attempt++) {
        const counts = new Map<Card, number>();
        for (const card of dealHands(CARD_DB, 2, HAND_SIZE).flat()) {
          counts.set(card, (counts.get(card) ?? 0) + 1);
        }
        expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
      }
    });

    it('rejects a deal from an empty database', () => {
      expect(() => dealHands([], 2, HAND_SIZE)).toThrow();
    });
  });

  // ─── 1.3 Derived score ────────────────────────────────────────────────────

  describe('score', () => {
    it('starts at nine apiece', () => {
      gs.startGame();
      expect(gs.scores()).toEqual({ player: HAND_SIZE, opponent: HAND_SIZE });
    });

    it('always sums to eighteen through a whole match', () => {
      vi.useFakeTimers();
      try {
        gs.startGame();
        while (gs.state()!.phase !== 'game-over') {
          const { player, opponent } = gs.scores();
          expect(player + opponent).toBe(2 * HAND_SIZE);
          playOneCard(gs);
          vi.runOnlyPendingTimers();
        }
        const { player, opponent } = gs.scores();
        expect(player + opponent).toBe(2 * HAND_SIZE);
      } finally {
        vi.useRealTimers();
      }
    });

    it('leaves both scores unchanged when a placement captures nothing', () => {
      vi.useFakeTimers();
      try {
        gs.startGame();
        const before = gs.scores();
        gs.selectCard(0);
        gs.placeCard(0, 0); // an empty board: nothing to contest
        expect(gs.state()!.lastFlipped).toEqual([]);
        expect(gs.scores()).toEqual(before);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ─── 1.4 Bounds derive from BOARD_SIZE ────────────────────────────────────

  describe('board bounds', () => {
    it('resolves a placement in each corner without leaving the board', () => {
      const corners = [
        [0, 0],
        [0, BOARD_SIZE - 1],
        [BOARD_SIZE - 1, 0],
        [BOARD_SIZE - 1, BOARD_SIZE - 1],
      ];
      for (const [row, col] of corners) {
        const board = blankBoard();
        board[row][col] = { card: testCard(CRUSHING), owner: 'player' };
        const { flipped } = resolveBattles(board, row, col, 'player');
        expect(flipped).toEqual([]);
        expect(board.flat().filter(Boolean)).toHaveLength(1);
      }
    });

    it('contests only the neighbours that are on the board', () => {
      const board = blankBoard();
      board[0][0] = { card: testCard(CRUSHING), owner: 'player' };
      board[0][1] = { card: testCard(FEEBLE), owner: 'opponent' };
      board[1][0] = { card: testCard(FEEBLE), owner: 'opponent' };
      const { flipped } = resolveBattles(board, 0, 0, 'player');
      expect(flipped).toHaveLength(2);
      expect(board.flat().filter((c) => c?.owner === 'opponent')).toHaveLength(0);
    });
  });

  // ─── 1.5 End condition ────────────────────────────────────────────────────

  it('ends only once both hands are empty, leaving seven cells empty', () => {
    vi.useFakeTimers();
    try {
      gs.startGame();
      for (let turn = 0; turn < HAND_SIZE; turn++) {
        playOneCard(gs);
        if (turn < HAND_SIZE - 1) vi.runOnlyPendingTimers();
      }
      // The player's ninth card is the seventeenth placed; the match continues.
      expect(placedCount(gs.state()!)).toBe(2 * HAND_SIZE - 1);
      expect(gs.state()!.phase).not.toBe('game-over');

      vi.runOnlyPendingTimers(); // the opponent's last card

      expect(placedCount(gs.state()!)).toBe(2 * HAND_SIZE);
      expect(gs.state()!.phase).toBe('game-over');
      const cells = BOARD_SIZE * BOARD_SIZE;
      expect(cells - placedCount(gs.state()!)).toBe(7);
    } finally {
      vi.useRealTimers();
    }
  });

  // ─── 1.6 Inspection ───────────────────────────────────────────────────────

  describe('inspect', () => {
    it('works while the opponent is moving and changes nothing else', () => {
      vi.useFakeTimers();
      try {
        gs.startGame();
        gs.selectCard(0);
        gs.placeCard(0, 0);
        expect(gs.state()!.phase).toBe('opponent-turn');

        const before = gs.state()!;
        const scoresBefore = gs.scores();
        const card = testCard();
        gs.inspect(card);

        const after = gs.state()!;
        expect(after.inspected).toBe(card);
        expect(after.board).toBe(before.board);
        expect(after.player.hand).toBe(before.player.hand);
        expect(after.opponent.hand).toBe(before.opponent.hand);
        expect(after.selectedCardIndex).toBe(before.selectedCardIndex);
        expect(gs.scores()).toEqual(scoresBefore);
      } finally {
        vi.useRealTimers();
      }
    });

    it('works after the match has ended', () => {
      vi.useFakeTimers();
      try {
        playFullMatch(gs);
        expect(gs.state()!.phase).toBe('game-over');
        const card = testCard();
        gs.inspect(card);
        expect(gs.state()!.inspected).toBe(card);
        expect(gs.state()!.phase).toBe('game-over');
      } finally {
        vi.useRealTimers();
      }
    });

    it('is distinct from selection, which still guards on the turn', () => {
      vi.useFakeTimers();
      try {
        gs.startGame();
        gs.selectCard(0);
        gs.placeCard(0, 0);
        gs.selectCard(1); // out of turn
        expect(gs.state()!.selectedCardIndex).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ─── 1.7 Placement and capture order ──────────────────────────────────────

  describe('placement records', () => {
    it('records the cell every placement landed in', () => {
      vi.useFakeTimers();
      try {
        gs.startGame();
        gs.selectCard(0);
        gs.placeCard(2, 3);
        expect(gs.state()!.lastPlaced).toEqual({ row: 2, col: 3 });

        vi.runOnlyPendingTimers();
        const opponentCell = gs.state()!.lastPlaced!;
        expect(gs.state()!.board[opponentCell.row][opponentCell.col]!.owner).toBe('opponent');
      } finally {
        vi.useRealTimers();
      }
    });

    it('returns the flipped cells in the order the chain captured them', () => {
      const board = blankBoard();
      board[0][0] = { card: testCard({ arrows: ['E'], attack: 100 }), owner: 'player' };
      board[0][1] = {
        card: testCard({ arrows: ['E'], attack: 100, defense: 1 }),
        owner: 'opponent',
      };
      board[0][2] = {
        card: testCard({ arrows: ['E'], attack: 100, defense: 1 }),
        owner: 'opponent',
      };
      board[0][3] = { card: testCard({ arrows: [], defense: 1 }), owner: 'opponent' };

      const { flipped } = resolveBattles(board, 0, 0, 'player');
      expect(flipped).toEqual([
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ]);
    });
  });

  // ─── 1.8 Result and retreat ───────────────────────────────────────────────

  describe('the result', () => {
    it('calls an even finish a draw', () => {
      const state = finishedState(HAND_SIZE, HAND_SIZE);
      expect(finalize(state).winner).toBe('draw');
    });

    it('gives the win to the higher score', () => {
      expect(finalize(finishedState(10, 8)).winner).toBe('player');
      expect(finalize(finishedState(8, 10)).winner).toBe('opponent');
    });

    it('agrees with the derived scores at the end of a real match', () => {
      vi.useFakeTimers();
      try {
        playFullMatch(gs);
        const s = gs.state()!;
        const { player, opponent } = countOwned(s);
        const expected = player > opponent ? 'player' : opponent > player ? 'opponent' : 'draw';
        expect(s.winner).toBe(expected);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('discards the match on retreat', () => {
    gs.startGame();
    expect(gs.isActive()).toBe(true);
    gs.exitGame();
    expect(gs.isActive()).toBe(false);
    expect(gs.state()).toBeNull();
    expect(gs.scores()).toEqual({ player: 0, opponent: 0 });
  });
});

// ─── Test helpers ───────────────────────────────────────────────────────────

function placedCount(s: GameState): number {
  return s.board.flat().filter(Boolean).length;
}

/** Plays the player's first remaining card into the first empty cell. */
function playOneCard(gs: GameService): void {
  const s = gs.state()!;
  const index = s.player.hand.findIndex((c) => c !== null);
  gs.selectCard(index);
  const cell = s.board.flatMap((row, r) => row.map((c, col) => ({ r, col, c }))).find((x) => !x.c)!;
  gs.placeCard(cell.r, cell.col);
}

/** Runs a whole match to its end. Requires fake timers to be installed. */
function playFullMatch(gs: GameService): void {
  gs.startGame();
  while (gs.state()!.phase !== 'game-over') {
    if (gs.state()!.phase === 'player-turn') playOneCard(gs);
    vi.runOnlyPendingTimers();
  }
}

/** A finished board owning `player` cards for the player and `opponent` for the opponent. */
function finishedState(player: number, opponent: number): GameState {
  const board = blankBoard();
  const cells = board.flatMap((row, r) => row.map((_, c) => [r, c] as const));
  let i = 0;
  for (let n = 0; n < player; n++, i++)
    board[cells[i][0]][cells[i][1]] = { card: testCard(), owner: 'player' };
  for (let n = 0; n < opponent; n++, i++)
    board[cells[i][0]][cells[i][1]] = { card: testCard(), owner: 'opponent' };
  return {
    board,
    player: { hand: Array(HAND_SIZE).fill(null) },
    opponent: { hand: Array(HAND_SIZE).fill(null) },
    phase: 'opponent-turn',
    selectedCardIndex: null,
    winner: null,
    lastFlipped: [],
    lastPlaced: null,
    inspected: null,
  };
}
