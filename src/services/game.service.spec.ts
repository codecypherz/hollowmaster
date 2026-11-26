import { TestBed } from '@angular/core/testing';
import { HEAVY_TEST_DECK, READY_TEST_DECK } from '../testing/ready-deck';
import { ScriptedRandom, scriptedRandom } from '../testing/random';
import {
  CLASH_MS,
  GAME_RANDOM,
  GameService,
  OPPONENT_THINK_MS,
  countOwned,
  finalize,
} from './game.service';
import { Card, CARD_BY_KEY, CARD_DB, Direction, cardKey, cardKeyOf } from '../model/card';
import { Deck, isBattleReady, randomReadyDeck } from '../model/deck';
import { STARTER_CARD_KEYS } from '../model/user';
import {
  BOARD_SIZE,
  Board,
  GameState,
  HAND_SIZE,
  Owner,
  TurnEvent,
  starTotal,
} from '../model/game';

/** A card built for a test, stated only in the properties the test cares about. */
function testCard(
  overrides: Partial<{ arrows: Direction[]; attack: number; defense: number }> = {},
) {
  return new Card({
    name: 'Test Vessel',
    arrows: overrides.arrows ?? [],
    stars: 1,
    image: 'crawlid.webp',
    attack: overrides.attack ?? 50,
    defense: overrides.defense ?? 50,
    ability: 'None',
    set: 'Test',
    number: 1,
  });
}

function blankBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

const goam = cardKeyOf('FC', 6); // four stars

/** Opens on the player's turn: see `HEAVY_TEST_DECK`. */
const HEAVY_DECK = HEAVY_TEST_DECK;

