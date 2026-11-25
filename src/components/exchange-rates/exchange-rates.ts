import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { rosaryRates } from '../../model/exchange';
import { UserService } from '../../services/user.service';
import { Rosary } from '../rosary/rosary';

/**
 * The Rosary purse: the balance on a button, and beneath it the exchange rates
 * the button opens.
 *
 * A disclosure rather than a menu or a dialog: the panel is only read, so it
 * offers no choices and holds no focus. It is absolutely positioned under the
 * button, so opening it moves nothing. Which rates are listed is `rosaryRates`'
 * to say; nothing here knows there is one to leave out.
 */
@Component({
  selector: 'app-exchange-rates',
  imports: [Rosary],
  templateUrl: './exchange-rates.html',
  styleUrl: './exchange-rates.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class ExchangeRates {
  private readonly users = inject(UserService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly purse = viewChild.required<ElementRef<HTMLElement>>('purse');

  readonly rosaries = this.users.rosaries;
  readonly rates = computed(() => rosaryRates(this.users.state()));

  readonly open = signal(false);

  toggle(): void {
    this.open.update((open) => !open);
  }

  onEscape(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.purse().nativeElement.focus();
  }

  onDocumentClick(event: Event): void {
    if (!this.contains(event.target)) this.open.set(false);
  }

  /** Only focus landing elsewhere closes it: a press on the panel moves focus to nothing. */
  onFocusOut({ relatedTarget }: FocusEvent): void {
    if (relatedTarget && !this.contains(relatedTarget)) this.open.set(false);
  }

  starsText(stars: number): string {
    return `${stars} ${stars === 1 ? 'star' : 'stars'}`;
  }

  starGlyphs(stars: number): string {
    return '★'.repeat(stars);
  }

  private contains(target: EventTarget | null): boolean {
    return target instanceof Node && this.host.nativeElement.contains(target);
  }
}
