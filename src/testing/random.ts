/**
 * A stand-in for `GAME_RANDOM` whose next values a spec can dictate.
 *
 * Queued values are handed out first, in order; once the queue is empty the
 * fallback answers, so a spec scripts only the draws it cares about and lets
 * the rest of the match (the deal, the coin) run on as usual.
 */
export interface ScriptedRandom {
  (): number;
  /** Queues raw [0, 1) values. */
  queue(...values: number[]): void;
  /** Queues values that make `rollD100` roll exactly these numbers. */
  rolls(...rolls: number[]): void;
  /** Queues the value that picks index `i` from a list of `n`. */
  pick(i: number, n: number): void;
  /** How many queued values have not been drawn yet. */
  readonly pending: number;
}

export function scriptedRandom(fallback: () => number = () => Math.random()): ScriptedRandom {
  const queue: number[] = [];
  const rng = (() => (queue.length > 0 ? queue.shift()! : fallback())) as ScriptedRandom;
  rng.queue = (...values) => queue.push(...values);
  rng.rolls = (...rolls) => queue.push(...rolls.map((r) => (r - 0.5) / 100));
  rng.pick = (i, n) => queue.push((i + 0.5) / n);
  Object.defineProperty(rng, 'pending', { get: () => queue.length });
  return rng;
}