describe('GameService', () => {
  let gs: GameService;
  let rng: ScriptedRandom;

  beforeEach(() => {
    rng = scriptedRandom();
    TestBed.configureTestingModule({ providers: [{ provide: GAME_RANDOM, useValue: rng }] });
    gs = TestBed.inject(GameService);
  });

  afterEach(() => vi.useRealTimers());

  /** Replaces the match state outright, for staging a board. */
  function stage(patch: Partial<GameState>): GameState {
    const base = gs.state()!;
    const next = { ...base, ...patch };
    (gs as unknown as { _state: { set: (s: GameState) => void } })._state.set(next);
    return next;
  }

  /**
   * A player-turn match whose board holds `cells` and whose player hand opens
   * with `card`, selected. Every other hand slot is a blank so the match is
   * not over after one placement.
   */
  function stagePlayerMove(card: Card, cells: [number, number, Card, Owner][]): void {
    gs.startGame(HEAVY_DECK);
    const board = blankBoard();
    for (const [r, c, placed, owner] of cells) board[r][c] = { card: placed, owner };
    const hand = gs.state()!.player.hand.slice();
    hand[0] = card;
    stage({ board, player: { hand }, selectedCardIndex: 0 });
  }

  // ─── The deal ─────────────────────────────────────────────────────────────

  describe('the deal', () => {
    it('fills both hands to nine cards', () => {
      gs.startGame(READY_TEST_DECK);
      const s = gs.state()!;
      expect(s.player.hand.filter(Boolean)).toHaveLength(HAND_SIZE);
      expect(s.opponent.hand.filter(Boolean)).toHaveLength(HAND_SIZE);
    });

    it("deals the player the deck's cards in deck order, duplicates included", () => {
      const crawlid = cardKeyOf('FC', 1);
      const deck: Deck = { cards: [crawlid, crawlid, ...STARTER_CARD_KEYS.slice(2, 8), crawlid] };
      expect(deck.cards).toHaveLength(HAND_SIZE);
      expect(gs.startGame(deck)).toBe(true);
      const hand = gs.state()!.player.hand;
      expect(hand.map((card) => cardKey(card!))).toEqual(deck.cards);
      expect(hand[0]).toBe(CARD_BY_KEY.get(crawlid));
    });

    it('deals the opponent nine cards from the card database', () => {
      gs.startGame(READY_TEST_DECK);
      const hand = gs.state()!.opponent.hand;
      expect(hand).toHaveLength(HAND_SIZE);
      for (const card of hand) expect(CARD_DB).toContain(card);
    });

    it('always deals the opponent a hand that would be a Ready deck', () => {
      for (let match = 0; match < 200; match++) {
        gs.startGame(READY_TEST_DECK);
        const deck = { cards: gs.state()!.opponent.hand.map((card) => cardKey(card!)) };
        expect(isBattleReady(deck), deck.cards.join()).toBe(true);
      }
    });

    it('refuses an Incomplete deck, starting nothing', () => {
      expect(gs.startGame({ cards: STARTER_CARD_KEYS.slice(0, 8) })).toBe(false);
      expect(gs.state()).toBeNull();
      expect(gs.isActive()).toBe(false);
    });

    it('refuses an Invalid deck, starting nothing', () => {
      const invalid: Deck = { cards: [goam, goam, goam, ...STARTER_CARD_KEYS.slice(0, 6)] };
      expect(invalid.cards).toHaveLength(HAND_SIZE);
      expect(gs.startGame(invalid)).toBe(false);
      expect(gs.state()).toBeNull();
    });

    it('plays again with the deck the match was begun with', () => {
      expect(gs.restartGame()).toBe(false);
      gs.startGame(READY_TEST_DECK);
      gs.exitGame();
      expect(gs.restartGame()).toBe(true);
      expect(gs.state()!.player.hand.map((card) => cardKey(card!))).toEqual(READY_TEST_DECK.cards);
    });
  });

  // ─── Who moves first ──────────────────────────────────────────────────────

  describe('the first turn', () => {
    it('opens on the player when their deck is heavier, with no opponent card down', () => {
      vi.useFakeTimers();
      gs.startGame(HEAVY_DECK);
      const s = gs.state()!;
      expect(s.firstTurn).toMatchObject({ first: 'player', coinFlip: false });
      expect(s.firstTurn.playerStars).toBe(starTotal(s.player.hand));
      expect(s.firstTurn.opponentStars).toBe(starTotal(s.opponent.hand));
      expect(s.phase).toBe('player-turn');
      vi.advanceTimersByTime(OPPONENT_THINK_MS * 10);
      expect(placedCount(gs.state()!)).toBe(0);
    });

    it('lets the opponent open, unprompted, when the player deck is lighter', () => {
      vi.useFakeTimers();
      const theirs = randomReadyDeck(CARD_DB, () => 0);
      expect(starTotal(theirs.cards.map((k) => CARD_BY_KEY.get(k)!))).toBeGreaterThan(9);
      rng.queue(...Array(64).fill(0)); // the same deal, so the opponent is heavier
      gs.startGame(READY_TEST_DECK); // nine stars
      expect(gs.state()!.firstTurn).toMatchObject({ first: 'opponent', playerStars: 9 });
      expect(gs.state()!.phase).toBe('opponent-turn');

      gs.selectCard(0); // out of turn
      expect(gs.state()!.selectedCardIndex).toBeNull();

      vi.advanceTimersByTime(OPPONENT_THINK_MS);
      const s = gs.state()!;
      expect(placedCount(s)).toBe(1);
      expect(s.events[0]).toMatchObject({ kind: 'place', side: 'opponent' });
      expect(s.phase).toBe('player-turn');
    });

    it('flips a coin when the totals are equal', () => {
      for (const [value, first] of [
        [0, 'player'],
        [0.999999, 'opponent'],
      ] as const) {
        // A constant source deals the same opponent deck every time, so handing
        // the player that very deck makes the totals equal by construction;
        // the coin then reads the same constant.
        const deck = randomReadyDeck(CARD_DB, () => value);
        const constant = scriptedRandom(() => value);
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [{ provide: GAME_RANDOM, useValue: constant }],
        });
        const service = TestBed.inject(GameService);
        service.startGame(deck);
        expect(service.state()!.firstTurn).toMatchObject({ first, coinFlip: true });
        expect(service.state()!.phase).toBe(first === 'player' ? 'player-turn' : 'opponent-turn');
        service.exitGame();
      }
    });
  });

  // ─── Choosing the order of combats ────────────────────────────────────────

  describe('a placement with several combats', () => {
    /** The player's card at 2-2 points east and west at two cards that point back. */
    function stageTwoCombats(): void {
      stagePlayerMove(testCard({ arrows: ['E', 'W'], attack: 90 }), [
        [2, 1, testCard({ arrows: ['E'], defense: 10 }), 'opponent'],
        [2, 3, testCard({ arrows: ['W'], defense: 10 }), 'opponent'],
      ]);
    }

    it('fights nothing until the player chooses', () => {
      vi.useFakeTimers();
      stageTwoCombats();
      gs.placeCard(2, 2);
      const s = gs.state()!;
      expect(s.phase).toBe('player-choosing');
      expect(s.resolution!.combatTargets).toEqual([
        { row: 2, col: 1 },
        { row: 2, col: 3 },
      ]);
      expect(s.events.map((e) => e.kind)).toEqual(['place']);
      expect(s.board[2][1]!.owner).toBe('opponent');
      expect(s.board[2][3]!.owner).toBe('opponent');

      // And the turn has not passed: the opponent waits on the choice.
      vi.advanceTimersByTime(OPPONENT_THINK_MS * 10);
      expect(gs.state()!.phase).toBe('player-choosing');
    });

    it('fights the chosen combat first, then the last one without asking', () => {
      vi.useFakeTimers();
      stageTwoCombats();
      gs.placeCard(2, 2);
      rng.rolls(51, 51, 51); // one attacker roll, one per defender
      gs.chooseCombat(2, 3);
      const s = gs.state()!;
      expect(rng.pending).toBe(0);
      const combats = s.events.filter((e) => e.kind === 'combat');
      expect(combats.map((e) => e.defender)).toEqual([
        { row: 2, col: 3 },
        { row: 2, col: 1 },
      ]);
      expect(s.board[2][1]!.owner).toBe('player');
      expect(s.board[2][3]!.owner).toBe('player');
      expect(s.phase).toBe('opponent-turn');
      expect(s.resolution).toBeNull();
    });

    it('appends the chosen combats to the placement record with growing seq', () => {
      stageTwoCombats();
      gs.placeCard(2, 2);
      const placedSeq = gs.state()!.events[0].seq;
      rng.rolls(51, 51, 51);
      gs.chooseCombat(2, 1);
      const events = gs.state()!.events;
      expect(events[0].kind).toBe('place');
      const seqs = events.map((e) => e.seq);
      expect(seqs[0]).toBe(placedSeq);
      expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
      expect(new Set(seqs).size).toBe(seqs.length);
    });

    it('refuses a cell that is not a remaining combat target, changing nothing', () => {
      stagePlayerMove(testCard({ arrows: ['E', 'W', 'S'], attack: 90 }), [
        [2, 1, testCard({ arrows: ['E'] }), 'opponent'],
        [2, 3, testCard({ arrows: ['W'] }), 'opponent'],
        [3, 2, testCard(), 'opponent'], // defenseless
        [0, 0, testCard(), 'player'],
      ]);
      gs.placeCard(2, 2);
      const before = gs.state()!;
      for (const [r, c] of [
        [3, 2], // a defenseless target
        [0, 0], // a friendly card
        [4, 4], // an empty cell
        [2, 2], // the attacker itself
      ]) {
        gs.chooseCombat(r, c);
        expect(gs.state()).toBe(before);
      }
    });

    it('refuses selection and placement while a combat is to be chosen', () => {
      stageTwoCombats();
      gs.placeCard(2, 2);
      const before = gs.state()!;
      gs.selectCard(1);
      gs.placeCard(0, 0);
      expect(gs.state()).toBe(before);
    });

    it('ends the turn when the attacker loses, forfeiting the rest', () => {
      stagePlayerMove(testCard({ arrows: ['E', 'W', 'S'], attack: 10 }), [
        [2, 1, testCard({ arrows: ['E'], defense: 90 }), 'opponent'],
        [2, 3, testCard({ arrows: ['W'], defense: 1 }), 'opponent'],
        [3, 2, testCard(), 'opponent'],
      ]);
      gs.placeCard(2, 2);
      rng.rolls(51, 51);
      gs.chooseCombat(2, 1);
      const s = gs.state()!;
      expect(s.events.filter((e) => e.kind === 'combat')).toHaveLength(1);
      expect(s.board[2][2]!.owner).toBe('opponent');
      expect(s.board[2][3]!.owner).toBe('opponent');
      expect(s.board[3][2]!.owner).toBe('opponent');
      expect(s.phase).toBe('opponent-turn');
    });

    it('fights a single combat straight away and takes the defenseless after it', () => {
      stagePlayerMove(testCard({ arrows: ['E', 'S'], attack: 90 }), [
        [2, 3, testCard({ arrows: ['W'], defense: 10 }), 'opponent'],
        [3, 2, testCard(), 'opponent'],
      ]);
      rng.rolls(51, 51);
      gs.placeCard(2, 2);
      const s = gs.state()!;
      expect(describeEvents(s.events)).toEqual([
        'place 2-2',
        'fight 2-3',
        'combat 2-3',
        'defenseless 3-2',
      ]);
      expect(s.phase).toBe('opponent-turn');
    });
  });

  describe("the opponent's combats", () => {
    it('fights them unprompted, weakest defense first', () => {
      vi.useFakeTimers();
      gs.startGame(HEAVY_DECK);
      // Every cell full but 2-2, where the opponent must play. Its card points
      // east and west at two of the player's cards that point back.
      const board = blankBoard();
      for (let r = 0; r < BOARD_SIZE; r++)
        for (let c = 0; c < BOARD_SIZE; c++) board[r][c] = { card: testCard(), owner: 'opponent' };
      board[2][2] = null;
      board[2][1] = { card: testCard({ arrows: ['E'], defense: 30 }), owner: 'player' };
      board[2][3] = { card: testCard({ arrows: ['W'], defense: 5 }), owner: 'player' };
      const hand = gs.state()!.opponent.hand.slice();
      hand[0] = testCard({ arrows: ['E', 'W'], attack: 95 });
      stage({ board, opponent: { hand }, phase: 'opponent-turn' });

      // Nothing scripted: the fallback rolls, and only the order is asserted.
      (gs as unknown as { opponentMove: () => void }).opponentMove();
      const combats = gs.state()!.events.filter((e) => e.kind === 'combat');
      expect(combats[0].defender).toEqual({ row: 2, col: 3 });
      if (combats.length > 1) expect(combats[1].defender).toEqual({ row: 2, col: 1 });
      expect(gs.state()!.phase).not.toBe('player-choosing');
    });
  });

  describe("the opponent's pace", () => {
    it('waits one clash longer for every combat of the turn before it', () => {
      vi.useFakeTimers();
      stagePlayerMove(testCard({ arrows: ['E'], attack: 90 }), [
        [2, 3, testCard({ arrows: ['W'], defense: 10 }), 'opponent'],
      ]);
      rng.rolls(51, 51);
      gs.placeCard(2, 2);
      expect(gs.state()!.phase).toBe('opponent-turn');

      vi.advanceTimersByTime(OPPONENT_THINK_MS);
      expect(gs.state()!.phase).toBe('opponent-turn');
      vi.advanceTimersByTime(CLASH_MS);
      expect(gs.state()!.phase).toBe('player-turn');
    });

    it('waits only its thinking time after a turn with no combat', () => {
      vi.useFakeTimers();
      gs.startGame(HEAVY_DECK);
      gs.selectCard(0);
      gs.placeCard(0, 0);
      vi.advanceTimersByTime(OPPONENT_THINK_MS);
      expect(gs.state()!.phase).not.toBe('opponent-turn');
    });

    it('cancels a scheduled opponent move on retreat and on a new match', () => {
      vi.useFakeTimers();
      gs.startGame(HEAVY_DECK);
      gs.selectCard(0);
      gs.placeCard(0, 0);
      gs.startGame(HEAVY_DECK);
      vi.advanceTimersByTime(OPPONENT_THINK_MS * 10);
      expect(placedCount(gs.state()!)).toBe(0);
    });
  });

  // ─── Derived score ────────────────────────────────────────────────────────

  describe('score', () => {
    it('starts at nothing apiece: a card in hand is not a card owned', () => {
      gs.startGame(READY_TEST_DECK);
      expect(gs.scores()).toEqual({ player: 0, opponent: 0 });
    });

    it('always sums to the cards on the board, reaching eighteen at the end', () => {
      vi.useFakeTimers();
      gs.startGame(READY_TEST_DECK);
      while (gs.state()!.phase !== 'game-over') {
        const { player, opponent } = gs.scores();
        expect(player + opponent).toBe(placedCount(gs.state()!));
        takeTurn(gs);
      }
      const { player, opponent } = gs.scores();
      expect(player + opponent).toBe(placedCount(gs.state()!));
      expect(player + opponent).toBe(2 * HAND_SIZE);
    });

    it('moves only the placed card when a placement captures nothing', () => {
      gs.startGame(HEAVY_DECK);
      const before = gs.scores();
      gs.selectCard(0);
      gs.placeCard(0, 0); // an empty board: nothing to contest
      expect(gs.state()!.events.map((e) => e.kind)).toEqual(['place']);
      expect(gs.scores()).toEqual({ player: before.player + 1, opponent: before.opponent });
    });
  });

  // ─── End condition ────────────────────────────────────────────────────────

  it('ends only once both hands are empty, leaving seven cells empty', () => {
    vi.useFakeTimers();
    gs.startGame(HEAVY_DECK); // the player opens, so the opponent plays last
    for (let turn = 0; turn < HAND_SIZE; turn++) {
      playerTurn(gs);
      if (turn < HAND_SIZE - 1) vi.runOnlyPendingTimers();
    }
    // The player's ninth card is the seventeenth placed; the match continues.
    expect(placedCount(gs.state()!)).toBe(2 * HAND_SIZE - 1);
    expect(gs.state()!.phase).not.toBe('game-over');

    vi.runOnlyPendingTimers(); // the opponent's last card

    expect(placedCount(gs.state()!)).toBe(2 * HAND_SIZE);
    expect(gs.state()!.phase).toBe('game-over');
    expect(BOARD_SIZE * BOARD_SIZE - placedCount(gs.state()!)).toBe(7);
  });

  // ─── Inspection ───────────────────────────────────────────────────────────

  describe('inspect', () => {
    it('works while the opponent is moving and changes nothing else', () => {
      vi.useFakeTimers();
      gs.startGame(HEAVY_DECK);
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
    });

    it('works while a combat is to be chosen, and the choice still waits', () => {
      stagePlayerMove(testCard({ arrows: ['E', 'W'] }), [
        [2, 1, testCard({ arrows: ['E'] }), 'opponent'],
        [2, 3, testCard({ arrows: ['W'] }), 'opponent'],
      ]);
      gs.placeCard(2, 2);
      const card = gs.state()!.board[2][1]!.card;
      gs.inspect(card);
      expect(gs.state()!.inspected).toBe(card);
      expect(gs.state()!.phase).toBe('player-choosing');
      expect(gs.state()!.events.map((e) => e.kind)).toEqual(['place']);
    });

    it('works after the match has ended', () => {
      vi.useFakeTimers();
      playFullMatch(gs);
      expect(gs.state()!.phase).toBe('game-over');
      const card = testCard();
      gs.inspect(card);
      expect(gs.state()!.inspected).toBe(card);
      expect(gs.state()!.phase).toBe('game-over');
    });

    it('is distinct from selection, which still guards on the turn', () => {
      vi.useFakeTimers();
      gs.startGame(HEAVY_DECK);
      gs.selectCard(0);
      gs.placeCard(0, 0);
      gs.selectCard(1); // out of turn
      expect(gs.state()!.selectedCardIndex).toBeNull();
    });
  });

  // ─── Placement records ────────────────────────────────────────────────────

  describe('placement records', () => {
    it('opens every placement record with the cell it landed in', () => {
      vi.useFakeTimers();
      gs.startGame(HEAVY_DECK);
      gs.selectCard(0);
      gs.placeCard(2, 3);
      expect(gs.state()!.events[0]).toMatchObject({
        kind: 'place',
        at: { row: 2, col: 3 },
        side: 'player',
      });

      vi.runOnlyPendingTimers();
      const placed = gs.state()!.events[0];
      expect(placed).toMatchObject({ kind: 'place', side: 'opponent' });
      const at = (placed as { at: { row: number; col: number } }).at;
      expect(gs.state()!.board[at.row][at.col]!.owner).toBe('opponent');
    });
  });

  // ─── Result and retreat ───────────────────────────────────────────────────

  describe('the result', () => {
    it('calls an even finish a draw', () => {
      gs.startGame(READY_TEST_DECK);
      expect(finalize(finishedState(gs.state()!, HAND_SIZE, HAND_SIZE)).winner).toBe('draw');
    });

    it('gives the win to the higher score', () => {
      gs.startGame(READY_TEST_DECK);
      expect(finalize(finishedState(gs.state()!, 10, 8)).winner).toBe('player');
      expect(finalize(finishedState(gs.state()!, 8, 10)).winner).toBe('opponent');
    });

    it('agrees with the derived scores at the end of a real match', () => {
      vi.useFakeTimers();
      playFullMatch(gs);
      const s = gs.state()!;
      const { player, opponent } = countOwned(s);
      const expected = player > opponent ? 'player' : opponent > player ? 'opponent' : 'draw';
      expect(s.winner).toBe(expected);
    });
  });

  it('discards the match on retreat', () => {
    gs.startGame(READY_TEST_DECK);
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

function describeEvents(events: TurnEvent[]): string[] {
  return events.map((e) =>
    e.kind === 'place'
      ? `place ${e.at.row}-${e.at.col}`
      : e.kind === 'combat'
        ? `fight ${e.defender.row}-${e.defender.col}`
        : `${e.cause} ${e.at.row}-${e.at.col}`,
  );
}

/**
 * Plays the player's first remaining card into the first empty cell, choosing
 * the first offered combat for as long as the match asks for one.
 */
function playerTurn(gs: GameService): void {
  const s = gs.state()!;
  gs.selectCard(s.player.hand.findIndex((c) => c !== null));
  const cell = s.board.flatMap((row, r) => row.map((c, col) => ({ r, col, c }))).find((x) => !x.c)!;
  gs.placeCard(cell.r, cell.col);
  while (gs.state()!.phase === 'player-choosing') {
    const [first] = gs.state()!.resolution!.combatTargets;
    gs.chooseCombat(first.row, first.col);
  }
}

/** Takes whichever side's turn it is. Requires fake timers to be installed. */
function takeTurn(gs: GameService): void {
  if (gs.state()!.phase === 'player-turn') playerTurn(gs);
  else vi.runOnlyPendingTimers();
}

/** Runs a whole match to its end. Requires fake timers to be installed. */
function playFullMatch(gs: GameService): void {
  gs.startGame(READY_TEST_DECK);
  while (gs.state()!.phase !== 'game-over') takeTurn(gs);
}

/** A finished `base` whose board owns `player` cards for the player and `opponent` for the opponent. */
function finishedState(base: GameState, player: number, opponent: number): GameState {
  const board = blankBoard();
  const cells = board.flatMap((row, r) => row.map((_, c) => [r, c] as const));
  const card = new Card({
    name: 'Test Vessel',
    arrows: [],
    stars: 1,
    image: 'crawlid.webp',
    attack: 50,
    defense: 50,
    ability: 'None',
    set: 'Test',
    number: 1,
  });
  let i = 0;
  for (let n = 0; n < player; n++, i++) board[cells[i][0]][cells[i][1]] = { card, owner: 'player' };
  for (let n = 0; n < opponent; n++, i++)
    board[cells[i][0]][cells[i][1]] = { card, owner: 'opponent' };
  return {
    ...base,
    board,
    player: { hand: Array(HAND_SIZE).fill(null) },
    opponent: { hand: Array(HAND_SIZE).fill(null) },
    phase: 'opponent-turn',
  };
}
