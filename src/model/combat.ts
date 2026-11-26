import { Card, Direction } from './card';
import { BOARD_SIZE, Board, Coord, Owner, other } from './game';

/*
 * The combat rules, as pure functions over a board.
 *
 * Nothing here holds state or reaches for `Math.random`: every function that
 * needs chance is handed an `rng`, so a spec can script the exact rolls a rule
 * turns on rather than looping until the dice happen to land there.
 */

// ─── The roll table ─────────────────────────────────────────────────────────

/** What a roll does to a side: wins or loses outright, or scales its stat. */
export type RollEffect = 'outright-win' | 'outright-loss' | { percent: number };

/**
 * The band table, stated once. Each band covers `min`–`max` inclusive; between
 * them the bands cover 1–100 exactly once. Percentages are whole numbers so
 * the scaling stays in integer arithmetic.
 */
export const ROLL_BANDS: readonly { min: number; max: number; effect: RollEffect }[] =
  Object.freeze([
    { min: 100, max: 100, effect: 'outright-win' },
    { min: 95, max: 99, effect: { percent: 20 } },
    { min: 85, max: 94, effect: { percent: 15 } },
    { min: 70, max: 84, effect: { percent: 10 } },
    { min: 51, max: 69, effect: { percent: 5 } },
    { min: 32, max: 50, effect: { percent: -5 } },
    { min: 17, max: 31, effect: { percent: -10 } },
    { min: 7, max: 16, effect: { percent: -15 } },
    { min: 2, max: 6, effect: { percent: -20 } },
    { min: 1, max: 1, effect: 'outright-loss' },
  ]);

export const ROLL_MIN = 1;
export const ROLL_MAX = 100;

/** A uniformly random whole number from 1 to 100 inclusive. */
export function rollD100(rng: () => number): number {
  const roll = Math.floor(rng() * ROLL_MAX) + ROLL_MIN;
  // `rng` is meant to be [0, 1); a stray 1 must still not roll 101.
  return Math.min(ROLL_MAX, Math.max(ROLL_MIN, roll));
}

/** The band a roll falls in. Throws for a number the dice cannot produce. */
export function bandFor(roll: number): RollEffect {
  const band = ROLL_BANDS.find((b) => roll >= b.min && roll <= b.max);
  if (!band) throw new RangeError(`no roll band holds ${roll}`);
  return band.effect;
}

/**
 * What a side brings to a combat. An outright result is not a number: a 100
 * sweeps the turn and a defender's 1 takes nothing off the attacker, and a
 * sentinel such as `Infinity` would leak into both the subtraction and the
 * display.
 */
export type CombatValue =
  { kind: 'outright-win' } | { kind: 'outright-loss' } | { kind: 'power'; value: number };

/** A side's combat value for `stat` and `roll`; scaled powers round halves up. */
export function powerFor(stat: number, roll: number): CombatValue {
  const effect = bandFor(roll);
  if (effect === 'outright-win' || effect === 'outright-loss') return { kind: effect };
  // stat × (100 + p) / 100, rounded half-up, without leaving the integers.
  return { kind: 'power', value: Math.floor((stat * (100 + effect.percent) + 50) / 100) };
}

/**
 * Who wins: matching extremes go to the defender, then a 100 wins and a 1
 * loses, and otherwise the attacker needs strictly more power.
 */
export function decideCombat(attack: CombatValue, defense: CombatValue): 'attacker' | 'defender' {
  if (attack.kind === 'power' && defense.kind === 'power') {
    return attack.value > defense.value ? 'attacker' : 'defender';
  }
  if (attack.kind === defense.kind) return 'defender';
  return attack.kind === 'outright-win' || defense.kind === 'outright-loss'
    ? 'attacker'
    : 'defender';
}

// ─── Geometry ───────────────────────────────────────────────────────────────

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

const OPPOSITE: Record<Direction, Direction> = {
  N: 'S',
  NE: 'SW',
  E: 'W',
  SE: 'NW',
  S: 'N',
  SW: 'NE',
  W: 'E',
  NW: 'SE',
};

function onBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/** Row-major board order, the tie-break every list here is kept in. */
function boardOrder(a: Coord, b: Coord): number {
  return a.row - b.row || a.col - b.col;
}

function same(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col;
}

/** The on-board cells the card at `at` points at, each with the direction it points. */
function pointedAt(card: Card, at: Coord): { coord: Coord; dir: Direction }[] {
  const out: { coord: Coord; dir: Direction }[] = [];
  for (const dir of card.arrows) {
    const [dr, dc] = DIR_DELTA[dir];
    const row = at.row + dr;
    const col = at.col + dc;
    if (onBoard(row, col)) out.push({ coord: { row, col }, dir });
  }
  return out.sort((a, b) => boardOrder(a.coord, b.coord));
}

// ─── Resolution ─────────────────────────────────────────────────────────────

/**
 * A placement part-way through being resolved. It can be held between state
 * updates, which is what lets the player's turn wait for them to choose the
 * next combat.
 */
export interface Resolution {
  /** The attacker's cell: the card just played. */
  at: Coord;
  /** Who played it. */
  side: Owner;
  /** Combats still to fight, in board order; pruned as combos take them. */
  combatTargets: Coord[];
  /** Taken at the end, if the attacker survives every combat. */
  defenseless: Coord[];
  /** The attacker's carried value; null until its first roll. */
  carried: CombatValue | null;
}

