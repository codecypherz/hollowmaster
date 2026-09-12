import { Component, input } from '@angular/core';

/**
 * An amount of Geo: the numeral, then the currency's mark.
 *
 * The arrangement is inside the component rather than left to the surface, so
 * there is exactly one answer to what order the two parts come in, what the
 * mark is, and what assistive technology hears — the `alt` text is the whole
 * of the currency's accessible name, which is why a button labelled only with
 * `<app-geo>` still announces "100 Geo" rather than "100".
 *
 * It takes no size: `.geo-mark` is sized in `em`, so the mark is drawn from
 * whatever type the amount sits in. A surface that wants a bigger amount sets
 * `font-size` on its own element and the mark follows.
 *
 * See src/styles/primitives.css for the two classes, and
 * openspec/specs/design-system/primitives/spec.md for the contract.
 */
@Component({
  selector: 'app-geo',
  templateUrl: './geo.html',
  styleUrl: './geo.css',
  host: { class: 'geo-amount' },
})
export class Geo {
  /** The amount to show. Zero is an amount like any other. */
  readonly amount = input.required<number>();
}
