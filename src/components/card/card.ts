import { Component, booleanAttribute, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Card, Direction, DIRECTIONS as MODEL_DIRECTIONS } from '../../model/card';
import { Owner } from '../../model/game';

/**
 * The eight directions in the order the 3x3 chevron grid reads them. Which
 * directions exist is the model's business; only their layout order is ours.
 */
const GRID_ORDER: Direction[] = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE'];

if (GRID_ORDER.length !== MODEL_DIRECTIONS.length) {
  throw new Error('Card chevron grid is out of step with the model directions');
}

/** The five slots the star track always draws, lit or unlit. */
const STAR_SLOTS = [1, 2, 3, 4, 5];

/** The rating at which the sixth star renders outside the five-slot track. */
const SIXTH_STAR = 6;

/**
 * Distinguishes the ability text of one rendered card from another's, so
 * `aria-describedby` on each frame resolves to that card's own text. Module
 * level rather than per-component because the ids must be unique across every
 * card on the page, not within one.
 */
let nextAbilityId = 0;

/**
 * The single card renderer. Every card in the application goes through this
 * component — hand, board tile, and opened pack alike — so the look-and-feel
 * constraints (2.5:3.5 frame, three sections, chevrons outside the sections,
 * stars, stats as bars and never numerals) are enforced in one file.
 *
 * The component does not choose its own size: it fills the width it is given
 * and derives its height from the fixed aspect ratio. Everything inside scales
 * from the card's own width via container query units, so it renders correctly
 * at any size without the caller passing measurements down.
 *
 * Named CardComponent rather than Card to avoid colliding with the domain model.
 */
@Component({
  selector: 'app-card',
  imports: [NgTemplateOutlet],
  templateUrl: './card.html',
  styleUrl: './card.css',
  host: {
    '[class.face-down]': 'faceDown()',
    '[class.owner-player]': 'owner() === "player"',
    '[class.owner-opponent]': 'owner() === "opponent"',
    '[class.is-selected]': 'selected()',
    '[class.is-selectable]': 'selectable()',
    '[class.is-inert]': 'interactive() && !selectable()',
    '[class.is-flipped]': 'flipped()',
    '[class.is-empty]': '!card() && !faceDown()',
    // Face-down reveals nothing, rarity included, so the attribute is withheld
    // rather than left for the frame treatment to broadcast.
    '[attr.data-rarity]': 'faceDown() ? null : (card()?.stars ?? null)',
  },
})
export class CardComponent {
  /** The card to render. Null renders an empty slot. */
  readonly card = input<Card | null>(null);

  /** Whose card this is, when it sits on the board. */
  readonly owner = input<Owner | null>(null);

  /** Render the card back instead of the face, revealing nothing. */
  readonly faceDown = input(false, { transform: booleanAttribute });

  /** Currently chosen by the player. */
  readonly selected = input(false, { transform: booleanAttribute });

  /**
   * This card belongs to a hand and participates in selection. Distinct from
   * `selectable`, which says whether it can be chosen *right now* — an
   * interactive card that is not currently selectable renders subdued, while a
   * display-only card (a board tile, a card in an opened pack) renders at full
   * strength.
   */
  readonly interactive = input(false, { transform: booleanAttribute });

  /** Actionable right now — reachable by keyboard and responsive to hover. */
  readonly selectable = input(false, { transform: booleanAttribute });

  /** Just changed ownership; plays the capture transition. */
  readonly flipped = input(false, { transform: booleanAttribute });

  readonly select = output<void>();

  readonly directions = GRID_ORDER;

  /**
   * The star track is a fixed five slots so the ceiling is legible without a
   * legend: the first N are lit for a rating of N, the rest render as empty
   * settings. A rating of 6 is not a sixth slot — see `showSixth`.
   */
  readonly starSlots = computed(() => {
    const rating = this.card()?.stars ?? 0;
    return STAR_SLOTS.map((slot) => slot <= rating);
  });

  /** A rating of exactly 6 draws one more star *outside* the five-slot track. */
  readonly showSixth = computed(() => this.card()?.stars === SIXTH_STAR);

  /** The card's number within its set, zero-padded to three: `002`. */
  readonly setNumber = computed(() => String(this.card()?.number ?? 0).padStart(3, '0'));

  /** Unique per rendered card; the `aria-describedby` target for its ability text. */
  readonly abilityId = `card-ability-${nextAbilityId++}`;

  readonly imageStyle = computed(() => {
    const c = this.card();
    return c ? `url('${c.image}')` : '';
  });

  /**
   * Stats reach assistive technology as text here because the card renders them
   * only as bars — the numerals are deliberately never drawn.
   */
  readonly description = computed(() => {
    const c = this.card();
    if (!c) return '';
    const owner = this.owner() ? `, ${this.owner()}` : '';
    return (
      `${c.name}, stars ${c.stars}, attack ${c.attack}, defense ${c.defense}${owner}, ` +
      `${c.set} ${this.setNumber()}`
    );
  });

  hasArrow(dir: Direction): boolean {
    return this.card()?.hasArrow(dir) ?? false;
  }

  onActivate(): void {
    if (this.selectable()) this.select.emit();
  }
}
