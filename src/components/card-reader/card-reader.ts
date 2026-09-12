import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { Card } from '../../model/card';
import { CardComponent } from '../card/card';

/**
 * Reading a card: the one place on the Cards page where a card is rendered
 * above the renderer's 200px ability gate, so the ability text, the set, and
 * the number a collection tile withholds are legible.
 *
 * The larger face is not a second way of drawing a card — it is the same
 * renderer given more width. Nothing here knows what the card says.
 *
 * The deck action is *given* rather than derived: the caller already decided
 * whether this card is being read from the collection (add) or from the deck
 * (remove), and under what conditions the action is withheld. Re-deriving it
 * here is how the overlay and the menu come to disagree.
 */
@Component({
  selector: 'app-card-reader',
  imports: [CardComponent],
  templateUrl: './card-reader.html',
  styleUrl: './card-reader.css',
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    '[attr.aria-label]': '"Reading " + card().name',
    '(keydown)': 'onKeydown($event)',
  },
})
export class CardReader implements AfterViewInit {
  readonly card = input.required<Card>();

  /** What the deck action is called here — the same words the menu used. */
  readonly actionLabel = input('');

  /** Whether that action is on offer at all. */
  readonly actionAvailable = input(false);

  /** Why it is not, stated in the same words the menu states it in. */
  readonly actionReason = input('');

  readonly action = output<void>();
  readonly close = output<void>();

  private readonly firstControl = viewChild<ElementRef<HTMLElement>>('firstControl');
  private readonly closeControl = viewChild.required<ElementRef<HTMLElement>>('closeControl');
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('panel');

  ngAfterViewInit(): void {
    // Focus lands inside the overlay as it opens — on the deck action where
    // there is one, and on the dismissal otherwise, so there is never a moment
    // where the keyboard is in the page behind a modal.
    (this.firstControl() ?? this.closeControl()).nativeElement.focus();
  }

  /**
   * Escape closes, and Tab is held inside the panel.
   *
   * A modal that does not confine focus lets the keyboard wander into the page
   * behind it — where the cards are still rendered and still activatable — so
   * the cycle is closed here rather than trusted to `aria-modal` alone, which
   * only tells assistive technology what is going on and moves no focus.
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.close.emit();
      return;
    }
    if (event.key !== 'Tab') return;

    const stops = this.focusable();
    if (stops.length === 0) return;

    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !stops.includes(active as HTMLElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusable(): HTMLElement[] {
    return [...this.host().nativeElement.querySelectorAll<HTMLElement>('button, [href]')];
  }
}
