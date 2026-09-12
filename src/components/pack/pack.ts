import { Component, booleanAttribute, input } from '@angular/core';
import { PackDefinition } from '../../model/pack';

/**
 * The single pack renderer. Every sealed pack the application shows — on the
 * storefront and in the opening alike — is this component, so the wrapper's
 * craft has one definition and a surface supplies only which tier to draw.
 *
 * Sizing contract, and the card's: the pack fills the width it is given and
 * derives its height from the fixed 2.5:4 ratio, and it is its own named query
 * container so every metric inside scales from the pack's own width. A surface
 * passes no measurements down, and one renderer works from the 120px minimum
 * up to the storefront's full size.
 *
 * Named PackComponent rather than Pack to keep the model's `PackDefinition`
 * and this apart, the way CardComponent is kept apart from Card.
 *
 * See openspec/specs/design-system/pack/spec.md.
 */
@Component({
  selector: 'app-pack',
  templateUrl: './pack.html',
  styleUrl: './pack.css',
  host: { '[class.is-torn]': 'torn()' },
})
export class PackComponent {
  /** The tier to draw. Its name is printed on the wrapper; its art fills the face. */
  readonly pack = input.required<PackDefinition>();

  /**
   * Whether this pack has been opened. Sealed is the resting state; the torn
   * state is an input rather than something the component decides, so the
   * opening owns the timing and the style guide can show both.
   */
  readonly torn = input(false, { transform: booleanAttribute });
}
