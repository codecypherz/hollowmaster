import { Component, input } from '@angular/core';

/**
 * An amount of Rosaries: the numeral, then the currency's mark.
 *
 * The Geo amount's twin (see `src/components/geo/`), with its own mark and its
 * own accessible name. The `alt` text is the whole of the currency's name, so
 * a control labelled `Buy <app-rosary>` announces "Buy 100 Rosaries" and the
 * word is never set beside the number.
 *
 * It takes no size: the mark is sized in `em` by the selectors it shares with
 * the Geo amount in src/styles/primitives.css, so the two read as one family.
 */
@Component({
  selector: 'app-rosary',
  templateUrl: './rosary.html',
  styleUrl: './rosary.css',
  host: { class: 'rosary-amount' },
})
export class Rosary {
  /** The amount to show. Zero is an amount like any other. */
  readonly amount = input.required<number>();
}
