import { Card, Direction } from './card';
import {
  CombatValue,
  ROLL_BANDS,
  Resolution,
  ResolutionEvent,
  bandFor,
  beginResolution,
  decideCombat,
  fight,
  finish,
  opponentCombatOrder,
  powerFor,
  rollD100,
} from './combat';
import { BOARD_SIZE, Board, Coord, Owner } from './game';

// ─── Fixtures ───────────────────────────────────────────────────────────────

function card(
  arrows: Direction[],
  stats: Partial<{ attack: number; defense: number; name: string }> = {},
): Card {
  return new Card({
    name: stats.name ?? 'Test Vessel',
    arrows,
    stars: 1,
    image: 'crawlid.webp',
    attack: stats.attack ?? 50,
    defense: stats.defense ?? 50,
    ability: 'None',
    set: 'Test',
    number: 1,
  });
}

function blank(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

function put(board: Board, row: number, col: number, c: Card, owner: Owner): void {
  board[row][col] = { card: c, owner };
}

/**
 * An rng that makes `rollD100` produce exactly `rolls`, in order, and fails
 * the test if anything rolls more often than scripted.
 */
function scripted(...rolls: number[]): () => number {
  const queue = [...rolls];
  return () => {
    if (queue.length === 0) throw new Error('rolled more often than the test scripted');
    return (queue.shift()! - 1 + 0.5) / 100;
  };
}

const power = (value: number): CombatValue => ({ kind: 'power', value });
const WIN: CombatValue = { kind: 'outright-win' };
const LOSS: CombatValue = { kind: 'outright-loss' };

const at = (row: number, col: number): Coord => ({ row, col });

function owners(board: Board): (Owner | null)[][] {
  return board.map((r) => r.map((c) => c?.owner ?? null));
}

function kinds(events: ResolutionEvent[]): string[] {
  return events.map((e) =>
    e.kind === 'combat'
      ? `fight ${e.defender.row}-${e.defender.col}`
      : `${e.cause} ${e.at.row}-${e.at.col}`,
  );
}

// ─── 1.1 The roll table ─────────────────────────────────────────────────────

describe('the roll table', () => {
  it('places every roll from 1 to 100 in exactly one band', () => {
    for (let roll = 1; roll <= 100; roll++) {
      const holding = ROLL_BANDS.filter((b) => roll >= b.min && roll <= b.max);
      expect(holding, `roll ${roll}`).toHaveLength(1);
    }
    expect(() => bandFor(0)).toThrow();
    expect(() => bandFor(101)).toThrow();
  });

  it('makes 100 an outright win and 1 an outright loss', () => {
    expect(bandFor(100)).toBe('outright-win');
    expect(bandFor(1)).toBe('outright-loss');
  });

  it('has exact band edges', () => {
    const edges: [number, number][] = [
      [95, 20],
      [94, 15],
      [85, 15],
      [84, 10],
      [70, 10],
      [69, 5],
      [51, 5],
      [50, -5],
      [32, -5],
      [31, -10],
      [17, -10],
      [16, -15],
      [7, -15],
      [6, -20],
      [2, -20],
    ];
    for (const [roll, percent] of edges) expect(bandFor(roll), `roll ${roll}`).toEqual({ percent });
  });

  it('scales a stat and rounds halves up', () => {
    expect(powerFor(40, 90)).toEqual(power(46)); // 40 × 1.15
    expect(powerFor(30, 20)).toEqual(power(27)); // 30 × 0.90
    expect(powerFor(10, 60)).toEqual(power(11)); // 10.5 → 11
    expect(powerFor(10, 40)).toEqual(power(10)); // 9.5 → 10
    expect(powerFor(5, 3)).toEqual(power(4)); // 4.0
    expect(powerFor(99, 100)).toEqual(WIN);
    expect(powerFor(99, 1)).toEqual(LOSS);
  });

  it('rolls only whole numbers from 1 to 100', () => {
    expect(rollD100(() => 0)).toBe(1);
    expect(rollD100(() => 0.999999)).toBe(100);
    expect(rollD100(() => 1)).toBe(100);
    for (let i = 0; i < 2000; i++) {
      const roll = rollD100(Math.random);
      expect(Number.isInteger(roll) && roll >= 1 && roll <= 100).toBe(true);
    }
  });

  it('rolls exactly what a scripted rng asks for', () => {
    const rng = scripted(1, 50, 100);
    expect([rollD100(rng), rollD100(rng), rollD100(rng)]).toEqual([1, 50, 100]);
  });
});

// ─── 1.2 Deciding a combat ──────────────────────────────────────────────────

describe('deciding a combat', () => {
  it("gives the attacker's 100 the win against anything but a 100", () => {
    for (const defense of [power(99), power(1), LOSS]) {
      expect(decideCombat(WIN, defense)).toBe('attacker');
    }
  });

  it("gives the defender's 100 the win against anything but a 100", () => {
    for (const attack of [power(200), power(1), LOSS]) {
      expect(decideCombat(attack, WIN)).toBe('defender');
    }
  });

  it('makes a 1 lose whatever the stats', () => {
    expect(decideCombat(LOSS, power(1))).toBe('defender');
    expect(decideCombat(power(1), LOSS)).toBe('attacker');
  });

  it('gives matching extremes to the defender', () => {
    expect(decideCombat(WIN, WIN)).toBe('defender');
    expect(decideCombat(LOSS, LOSS)).toBe('defender');
  });

  it('gives equal powers to the defender', () => {
    expect(decideCombat(power(30), power(30))).toBe('defender');
  });

  it('gives the win to a strictly stronger attack', () => {
    expect(decideCombat(power(31), power(30))).toBe('attacker');
    expect(decideCombat(power(29), power(30))).toBe('defender');
  });
});

// ─── 1.3 Targets ────────────────────────────────────────────────────────────

describe('beginning a resolution', () => {
  it('calls a chevron met by a returning chevron a combat', () => {
    const board = blank();
    put(board, 2, 2, card(['E']), 'player');
    put(board, 2, 3, card(['W']), 'opponent');
    const res = beginResolution(board, at(2, 2), 'player');
    expect(res.combatTargets).toEqual([at(2, 3)]);
    expect(res.defenseless).toEqual([]);
    expect(res.carried).toBeNull();
  });

  it('calls a chevron met by nothing defenseless', () => {
    const board = blank();
    put(board, 2, 2, card(['SE']), 'player');
    put(board, 3, 3, card(['N']), 'opponent');
    const res = beginResolution(board, at(2, 2), 'player');
    expect(res.combatTargets).toEqual([]);
    expect(res.defenseless).toEqual([at(3, 3)]);
  });

  it('leaves a neighbour that points in without being pointed at alone', () => {
    const board = blank();
    put(board, 2, 2, card(['N']), 'player');
    put(board, 2, 3, card(['W']), 'opponent');
    const res = beginResolution(board, at(2, 2), 'player');
    expect(res.combatTargets).toEqual([]);
    expect(res.defenseless).toEqual([]);
  });

  it('never targets a friendly neighbour', () => {
    const board = blank();
    put(board, 2, 2, card(['E', 'W']), 'player');
    put(board, 2, 3, card(['W']), 'player');
    put(board, 2, 1, card([]), 'player');
    const res = beginResolution(board, at(2, 2), 'player');
    expect(res.combatTargets).toEqual([]);
    expect(res.defenseless).toEqual([]);
  });

  it('targets nothing off the board and resolves the chevrons that remain', () => {
    const all: Direction[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const board = blank();
    put(board, 0, 0, card(all), 'opponent');
    put(board, 0, 1, card(['W']), 'player');
    put(board, 1, 0, card([]), 'player');
    const res = beginResolution(board, at(0, 0), 'opponent');
    expect(res.combatTargets).toEqual([at(0, 1)]);
    expect(res.defenseless).toEqual([at(1, 0)]);
  });

  it('keeps both lists in board order', () => {
    const board = blank();
    put(board, 2, 2, card(['S', 'N', 'E', 'W']), 'player');
    put(board, 3, 2, card(['N']), 'opponent');
    put(board, 1, 2, card(['S']), 'opponent');
    put(board, 2, 3, card([]), 'opponent');
    put(board, 2, 1, card([]), 'opponent');
    const res = beginResolution(board, at(2, 2), 'player');
    expect(res.combatTargets).toEqual([at(1, 2), at(3, 2)]);
    expect(res.defenseless).toEqual([at(2, 1), at(2, 3)]);
  });
});

// ─── 1.4 Fighting ───────────────────────────────────────────────────────────

describe('fighting a combat', () => {
  /**
   * The player's card at 2-2 pointing east and west at two opposing cards that
   * point back. Rolls of 51 give +5%, so attack 57 → 60 and defense 24 → 25.
   */
  function twoCombats(
    attack: number,
    east: number,
    west: number,
  ): { board: Board; res: Resolution } {
    const board = blank();
    put(board, 2, 2, card(['E', 'W'], { attack }), 'player');
    put(board, 2, 3, card(['W'], { defense: east }), 'opponent');
    put(board, 2, 1, card(['E'], { defense: west }), 'opponent');
    return { board, res: beginResolution(board, at(2, 2), 'player') };
  }

  it('wears the attack down by the beaten defense: 60 vs 25 carries 35', () => {
    const { board, res } = twoCombats(57, 24, 24);
    const first = fight(board, res, at(2, 3), scripted(51, 51));
    const combat = first.events[0];
    expect(combat).toMatchObject({
      kind: 'combat',
      attack: power(60),
      defense: power(25),
      winner: 'attacker',
    });
    expect(first.res!.carried).toEqual(power(35));
    expect(first.res!.combatTargets).toEqual([at(2, 1)]);
  });

  it('rolls the attacker once and each defender once', () => {
    const { board, res } = twoCombats(57, 24, 10);
    const rng = vi.fn(scripted(51, 51, 51));
    const first = fight(board, res, at(2, 3), rng);
    const second = fight(first.board, first.res!, at(2, 1), rng);
    expect(rng).toHaveBeenCalledTimes(3);
    expect(second.events[0]).toMatchObject({
      attackRoll: null,
      attack: power(35),
      defenseRoll: 51,
    });
  });

  it('lets a worn-down attack lose', () => {
    const { board, res } = twoCombats(57, 24, 33); // 33 @ 51 → 35, equal to the carried 35
    const first = fight(board, res, at(2, 3), scripted(51, 51));
    const second = fight(first.board, first.res!, at(2, 1), scripted(51));
    expect(second.events[0]).toMatchObject({
      attack: power(35),
      defense: power(35),
      winner: 'defender',
    });
    expect(second.res).toBeNull();
    expect(second.board[2][2]!.owner).toBe('opponent');
  });

  it('carries a 100 through three combats', () => {
    const board = blank();
    put(board, 2, 2, card(['N', 'E', 'W'], { attack: 1 }), 'player');
    for (const [r, c, back] of [
      [1, 2, 'S'],
      [2, 3, 'W'],
      [2, 1, 'E'],
    ] as const) {
      put(board, r, c, card([back], { defense: 100 }), 'opponent');
    }
    let res: Resolution | null = beginResolution(board, at(2, 2), 'player');
    let b = board;
    const rng = scripted(100, 99, 99, 99);
    for (const target of [at(1, 2), at(2, 3), at(2, 1)]) {
      const step = fight(b, res!, target, rng);
      expect(step.events[0]).toMatchObject({ attack: WIN, winner: 'attacker' });
      b = step.board;
      res = step.res;
    }
    expect(res!.carried).toEqual(WIN);
    expect(
      owners(b)
        .flat()
        .filter((o) => o === 'player'),
    ).toHaveLength(4);
  });

  it('lets a defender roll 100 against a carried 100', () => {
    const { board, res } = twoCombats(50, 50, 50);
    const first = fight(board, res, at(2, 3), scripted(100, 60));
    const second = fight(first.board, first.res!, at(2, 1), scripted(100));
    expect(second.events[0]).toMatchObject({ attack: WIN, defense: WIN, winner: 'defender' });
    expect(second.res).toBeNull();
  });

  it("takes nothing off the attacker for a defender's 1", () => {
    const { board, res } = twoCombats(48, 90, 10); // 48 @ 51 → 50
    const first = fight(board, res, at(2, 3), scripted(51, 1));
    expect(first.events[0]).toMatchObject({ attack: power(50), defense: LOSS, winner: 'attacker' });
    expect(first.res!.carried).toEqual(power(50));
  });

  it('takes a beaten defender and its combo', () => {
    const board = blank();
    put(board, 2, 2, card(['E'], { attack: 90 }), 'player');
    put(board, 2, 3, card(['W', 'N', 'S'], { defense: 10 }), 'opponent');
    put(board, 1, 3, card([]), 'opponent');
    put(board, 3, 3, card(['N']), 'opponent');
    put(board, 2, 4, card(['W']), 'opponent'); // not pointed at by the loser
    const res = beginResolution(board, at(2, 2), 'player');
    const step = fight(board, res, at(2, 3), scripted(51, 51));
    expect(kinds(step.events)).toEqual(['fight 2-3', 'combat 2-3', 'combo 1-3', 'combo 3-3']);
    expect(step.board[2][4]!.owner).toBe('opponent');
    expect(step.board[1][3]!.owner).toBe('player');
  });

  it("hands a beaten attacker and its friendly neighbours to the defender's owner", () => {
    const board = blank();
    put(board, 2, 2, card(['E', 'N', 'S'], { attack: 10 }), 'player');
    put(board, 2, 3, card(['W'], { defense: 90 }), 'opponent');
    put(board, 1, 2, card([]), 'player');
    put(board, 3, 2, card([]), 'player');
    put(board, 2, 1, card([]), 'player'); // not pointed at
    const res = beginResolution(board, at(2, 2), 'player');
    const step = fight(board, res, at(2, 3), scripted(51, 51));
    expect(step.res).toBeNull();
    expect(kinds(step.events)).toEqual(['fight 2-3', 'combat 2-2', 'combo 1-2', 'combo 3-2']);
    expect(step.events.slice(1).every((e) => e.kind === 'capture' && e.to === 'opponent')).toBe(
      true,
    );
    expect(owners(step.board)[2][1]).toBe('player');
  });

  it('does not chain a combo', () => {
    const board = blank();
    put(board, 2, 1, card(['E'], { attack: 90 }), 'player');
    put(board, 2, 2, card(['W', 'E'], { defense: 10 }), 'opponent');
    put(board, 2, 3, card(['E']), 'opponent'); // taken by the combo, points further east
    put(board, 2, 4, card([]), 'opponent');
    const res = beginResolution(board, at(2, 1), 'player');
    const step = fight(board, res, at(2, 2), scripted(51, 51));
    expect(step.board[2][3]!.owner).toBe('player');
    expect(step.board[2][4]!.owner).toBe('opponent');
  });

  it('settles a pending combat that a combo takes, and prunes a defenseless one', () => {
    const board = blank();
    // The placed card points at three: N (combat), E (combat), S (defenseless).
    put(board, 2, 2, card(['N', 'E', 'S'], { attack: 90 }), 'player');
    put(board, 1, 2, card(['S', 'SE'], { defense: 10 }), 'opponent'); // its combo reaches 2-3
    put(board, 2, 3, card(['W', 'N']), 'opponent');
    put(board, 3, 2, card([]), 'opponent');
    let res = beginResolution(board, at(2, 2), 'player');
    expect(res.combatTargets).toEqual([at(1, 2), at(2, 3)]);
    const step = fight(board, res, at(1, 2), scripted(51, 51));
    expect(step.board[2][3]!.owner).toBe('player');
    expect(step.res!.combatTargets).toEqual([]);
    expect(step.res!.defenseless).toEqual([at(3, 2)]);
    res = step.res!;
    expect(() => fight(step.board, res, at(2, 3), scripted(51))).toThrow();
  });

  it('lets a combo take a card that would have defended, with no roll', () => {
    const board = blank();
    put(board, 2, 1, card(['E'], { attack: 90 }), 'player');
    put(board, 2, 2, card(['W', 'E'], { defense: 10 }), 'opponent');
    put(board, 2, 3, card(['W'], { defense: 100 }), 'opponent'); // points back at the loser
    const res = beginResolution(board, at(2, 1), 'player');
    const step = fight(board, res, at(2, 2), scripted(51, 51)); // only two rolls
    expect(step.board[2][3]!.owner).toBe('player');
  });

  it('changes only the owner of a taken card', () => {
    const { board, res } = twoCombats(90, 10, 10);
    const before = board[2][3]!.card;
    const step = fight(board, res, at(2, 3), scripted(51, 51));
    expect(step.board[2][3]!.card).toBe(before);
    expect(board[2][3]!.owner).toBe('opponent'); // the input board is untouched
  });
});

// ─── 1.5 Finishing ──────────────────────────────────────────────────────────

describe('finishing a resolution', () => {
  function mixed(): { board: Board; res: Resolution } {
    const board = blank();
    put(board, 2, 2, card(['E', 'W', 'S', 'N'], { attack: 80 }), 'player');
    put(board, 2, 3, card(['W', 'N'], { defense: 10 }), 'opponent'); // combo → 1-3
    put(board, 1, 3, card([]), 'opponent');
    put(board, 2, 1, card(['E', 'S'], { defense: 10 }), 'opponent'); // combo → 3-1
    put(board, 3, 1, card([]), 'opponent');
    put(board, 3, 2, card([]), 'opponent'); // defenseless
    put(board, 1, 2, card([], { defense: 100 }), 'opponent'); // defenseless
    return { board, res: beginResolution(board, at(2, 2), 'player') };
  }

  it('takes the defenseless only after the combats, in record order', () => {
    const { board, res } = mixed();
    const rng = scripted(51, 51, 51);
    const a = fight(board, res, at(2, 1), rng);
    const b = fight(a.board, a.res!, at(2, 3), rng);
    const end = finish(b.board, b.res!);
    expect(kinds([...a.events, ...b.events, ...end.events])).toEqual([
      'fight 2-1',
      'combat 2-1',
      'combo 3-1',
      'fight 2-3',
      'combat 2-3',
      'combo 1-3',
      'defenseless 1-2',
      'defenseless 3-2',
    ]);
    expect(
      owners(end.board)
        .flat()
        .filter((o) => o === 'opponent'),
    ).toHaveLength(0);
  });

  it('forfeits the rest when the attacker loses', () => {
    const { board, res } = mixed();
    const lost = fight(board, res, at(2, 1), scripted(1, 51));
    expect(lost.res).toBeNull();
    expect(lost.board[3][2]!.owner).toBe('opponent');
    expect(lost.board[2][3]!.owner).toBe('opponent');
  });

  it('takes the defenseless with no roll when there were no combats', () => {
    const board = blank();
    put(board, 0, 0, card(['E']), 'opponent');
    put(board, 0, 1, card([], { defense: 100 }), 'player');
    const res = beginResolution(board, at(0, 0), 'opponent');
    const end = finish(board, res);
    expect(end.events).toEqual([
      { kind: 'capture', at: at(0, 1), to: 'opponent', cause: 'defenseless' },
    ]);
  });

  it('does not let a defenseless capture spread', () => {
    const board = blank();
    put(board, 2, 2, card(['E']), 'player');
    put(board, 2, 3, card(['E']), 'opponent');
    put(board, 2, 4, card([]), 'opponent');
    const end = finish(board, beginResolution(board, at(2, 2), 'player'));
    expect(end.board[2][4]!.owner).toBe('opponent');
  });
});

// ─── 1.6 The opponent's order ───────────────────────────────────────────────

describe("the opponent's combat order", () => {
  it('fights the weakest base defense first, breaking ties by board order', () => {
    const board = blank();
    put(board, 1, 1, card([], { defense: 40 }), 'player');
    put(board, 1, 2, card([], { defense: 20 }), 'player');
    put(board, 2, 1, card([], { defense: 40 }), 'player');
    put(board, 3, 3, card([], { defense: 5 }), 'player');
    expect(opponentCombatOrder(board, [at(2, 1), at(1, 1), at(3, 3), at(1, 2)])).toEqual([
      at(3, 3),
      at(1, 2),
      at(1, 1),
      at(2, 1),
    ]);
  });
});
