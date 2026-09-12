import { Component, input, output } from '@angular/core';
import { OwnedCard } from '../../model/collection';
import { CardComponent } from '../card/card';
import { CardMenu } from '../card-menu/card-menu';

/**
 * The scrolling collection: one tile per distinct card the player holds, with
 * the count of copies drawn over the bottom of each.
 *
 * The tile does not draw a card face of its own. It renders the shared card
 * renderer at a width in the 120–199px band, which is what makes the ability
 * text absent — the renderer's own width gate, not a second mode. The badge is
 * the tile's, drawn over the card and changing nothing the renderer drew.
 *
 * Holds no state: which tile's menu is open is the page's, as is what the add
 * action is called and whether it is on offer at all.
 */
@Component({
  selector: 'app-collection-grid',
  imports: [CardComponent, CardMenu],
  templateUrl: './collection-grid.html',
  styleUrl: './collection-grid.css',
})
export class CollectionGrid {
  readonly owned = input.required<readonly OwnedCard[]>();

  /** The tile whose menu is open, if the open menu is one of the grid's. */
  readonly openIndex = input<number | null>(null);

  /** What the add action is called — `Add to Deck 1`. */
  readonly addLabel = input('Add to deck');

  /** Whether adding is on offer at all. */
  readonly addAvailable = input(false);

  /** Why it is not, stated to the player. */
  readonly addReason = input('');

  readonly selectCard = output<number>();
  readonly addCard = output<number>();
  readonly readCard = output<number>();
  readonly dismissMenu = output<void>();
}
