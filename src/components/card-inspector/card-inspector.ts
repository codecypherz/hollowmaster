import { Component, computed, input } from '@angular/core';
import { Card } from '../../model/card';
import { CardComponent } from '../card/card';

/**
 * The codex's reading slot: the one place on the screen where a card is
 * rendered above the card renderer's 200px ability gate, so the player can read
 * the ability text, set, and number that no hand or board card is wide enough
 * to show.
 *
 * The component does not choose its width — the arena's geometry gives it two
 * card units, which is above the gate at every unit the geometry can produce
 * (see `src/model/arena.ts`). It only guarantees that the box is held whether or
 * not a card is in it, so inspecting the first card of a match does not shift
 * the three columns beside it.
 */
@Component({
  selector: 'app-card-inspector',
  imports: [CardComponent],
  templateUrl: './card-inspector.html',
  styleUrl: './card-inspector.css',
})
export class CardInspector {
  readonly card = input<Card | null>(null);

  /**
   * The inspected card as a list of at most one, keyed on the card itself.
   *
   * `@if` would reuse the same DOM node across a change of card, and a CSS
   * enter animation only runs when its element is created — so the transition
   * between two cards would never play. Iterating and tracking by identity
   * destroys the outgoing node and creates the incoming one, which restarts it.
   */
  readonly reading = computed(() => {
    const card = this.card();
    return card ? [card] : [];
  });
}
