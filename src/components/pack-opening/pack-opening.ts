import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Card } from '../../model/card';
import { PACK_SIZE, PackDefinition } from '../../model/pack';
import { CardComponent } from '../card/card';
import { PackComponent } from '../pack/pack';

/**
 * How long a card holds in the hero slot before it travels down into the row,
 * in milliseconds: this much, plus this much again per star. A four-star card
 * therefore holds well over twice as long as a one-star one, which is the
 * "rarity is felt in the reveal" requirement expressed as time rather than as
 * decoration.
 *
 * The timings live here rather than in the stylesheet because the sequence is
 * driven by component state — see `revealedCount`. The stylesheet's own
 * durations come from the motion tokens.
 */
const DWELL_BASE_MS = 620;
const DWELL_PER_STAR_MS = 260;

/**
 * The stage before the first card: how long the bought pack is held sealed, and
 * how long its tear takes. They sit beside the dwell constants so the whole
 * sequence's pace is readable in one place, and they are the only two numbers
 * to tune if the wait before the first card reads as slow.
 *
 * The tear is the `--dur-slow` token in milliseconds, because the pack's own
 * tear animation runs for exactly that long: any longer here and the hero slot
 * would stand empty between the wrapper falling away and the first card rising
 * out of it, which is the "cards from nowhere" this stage exists to remove.
 */
export const SEAL_DWELL_MS = 700;
export const TEAR_MS = 500;

/** Never scale to nothing, however degenerate the measurement. */
const MIN_SCALE = 0.2;

/** A rectangle, in CSS pixels. */
export interface Extent {
  readonly width: number;
  readonly height: number;
}

/**
 * The opening.
 *
 * It knows about cards and nothing else — not Geo, not prices, not the user.
 * The purchase is settled by `UserService.purchase()` before this ever opens,
 * so it animates a result that has already happened, which is why navigating
 * away mid-reveal cannot forfeit the pack.
 *
 * The cards arrive in the order they are given. `revealOrder()` is what puts
 * them common-to-rare; this component does not re-sort them.
 */
@Component({
  selector: 'app-pack-opening',
  imports: [CardComponent, PackComponent],
  templateUrl: './pack-opening.html',
  styleUrl: './pack-opening.css',
  host: {
    '[style.--overlay-scale]': 'scale()',
    '[class.is-complete]': 'isComplete()',
  },
})
export class PackOpening implements OnInit {
  readonly cards = input.required<readonly Card[]>();

  /** The pack that was bought — the same wrapper the storefront sold. */
  readonly pack = input.required<PackDefinition>();

  /** The player is finished with the result and wants the storefront back. */
  readonly done = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The laid-out surface, measured rather than restated as constants here. */
  private readonly surface = viewChild.required<ElementRef<HTMLElement>>('surface');

  /**
   * How many cards have come to rest in the collected row. The whole sequence
   * is this one number: the card at this index is the one currently arriving
   * in the hero slot, every earlier one is in the row, and reaching the pack
   * size is the end state.
   */
  private readonly revealedCount = signal(0);

  readonly revealed = this.revealedCount.asReadonly();

  /**
   * The stage before the reveal. `sealed` is the pack whole on screen and
   * `tearing` the same pack with its seal broken, giving up its first card;
   * both are false for the rest of the sequence, which is the state `finish()`
   * leaves behind however the opening ends.
   */
  private readonly sealedState = signal(true);
  private readonly tearingState = signal(false);

  readonly sealed = this.sealedState.asReadonly();
  readonly tearing = this.tearingState.asReadonly();

  /** Whether the pack occupies the hero slot — sealed or mid-tear. */
  readonly showPack = computed(() => this.sealedState() || this.tearingState());

  /** The card currently arriving, or null once every card has been revealed. */
  readonly hero = computed(() => this.cards()[this.revealedCount()] ?? null);

  readonly isComplete = computed(() => this.revealedCount() >= this.cards().length);

  /** The uniform viewing transform; exactly 1 wherever the overlay fits. */
  readonly scale = signal(1);

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimer());

    // The surface's own content changes as the sequence runs — the control
    // swaps, the eyebrow changes — so the fit is recomputed then as well as on
    // a resize. A transform does not affect an element's layout size, so
    // measuring the thing being scaled cannot feed back into the measurement.
    effect(() => {
      this.revealedCount();
      this.showPack();
      this.refit();
    });

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => this.refit());
    observer.observe(this.host.nativeElement);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  /**
   * The sequence starts here rather than in the constructor because it reads
   * the cards, and a required input is not resolved until the component is
   * initialised.
   *
   * Reduced motion takes the same route the skip control and destruction take
   * — there is one way to end the sequence, so there is one end state to get
   * right. It is read once, at open: a preference changed mid-reveal is not
   * worth a second code path.
   */
  ngOnInit(): void {
    if (prefersReducedMotion()) this.finish();
    else this.openPack();
  }

  /** Whether the card at `index` has come to rest in the collected row. */
  isRevealed(index: number): boolean {
    return index < this.revealedCount();
  }

  /** Ends the sequence now, showing the whole result. */
  skip(): void {
    this.finish();
  }

  close(): void {
    this.done.emit();
  }

  private refit(): void {
    const host = this.host.nativeElement;
    const surface = this.surface().nativeElement;
    this.scale.set(
      fitOverlay(
        { width: host.clientWidth, height: host.clientHeight },
        { width: surface.offsetWidth, height: surface.offsetHeight },
      ),
    );
  }

  /**
   * The sealed stage: the pack is held whole, then torn, and only then does the
   * first card begin its reveal. One timer chain, the same one the reveal runs
   * on, so there is still a single thing to clear.
   */
  private openPack(): void {
    this.timer = setTimeout(() => {
      this.tearingState.set(true);
      this.sealedState.set(false);
      this.timer = setTimeout(() => {
        this.tearingState.set(false);
        this.advance();
      }, TEAR_MS);
    }, SEAL_DWELL_MS);
  }

  private advance(): void {
    const card = this.hero();
    if (!card) return;
    this.timer = setTimeout(() => {
      this.revealedCount.update((n) => n + 1);
      this.advance();
    }, dwellFor(card));
  }

  private finish(): void {
    this.clearTimer();
    this.sealedState.set(false);
    this.tearingState.set(false);
    this.revealedCount.set(this.cards().length);
  }

  private clearTimer(): void {
    if (this.timer === null) return;
    clearTimeout(this.timer);
    this.timer = null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** How long a card of this rarity holds in the hero slot, in milliseconds. */
export function dwellFor(card: Card): number {
  return DWELL_BASE_MS + card.stars * DWELL_PER_STAR_MS;
}

/**
 * The uniform factor the overlay is viewed through: 1 wherever the available
 * space can host the laid-out surface, and the tighter of the two ratios where
 * it cannot. One factor on both axes, so the layout itself never changes and a
 * card is never re-fitted below the width its renderer's guarantees hold at.
 */
export function fitOverlay(available: Extent, needed: Extent): number {
  if (available.width <= 0 || available.height <= 0) return 1;
  if (needed.width <= 0 || needed.height <= 0) return 1;
  return Math.max(
    MIN_SCALE,
    Math.min(1, available.width / needed.width, available.height / needed.height),
  );
}

/** How many cards an opening presents. The pack's size, not the overlay's. */
export const OPENING_SIZE = PACK_SIZE;

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
