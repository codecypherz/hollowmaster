import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * Asking the player to confirm something that cannot be taken back.
 *
 * An overlay rather than an inline two-step control: an inline confirm changes
 * the height of whatever it sits in, which on the Decks page would move the
 * collection under the player mid-decision. One component serves every such
 * question — deleting a deck, resetting the player's data — so the two cannot
 * drift apart in how they trap focus or how they are dismissed.
 *
 * Focus lands on the *cancel* button: the safe answer is the one a stray Enter
 * gives. Tab is held inside the dialog, Escape and the scrim both cancel, and
 * when the dialog closes focus goes back to whatever opened it.
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog implements AfterViewInit, OnDestroy {
  readonly message = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input('Cancel');

  /** How the confirming answer is coloured. Every question asked today is destructive. */
  readonly tone = input<'danger'>('danger');

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly cancelButton = viewChild.required<ElementRef<HTMLElement>>('cancelButton');

  /** Whatever held focus when the dialog opened, so it can be given back. */
  private readonly opener =
    typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

  ngAfterViewInit(): void {
    this.cancelButton().nativeElement.focus();
  }

  ngOnDestroy(): void {
    // The opener may itself have gone — a deleted deck's control — in which
    // case there is nothing to give focus back to.
    const opener = this.opener;
    if (opener && opener.isConnected && opener !== document.body) {
      queueMicrotask(() => opener.focus());
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.cancel.emit();
      return;
    }
    if (event.key !== 'Tab') return;

    const stops = [...this.panel().nativeElement.querySelectorAll<HTMLElement>('button')];
    if (stops.length === 0) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (active === first || !stops.includes(active!))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !stops.includes(active!))) {
      event.preventDefault();
      first.focus();
    }
  }
}