export interface CombatEvent {
  kind: 'combat';
  attacker: Coord;
  defender: Coord;
  /** The attacker's roll, or null when it fought on a value carried in. */
  attackRoll: number | null;
  /** The value the attacker fought with: rolled now, or carried in. */
  attack: CombatValue;
  defenseRoll: number;
  defense: CombatValue;
  winner: 'attacker' | 'defender';
}

export interface CaptureEvent {
  kind: 'capture';
  at: Coord;
  to: Owner;
  cause: 'combat' | 'combo' | 'defenseless';
}

export type ResolutionEvent = CombatEvent | CaptureEvent;

/**
 * The targets of the card just placed at `at` by `side`: every adjacent
 * opposing card one of its chevrons points at, split by whether that card
 * points back. Friendly, empty, and off-board cells are not targets, and a
 * neighbour pointing in without being pointed at is ignored.
 */
export function beginResolution(board: Board, at: Coord, side: Owner): Resolution {
  const placed = board[at.row][at.col];
  if (!placed) throw new Error(`no card at ${at.row}-${at.col} to resolve`);
  const combatTargets: Coord[] = [];
  const defenseless: Coord[] = [];
  for (const { coord, dir } of pointedAt(placed.card, at)) {
    const target = board[coord.row][coord.col];
    if (!target || target.owner === side) continue;
    (target.card.hasArrow(OPPOSITE[dir]) ? combatTargets : defenseless).push(coord);
  }
  return { at, side, combatTargets, defenseless, carried: null };
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/**
 * Fights the combat against `target`, one of `res.combatTargets`.
 *
 * The attacker rolls only if it has not yet this turn; the defender always
 * rolls. The loser is taken by the winner's owner along with its combo: every
 * card it points at that still belongs to the player it was taken from. The
 * combo reaches one step and no further. Anything the combo took is pruned
 * from what is still to be fought or taken.
 *
 * `res` comes back null when the attacker lost, which ends the turn.
 */
export function fight(
  board: Board,
  res: Resolution,
  target: Coord,
  rng: () => number,
): { board: Board; res: Resolution | null; events: ResolutionEvent[] } {
  if (!res.combatTargets.some((t) => same(t, target))) {
    throw new Error(`${target.row}-${target.col} is not a combat target`);
  }
  const next = cloneBoard(board);
  const attacker = next[res.at.row][res.at.col]!;
  const defender = next[target.row][target.col]!;

  const attackRoll = res.carried ? null : rollD100(rng);
  const attack = res.carried ?? powerFor(attacker.card.attack, attackRoll!);
  const defenseRoll = rollD100(rng);
  const defense = powerFor(defender.card.defense, defenseRoll);
  const winner = decideCombat(attack, defense);

  const events: ResolutionEvent[] = [
    {
      kind: 'combat',
      attacker: res.at,
      defender: target,
      attackRoll,
      attack,
      defenseRoll,
      defense,
      winner,
    },
  ];

  const loserAt = winner === 'attacker' ? target : res.at;
  const takenBy = winner === 'attacker' ? res.side : other(res.side);
  const takenFrom = other(takenBy);
  const loser = next[loserAt.row][loserAt.col]!;

  next[loserAt.row][loserAt.col] = { ...loser, owner: takenBy };
  events.push({ kind: 'capture', at: loserAt, to: takenBy, cause: 'combat' });

  for (const { coord } of pointedAt(loser.card, loserAt)) {
    const cell = next[coord.row][coord.col];
    if (!cell || cell.owner !== takenFrom) continue;
    next[coord.row][coord.col] = { ...cell, owner: takenBy };
    events.push({ kind: 'capture', at: coord, to: takenBy, cause: 'combo' });
  }

  if (winner === 'defender') return { board: next, res: null, events };

  const stillOpposing = (c: Coord) => next[c.row][c.col]?.owner === other(res.side);
  // A won combat leaves the attacker outright or with more power than it met.
  const carried: CombatValue =
    attack.kind === 'power' && defense.kind === 'power'
      ? { kind: 'power', value: attack.value - defense.value }
      : attack;

  return {
    board: next,
    res: {
      ...res,
      combatTargets: res.combatTargets.filter((t) => !same(t, target) && stillOpposing(t)),
      defenseless: res.defenseless.filter(stillOpposing),
      carried,
    },
    events,
  };
}

/**
 * Ends a resolution the attacker survived: every defenseless target still
 * opposing is taken, with no roll and no combo.
 */
export function finish(board: Board, res: Resolution): { board: Board; events: CaptureEvent[] } {
  const next = cloneBoard(board);
  const events: CaptureEvent[] = [];
  for (const at of res.defenseless) {
    const cell = next[at.row][at.col];
    if (!cell || cell.owner === res.side) continue;
    next[at.row][at.col] = { ...cell, owner: res.side };
    events.push({ kind: 'capture', at, to: res.side, cause: 'defenseless' });
  }
  return { board: next, events };
}

/**
 * The order the opponent fights its combats in: weakest base defense first,
 * since attack wears down and the softest defender costs the least of it.
 * Ties fall back to board order.
 */
export function opponentCombatOrder(board: Board, targets: readonly Coord[]): Coord[] {
  const defense = (c: Coord) => board[c.row][c.col]!.card.defense;
  return [...targets].sort((a, b) => defense(a) - defense(b) || boardOrder(a, b));
}
