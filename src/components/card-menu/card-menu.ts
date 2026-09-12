import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * The two-action menu raised over a selected card.
 *
 * The two call sites — a collection tile and a deck position — differ only in
 * what the first action is called and when it is available, so they share this
 * one component rather than each growing their own pair of buttons: that is
 * what keeps the deck's *Remove* and the collection's *Add* from drifting
 * apart in look, in keyboard behaviour, or in how a withheld action states why.
 *
 * It is not a general popover primitive, and is not meant to become one. It is
 * two buttons over a card, positioned by the tile that hosts it.
 *
 * When the primary action is unavailable the menu renders the reason as text
 * rather than a disabled control: a control that cannot be activated is still
 * a focus stop that does nothing, and the spec asks for the action not to be
 * offered rather than to be offered and refused.
 */
@Component({
  selector: 'app-card-menu',
  imports: [],
  templateUrl: './card-menu.html',
  styleUrl: './card-menu.css',
  host: {
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class CardMenu implements AfterViewInit {
  /** What the first action is called — `Add to Deck 1`, `Remove`. */
  readonly label = input.required<string>();

  /** Whether that action can be taken at all. */
  readonly available = input(true);

  /** Why it cannot, stated to the player when it is unavailable. */
  readonly reason = input('');

  /** The card the menu is over, so its controls name what they act on. */
  readonly cardName = input.required<string>();

  readonly primary = output<void>();
  readonly read = output<void>();
  readonly dismiss = output<void>();

  private readonly primaryControl = viewChild<ElementRef<HTMLButtonElement>>('primaryControl');
  private readonly readControl = viewChild<ElementRef<HTMLButtonElement>>('readControl');

  /**
   * Focus moves into the menu as it opens, so the actions are the next thing
   * the keyboard reaches rather than something to be tabbed toward. The card
   * takes focus back when the menu closes — the page that opened it does that,
   * since it is the one holding a reference to the card.
   */
  ngAfterViewInit(): void {
    const first = this.primaryControl() ?? this.readControl();
    first?.nativeElement.focus();
  }

  onEscape(event: Event): void {
    event.stopPropagation();
    this.dismiss.emit();
  }
}
