import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardMenu } from './card-menu';

describe('CardMenu', () => {
  let fixture: ComponentFixture<CardMenu>;

  function build(available: boolean, reason = 'That deck is full.'): CardMenu {
    fixture = TestBed.createComponent(CardMenu);
    fixture.componentRef.setInput('label', 'Add to Deck 1');
    fixture.componentRef.setInput('cardName', 'Crawlid');
    fixture.componentRef.setInput('available', available);
    fixture.componentRef.setInput('reason', reason);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  const buttons = (): HTMLButtonElement[] =>
    [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CardMenu] });
  });

  it('offers the primary action and reading, each emitting once per activation', () => {
    const menu = build(true);
    const primary: number[] = [];
    const read: number[] = [];
    menu.primary.subscribe(() => primary.push(1));
    menu.read.subscribe(() => read.push(1));

    const [add, readButton] = buttons();
    expect(add.textContent).toContain('Add to Deck 1');
    expect(readButton.textContent).toContain('Read');

    add.click();
    readButton.click();

    expect(primary).toHaveLength(1);
    expect(read).toHaveLength(1);
  });

  it('renders no activatable primary control when the action is unavailable', () => {
    build(false);

    expect(buttons()).toHaveLength(1);
    expect(buttons()[0].textContent).toContain('Read');
    expect(fixture.nativeElement.querySelector('.action-primary')).toBeNull();
    expect(fixture.nativeElement.querySelector('.reason').textContent).toContain(
      'That deck is full.',
    );
  });

  it('names the card its actions act on', () => {
    build(true);
    expect(fixture.nativeElement.querySelector('.menu').getAttribute('aria-label')).toBe(
      'Actions for Crawlid',
    );
  });

  it('takes focus as it opens, on the primary action or on reading', () => {
    build(true);
    expect(document.activeElement).toBe(buttons()[0]);

    build(false);
    expect(document.activeElement).toBe(buttons()[0]);
    expect((document.activeElement as HTMLElement).textContent).toContain('Read');
  });

  it('asks to be dismissed on Escape', () => {
    const menu = build(true);
    const dismissed: number[] = [];
    menu.dismiss.subscribe(() => dismissed.push(1));

    fixture.nativeElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );

    expect(dismissed).toHaveLength(1);
  });
});
