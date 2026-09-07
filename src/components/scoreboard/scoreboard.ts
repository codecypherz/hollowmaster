import { Component, Signal, effect, input, output, signal, untracked } from '@angular/core';
import { Owner } from '../../model/game';

/**
 * How long one step of the score count-up takes, in milliseconds.
 *
 * The one piece of this screen's motion that cannot be pure CSS: a score walks
 * to its new value one point at a time, and the number of steps is not known
 * until the capture resolves. Deltas are 0–4, so a fixed per-step interval is
 * enough — mirrors `--dur-instant`, which is what every other quick beat on
 * this screen is paced at.
 */
const SCORE_STEP_MS = 150;

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * A signal that walks toward `target` one whole point per step, so a capture
 * reads as a count rather than a jump.
 *
 * The first value is taken as-is — a match opening on nine apiece is a starting
 * position, not a change to animate — as is every value once the user has asked
 * for reduced motion. Must be called from an injection context.
 */
function countTo(target: () => number): Signal<number> {
  const shown = signal(0);
  let seeded = false;

  effect((onCleanup) => {
    const goal = target();
    if (!seeded || prefersReducedMotion()) {
      seeded = true;
      shown.set(goal);
      return;
    }
    if (untracked(shown) === goal) return;

    const timer = setInterval(() => {
      const current = untracked(shown);
      if (current === goal) {
        clearInterval(timer);
        return;
      }
      shown.set(current + Math.sign(goal - current));
    }, SCORE_STEP_MS);

    onCleanup(() => clearInterval(timer));
  });

  return shown.asReadonly();
}

/**
 * The standing panel: both players' names and scores, whose turn it is, and the
 * control that abandons the match.
 *
 * Purely presentational — it takes the scores it shows and emits the intent to
 * retreat, leaving the match state to `GameService` and the navigation to the
 * screen that hosts it.
 */
@Component({
  selector: 'app-scoreboard',
  imports: [],
  templateUrl: './scoreboard.html',
  styleUrl: './scoreboard.css',
})
export class Scoreboard {
  readonly playerScore = input(0);
  readonly opponentScore = input(0);

  /** Whose turn it is, or `null` once the match has ended. */
  readonly activeSide = input<Owner | null>(null);

  /** A line of flavour under the names — the turn, in the screen's voice. */
  readonly status = input('');

  readonly retreat = output<void>();

  readonly playerShown = countTo(() => this.playerScore());
  readonly opponentShown = countTo(() => this.opponentScore());
}
