import { Component, booleanAttribute, computed, input, output } from '@angular/core';
import { Card } from '../../model/card';
import { Owner } from '../../model/game';
import { CardComponent } from '../card/card';

/** A hand position: the card in it, if any, and where in the rack it sits. */
export interface RackSlot {
  card: Card | null;
  index: number;
  /** 0 for the outer sub-column (away from the board), 1 for the inner one. */
  col: number;
  /** Which of the five rows the position hangs from. */
  row: number;
}

/**
 * One hand, as nine positions.
 *
 * Nine cards do not make a rectangle, so the rack is two sub-columns — five
 * positions outside, four inside, the inner four hung half a position lower so
 * the two interleave and the rack reads as a fanned quiver rather than a grid
 * with a hole in it. Alternating indices between the sub-columns means a
 * staggered deal cascades down the rack instead of filling one column and then
 * the other.
 *
 * Both hands use this one component, mirrored — which is what makes "both hands
 * are presented alike" true by construction rather than by discipline.
 */
@Component({
  selector: 'app-hand-rack',
  imports: [CardComponent],
  templateUrl: './hand-rack.html',
  styleUrl: './hand-rack.css',
  host: {
    role: 'group',
    '[class.side-opponent]': "side() === 'opponent'",
  },
})
export class HandRack {
  /** The hand's nine slots; `null` where the card has been played. */
  readonly cards = input.required<readonly (Card | null)[]>();

  /** Which side of the board this rack hangs on. */
  readonly side = input.required<Owner>();

  /** Face down reveals nothing: no name, art, stars, stats, chevrons, or set. */
  readonly faceDown = input(false, { transform: booleanAttribute });

  /** The slot currently chosen for placement, if any. */
  readonly selectedIndex = input<number | null>(null);

  /** The card currently in the inspector, so its position can be marked. */
  readonly inspected = input<Card | null>(null);

  /** A position was activated — the screen decides what that means. */
  readonly activate = output<number>();

  readonly slots = computed<RackSlot[]>(() =>
    this.cards().map((card, index) => ({
      card,
      index,
      col: index % 2,
      row: Math.floor(index / 2),
    })),
  );
}
