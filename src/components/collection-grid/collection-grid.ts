import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { cardKey } from '../../model/card';
import { CardComponent } from '../card/card';
import { CardMenu } from '../card-menu/card-menu';
import type { Tile, TileSection } from '../decks/decks';

/**
 * The scrolling collection: one tile per distinct card the player holds, with
 * the count of copies drawn over the bottom of each.
 *
 * The tile does not draw a card face of its own. It renders the shared card
 * renderer at a width in the 120–199px band, which is what makes the ability
 * text absent — the renderer's own width gate, not a second mode. The badge is
 * the tile's, drawn over the card and changing nothing the renderer drew.
 *
 * Holds no state: which tile's menu is open is the page's, as is how the tiles
 * are sectioned, what the add action is called, and whether it is on offer for
 * each card. Every tile is addressed by its *flat* index in the page's sorted
 * list, whichever section it is drawn in.
 */
@Component({
  selector: 'app-collection-grid',
  imports: [CardComponent, CardMenu, NgTemplateOutlet],
  templateUrl: './collection-grid.html',
  styleUrl: './collection-grid.css',
})
export class CollectionGrid {
  /** One labelled section per star rating, or a single unlabelled run. */
  readonly sections = input.required<readonly TileSection[]>();

  /**
   * Bumped by the page on every reorder. Tiles are keyed on it, so a reorder
   * recreates every one and each replays its entrance in its new place.
   */
  readonly generation = input(0);

  /** The selected deck's name, or null when there is none. */
  readonly deckName = input<string | null>(null);

  /** The tile whose menu is open, if the open menu is one of the grid's. */
  readonly openIndex = input<number | null>(null);

  /** What the add action is called — `Add to Deck 1`. */
  readonly addLabel = input('Add to deck');

  readonly selectCard = output<number>();
  readonly addCard = output<number>();
  readonly readCard = output<number>();
  readonly dismissMenu = output<void>();

  /**
   * The sections with each tile's identity *stored on it*: the generation the
   * tile was laid out under, and its card.
   *
   * Stored rather than computed in the track expression, because Angular
   * works out an existing view's key by running the track expression again at
   * reconcile time — so a key that read the generation signal there would give
   * the old views the new generation, every key would match, and a reorder
   * would only move nodes. A node that ends up where it was (the middle tile of
   * a reversed odd-length run) would then not replay its entrance at all.
   */
  readonly keyed = computed(() => {
    const generation = this.generation();
    return this.sections().map((section) => ({
      stars: section.stars,
      start: section.start,
      tiles: section.tiles.map((tile, i) => ({
        tile,
        index: section.start + i,
        key: `${generation}:${cardKey(tile.card)}`,
      })),
    }));
  });

  /** `5 stars`, `1 star` — the heading's words. */
  starsText(stars: number): string {
    return `${stars} ${stars === 1 ? 'star' : 'stars'}`;
  }

  /** The heading's glyphs, one per star. */
  starGlyphs(stars: number): string {
    return '★'.repeat(stars);
  }

  /** The badge's accessible name: both counts in words, or the held count alone. */
  badgeLabel(tile: Tile): string {
    const deck = this.deckName();
    return deck === null ? `${tile.quantity} held` : `${tile.used} of ${tile.quantity} in ${deck}`;
  }
}
