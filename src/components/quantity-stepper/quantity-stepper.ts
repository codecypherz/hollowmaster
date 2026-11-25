import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

/** Counts the steppers drawn, so each one's reasons have ids of their own. */
let drawn = 0;

/**
 * Minus, the quantity as a field, plus: one segmented bar. Anything projected
 * is a further segment at its end.
 *
 * Holds nothing but the text being typed, and knows nothing of the cart or its
 * bounds: whoever draws it says what the value is and whether each end is
 * available, and hears which was pressed or what was entered. The Collection
 * tiles and the cart dialog both draw this one, so a quantity looks and behaves
 * alike in both.
 *
 * An unavailable end is `aria-disabled` rather than natively `disabled`, and a
 * field that cannot be edited is `readonly`, so the press that reaches a bound
 * keeps its focus and the reason can be read.
 */
@Component({
  selector: 'app-quantity-stepper',
  templateUrl: './quantity-stepper.html',
  styleUrl: './quantity-stepper.css',
  host: { class: 'hk-seg' },
})
export class QuantityStepper {
  private readonly injector = inject(Injector);

  readonly value = input.required<number>();
  readonly canLower = input.required<boolean>();
  readonly canRaise = input.required<boolean>();

  /** Whether the quantity can be typed. Where not, the reason is the plus control's. */
  readonly editable = input(true);

  /** What each control does and to which card, as assistive technology hears it. */
  readonly lowerLabel = input.required<string>();
  readonly raiseLabel = input.required<string>();
  readonly fieldLabel = input.required<string>();

  /** Why each end is unavailable; read only while it is. */
  readonly lowerReason = input('');
  readonly raiseReason = input('');

  readonly decrease = output<void>();
  readonly increase = output<void>();

  /** A quantity typed and committed. Any whole number: bounding it is the parent's. */
  readonly entered = output<number>();

  readonly id = `stepper-${++drawn}`;

  /** The text being typed, or null while none is. */
  private readonly draft = signal<string | null>(null);

  readonly text = computed(() => this.draft() ?? String(this.value()));

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  // A press commits first, so it carries on from what was typed even where the
  // browser does not move focus to a pressed button.

  onLower(): void {
    if (this.commitDraft() || this.canLower()) this.decrease.emit();
  }

  onRaise(): void {
    if (this.commitDraft() || this.canRaise()) this.increase.emit();
  }

  // ─── The field ────────────────────────────────────────────────────────────

  /** Keeps the digits. Written straight back: an unchanged binding would not be. */
  onInput(): void {
    const el = this.field().nativeElement;
    const digits = el.value.replace(/\D/g, '');
    if (el.value !== digits) el.value = digits;
    this.draft.set(digits);
  }

  /**
   * A press selects the quantity, so typing replaces it; once typing, it places
   * the caret. Done in place of the press's own effect, which would collapse a
   * selection it landed on, and only after every event a handler could undo it in.
   */
  onFieldPress(event: Event): void {
    if (this.draft() !== null) return;
    event.preventDefault();
    const el = this.field().nativeElement;
    el.focus();
    el.select();
  }

  onEnter(): void {
    this.commitDraft();
    this.redraw(true);
  }

  onBlur(): void {
    this.commitDraft();
  }

  /** Abandons an edit. With none to abandon it is the surrounding dialog's to answer. */
  onEscape(event: Event): void {
    if (this.draft() === null) return;
    event.stopPropagation();
    this.draft.set(null);
    this.redraw(true);
  }

  /**
   * Ends the edit, emitting what was typed where it is a number other than the
   * one held. Returns whether it emitted. With no edit it does nothing, so
   * Enter and the blur after it emit once between them.
   */
  private commitDraft(): boolean {
    const draft = this.draft();
    if (draft === null) return false;
    this.draft.set(null);
    this.redraw();
    if (draft === '' || Number(draft) === this.value()) return false;
    this.entered.emit(Number(draft));
    return true;
  }

  /**
   * Puts the field's text back in step once whatever the edit caused has
   * rendered. The binding alone would not where it ends up as it was — a
   * quantity clamped back to the one already held.
   */
  private redraw(select = false): void {
    afterNextRender(
      () => {
        const el = this.field().nativeElement;
        if (el.value !== this.text()) el.value = this.text();
        if (select && document.activeElement === el) el.select();
      },
      { injector: this.injector },
    );
  }
}
