import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Scoreboard } from './scoreboard';

/**
 * The standing panel is where the derived scores become something the player
 * can read, so what it renders — and how it gets there — is asserted here
 * rather than inferred from the service's numbers.
 */
describe('Scoreboard', () => {
  let fixture: ComponentFixture<Scoreboard>;
  let host: HTMLElement;

  /** Reduced motion off unless a test asks for it. */
  function stubMotionPreference(reduced: boolean): void {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: reduced && query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  }

  function scores(): string[] {
    return [...host.querySelectorAll('.score')].map((el) => el.textContent!.trim());
  }

  beforeEach(() => {
    stubMotionPreference(false);
    TestBed.configureTestingModule({ imports: [Scoreboard] });
    fixture = TestBed.createComponent(Scoreboard);
    host = fixture.nativeElement;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows a standing it is handed first without counting up to it', () => {
    fixture.componentRef.setInput('playerScore', 4);
    fixture.componentRef.setInput('opponentScore', 3);
    fixture.detectChanges();

    expect(scores()).toEqual(['4', '3']);
  });

  it('counts a capture through its intermediate values rather than jumping', () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('playerScore', 9);
    fixture.componentRef.setInput('opponentScore', 9);
    fixture.detectChanges();

    // A three-card capture: 9 → 12 for the player, 9 → 6 for the opponent.
    fixture.componentRef.setInput('playerScore', 12);
    fixture.componentRef.setInput('opponentScore', 6);
    fixture.detectChanges();

    expect(scores()).toEqual(['9', '9']);

    vi.advanceTimersByTime(150);
    fixture.detectChanges();
    expect(scores()).toEqual(['10', '8']);

    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(scores()).toEqual(['12', '6']);

    // And it stops there rather than running past the new value.
    vi.advanceTimersByTime(600);
    fixture.detectChanges();
    expect(scores()).toEqual(['12', '6']);
  });

  it('snaps to the new score when reduced motion is requested', () => {
    stubMotionPreference(true);
    vi.useFakeTimers();
    fixture.componentRef.setInput('playerScore', 9);
    fixture.detectChanges();

    fixture.componentRef.setInput('playerScore', 12);
    fixture.detectChanges();

    expect(scores()[0]).toBe('12');
  });

  it('marks the active side by more than colour', () => {
    fixture.componentRef.setInput('activeSide', 'player');
    fixture.detectChanges();

    const sides = [...host.querySelectorAll('.side')];
    expect(sides[0].classList).toContain('is-active');
    expect(sides[1].classList).not.toContain('is-active');
    // The pip is drawn for both sides; the active one fills it in, and the row
    // announces the turn in text as well.
    expect(sides[0].querySelector('.pip')).not.toBeNull();
    expect(sides[0].textContent).toContain('to play');
    expect(sides[1].textContent).not.toContain('to play');
  });

  it('emits a retreat rather than acting on the match itself', () => {
    const retreats: void[] = [];
    fixture.componentInstance.retreat.subscribe(() => retreats.push(undefined));
    fixture.detectChanges();

    host.querySelector<HTMLButtonElement>('.hk-btn')!.click();

    expect(retreats.length).toBe(1);
  });
});
