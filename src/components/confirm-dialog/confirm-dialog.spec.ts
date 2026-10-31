import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let dialog: ConfirmDialog;
  let confirmed: number;
  let cancelled: number;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfirmDialog] });
    fixture = TestBed.createComponent(ConfirmDialog);
    fixture.componentRef.setInput('message', 'Delete Deck 2? Its cards stay in your collection.');
    fixture.componentRef.setInput('confirmLabel', 'Delete Deck 2');
    fixture.componentRef.setInput('cancelLabel', 'Keep it');
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    dialog = fixture.componentInstance;
    confirmed = 0;
    cancelled = 0;
    dialog.confirm.subscribe(() => confirmed++);
    dialog.cancel.subscribe(() => cancelled++);
  });

  afterEach(() => fixture.nativeElement.remove());

  const el = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);
  const press = (key: string, shiftKey = false) =>
    el('.confirm').dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));

  it('states its message and labels as an alert dialog', () => {
    const panel = el('.confirm');
    expect(panel.getAttribute('role')).toBe('alertdialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(el('.confirm-text').textContent).toContain('Delete Deck 2?');
    expect(el('.confirm-yes').textContent).toContain('Delete Deck 2');
    expect(el('.confirm-no').textContent).toContain('Keep it');
  });

  it('puts focus on the cancel button as it opens', () => {
    expect(document.activeElement).toBe(el('.confirm-no'));
  });

  it('emits confirm once for the confirming button and nothing else', () => {
    el('.confirm-yes').click();
    expect(confirmed).toBe(1);
    expect(cancelled).toBe(0);
  });

  it('emits cancel for the cancel button', () => {
    el('.confirm-no').click();
    expect(cancelled).toBe(1);
    expect(confirmed).toBe(0);
  });

  it('cancels on Escape', () => {
    press('Escape');
    expect(cancelled).toBe(1);
    expect(confirmed).toBe(0);
  });

  it('cancels on a scrim click', () => {
    el('.confirm-scrim').click();
    expect(cancelled).toBe(1);
  });

  it('holds Tab inside the dialog', () => {
    el('.confirm-no').focus();
    press('Tab');
    expect(document.activeElement).toBe(el('.confirm-yes'));
    press('Tab', true);
    expect(document.activeElement).toBe(el('.confirm-no'));
  });
});
