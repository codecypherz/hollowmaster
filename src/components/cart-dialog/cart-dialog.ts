import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  actionLabel,
  cardSlug,
  changeText,
  lowerLabel,
  quantityLabel,
  raiseLabel,
  raiseRefusal,
} from '../../model/cart';
import { listOf } from '../../model/deck';
import { rosariesText } from '../../model/exchange';
import { CartRow, CartService } from '../../services/cart.service';
import { UserService } from '../../services/user.service';
import { trapTab } from '../focus-trap';
import { QuantityStepper } from '../quantity-stepper/quantity-stepper';
import { Rosary } from '../rosary/rosary';

/** Why a cart cannot be confirmed, as the control states it. */
export const NOT_ENOUGH_ROSARIES = 'Not enough Rosaries';
export const CART_EMPTY = 'The cart is empty';

/** The least a row's quantity goes to here: a row leaves only by its remove control. */
const LEAST = 1;

/**
 * The cart, opened: every pending line as a row of text, what they come to, and
 * the one control that makes them happen.
 *
 * It reads and adjusts `CartService` itself, but does not settle: confirming is
 * emitted, so the page that opened it can announce the outcome once the dialog
 * is gone. Focus, the Tab trap, and dismissal follow `ConfirmDialog`.
 *
 * It has a live region of its own because `aria-modal` can hide the page's from
 * assistive technology while it is up.
 */
@Component({
  selector: 'app-cart-dialog',
  imports: [NgTemplateOutlet, QuantityStepper, Rosary],
  templateUrl: './cart-dialog.html',
  styleUrl: './cart-dialog.css',
})
export class CartDialog implements AfterViewInit, OnDestroy {
  private readonly cart = inject(CartService);
  private readonly users = inject(UserService);
  private readonly injector = inject(Injector);

  readonly confirm = output<void>();
  readonly close = output<void>();

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly closeControl = viewChild.required<ElementRef<HTMLElement>>('closeControl');

  /** Whatever held focus when the dialog opened, so it can be given back. */
  private readonly opener =
    typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

  readonly rows = this.cart.rows;
  readonly balance = this.users.rosaries;
  readonly net = this.cart.net;
  readonly balanceAfter = this.cart.balanceAfter;
  readonly shortfall = this.cart.shortfall;
  readonly canConfirm = this.cart.canConfirm;

  /** Why confirming is withheld; empty while it is on offer. */
  readonly refusal = computed(() => {
    if (this.cart.isEmpty()) return CART_EMPTY;
    return this.canConfirm() ? '' : NOT_ENOUGH_ROSARIES;
  });

  readonly confirmLabel = computed(() => {
    const net = this.net();
    if (net === 0) return 'Confirm, no Rosaries gained or spent';
    return `Confirm, ${net > 0 ? 'gain' : 'spend'} ${rosariesText(Math.abs(net))}`;
  });

  readonly announcement = signal('');

  readonly least = LEAST;
  readonly atLeastReason = 'Remove it to sell or buy none';
  readonly actionLabel = actionLabel;
  readonly slug = cardSlug;
  readonly lowerLabel = lowerLabel;
  readonly quantityLabel = quantityLabel;
  readonly raiseLabel = raiseLabel;
  readonly raiseRefusal = raiseRefusal;
  readonly abs = Math.abs;

  ngAfterViewInit(): void {
    this.closeControl().nativeElement.focus();
  }

  ngOnDestroy(): void {
    const opener = this.opener;
    if (opener && opener.isConnected && opener !== document.body) {
      queueMicrotask(() => opener.focus());
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.close.emit();
      return;
    }
    trapTab(event, this.panel().nativeElement);
  }

  onStep(row: CartRow, by: 1 | -1): void {
    // From the cart rather than the row: a quantity typed a moment ago may not
    // have been rendered yet.
    this.setQuantity(row, this.cart.quantityFor(row.card, row.action) + by);
  }

  onEntered(row: CartRow, quantity: number): void {
    this.setQuantity(row, quantity);
  }

  private setQuantity(row: CartRow, quantity: number): void {
    const before = this.cart.quantityFor(row.card, row.action);
    const change = this.cart.setQuantity(row.card, row.action, Math.max(LEAST, quantity));
    if (change.quantity !== before) this.announcement.set(changeText(change));
  }

  /** Takes the row out; focus goes to the next row's remove control, else the previous's. */
  onRemove(index: number): void {
    const rows = this.rows();
    const { card, action } = rows[index];
    const heir = rows[index + 1] ?? rows[index - 1];
    this.cart.remove(card);
    this.announcement.set(changeText({ card, action, quantity: 0, cleared: false }));

    afterNextRender(
      () => {
        const panel = this.panel().nativeElement;
        const control = heir
          ? panel.querySelector<HTMLElement>(`[data-remove="${cardSlug(heir.card)}"]`)
          : null;
        (control ?? this.closeControl().nativeElement).focus();
      },
      { injector: this.injector },
    );
  }

  /** Unavailable is focusable but inert. */
  onConfirm(): void {
    if (this.canConfirm()) this.confirm.emit();
  }

  /** The row's warning, naming every deck the sale would trim. */
  trimText(row: CartRow): string {
    return `Removes it from ${listOf(row.trims)}`;
  }

  /** A signed amount in words. */
  effectText(amount: number): string {
    if (amount === 0) return 'no change';
    return `${amount > 0 ? 'gains' : 'spends'} ${rosariesText(Math.abs(amount))}`;
  }
}
