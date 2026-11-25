import { Component, input, output } from '@angular/core';

/** Counts the steppers drawn, so each one's reasons have ids of their own. */
let drawn = 0;

/**
 * Minus, the quantity, plus.
 *
 * Holds no state and knows nothing of the cart: whoever draws it says what the
 * value is and whether each end is available, and hears which was pressed. The
 * Collection tiles and the cart dialog both draw this one, so a quantity looks
 * and behaves alike in both.
 *
 * An unavailable end is `aria-disabled` rather than natively `disabled`, so the
 * press that reaches a bound keeps its focus and the reason can be read.
 */
@Component({
  selector: 'app-quantity-stepper',
  templateUrl: './quantity-stepper.html',
  styleUrl: './quantity-stepper.css',
})
export class QuantityStepper {
  readonly value = input.required<number>();
  readonly canLower = input.required<boolean>();
  readonly canRaise = input.required<boolean>();

  /** What each control does and to which card, as assistive technology hears it. */
  readonly lowerLabel = input.required<string>();
  readonly raiseLabel = input.required<string>();

  /** Why each end is unavailable; read only while it is. */
  readonly lowerReason = input('');
  readonly raiseReason = input('');

  readonly decrease = output<void>();
  readonly increase = output<void>();

  readonly id = `stepper-${++drawn}`;

  onLower(): void {
    if (this.canLower()) this.decrease.emit();
  }

  onRaise(): void {
    if (this.canRaise()) this.increase.emit();
  }
}
