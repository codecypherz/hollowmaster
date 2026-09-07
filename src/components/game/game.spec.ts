import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Game } from './game';
import { GameService } from '../../services/game.service';
import { BOARD_SIZE, HAND_SIZE } from '../../model/game';

/**
 * The in-game screen's behaviour, asserted where it is decided: what a card
 * activation does, what the opponent's hand does and does not put in the
 * document, and that the hand positions hold their places for a whole match.
 */
describe('Game', () => {
  let fixture: ComponentFixture<Game>;
  let host: HTMLElement;
  let gs: GameService;

  /** How long the opponent deliberates before placing; see `game.service.ts`. */
  const OPPONENT_THINK_MS = 900;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Game], providers: [provideRouter([])] });
    gs = TestBed.inject(GameService);
    gs.startGame();
    fixture = TestBed.createComponent(Game);
    host = fixture.nativeElement;
    fixture.detectChanges();
  });

  function slots(side: 'player' | 'opponent'): HTMLElement[] {
    return [...host.querySelectorAll<HTMLElement>(`.rack-${side} .slot`)];
  }

  function handCard(index: number): HTMLButtonElement {
    return slots('player')[index].querySelector<HTMLButtonElement>('app-card .frame')!;
  }

  function cells(): HTMLButtonElement[] {
    return [...host.querySelectorAll<HTMLButtonElement>('.board-cell')];
  }

  function cell(row: number, col: number): HTMLButtonElement {
    return host.querySelector<HTMLButtonElement>(`.board-cell[data-cell="${row}-${col}"]`)!;
  }

  function inspected(): HTMLElement | null {
    return host.querySelector<HTMLElement>('app-card-inspector .reading app-card');
  }

  /**
   * Plays one of the player's cards into the first free cell and lets the
   * opponent answer. The opponent plays where it likes, so the target is found
   * rather than named; the coordinate it landed in comes back.
   */
  function playATurn(hand: number): { row: number; col: number } {
    const board = gs.state()!.board;
    const target = board.flatMap((row, ri) =>
      row.map((c, ci) => (c ? null : { row: ri, col: ci })),
    ).find((c) => c !== null)!;

    handCard(hand).click();
    fixture.detectChanges();
    cell(target.row, target.col).click();
    fixture.detectChanges();
    vi.advanceTimersByTime(OPPONENT_THINK_MS);
    fixture.detectChanges();
    return target;
  }

  it('lays out four columns, both hands, and the whole board', () => {
    expect(host.querySelector('app-scoreboard')).not.toBeNull();
    expect(host.querySelector('app-card-inspector')).not.toBeNull();
    expect(slots('player').length).toBe(HAND_SIZE);
    expect(slots('opponent').length).toBe(HAND_SIZE);
    expect(cells().length).toBe(BOARD_SIZE * BOARD_SIZE);
    expect(host.querySelector('.game-footer')).toBeNull();
  });

  it('presents both hands in the same arrangement, mirrored', () => {
    const positions = (side: 'player' | 'opponent') =>
      slots(side).map((s) => [s.style.getPropertyValue('--col'), s.style.getPropertyValue('--row')]);

    expect(positions('opponent')).toEqual(positions('player'));
    // Five positions in the outer sub-column, four in the inner one.
    const outer = positions('player').filter(([col]) => col === '0');
    expect(outer.length).toBe(5);
    expect(positions('player').length - outer.length).toBe(4);
  });

  it('selects and inspects together when a hand card is activated', () => {
    handCard(2).click();
    fixture.detectChanges();

    expect(gs.state()!.selectedCardIndex).toBe(2);
    expect(gs.state()!.inspected).toBe(gs.state()!.player.hand[2]);
    expect(inspected()).not.toBeNull();
  });

  it('inspects a board card without disturbing the selection', () => {
    vi.useFakeTimers();
    const played = playATurn(0);

    handCard(1).click();
    fixture.detectChanges();
    const selected = gs.state()!.selectedCardIndex;

    cell(played.row, played.col).click();
    fixture.detectChanges();

    expect(gs.state()!.selectedCardIndex).toBe(selected);
    expect(gs.state()!.inspected).toBe(gs.state()!.board[played.row][played.col]!.card);
    // And the selected card still carries the selection treatment.
    expect(handCard(1).getAttribute('aria-pressed')).toBe('true');
    vi.useRealTimers();
  });

  it('inspects while the opponent is thinking and after the match ends', () => {
    vi.useFakeTimers();
    handCard(0).click();
    fixture.detectChanges();
    cell(0, 0).click();
    fixture.detectChanges();
    expect(gs.state()!.phase).toBe('opponent-turn');

    cell(0, 0).click();
    fixture.detectChanges();
    expect(gs.state()!.inspected).toBe(gs.state()!.board[0][0]!.card);

    vi.advanceTimersByTime(OPPONENT_THINK_MS);
    fixture.detectChanges();
    vi.useRealTimers();

    // And once the match is over, with the result showing.
    const done = { ...gs.state()!, phase: 'game-over' as const, winner: 'draw' as const };
    (gs as unknown as { _state: { set: (s: typeof done) => void } })._state.set(done);
    fixture.detectChanges();

    const occupied = host.querySelector<HTMLButtonElement>('.board-cell.cell-occupied')!;
    occupied.click();
    fixture.detectChanges();
    expect(gs.state()!.inspected).not.toBeNull();
  });

  it('reveals nothing about the opponent hand and offers nothing to activate', () => {
    const opponent = host.querySelector<HTMLElement>('.rack-opponent')!;
    const names = gs.state()!.opponent.hand.map((c) => c!.name);

    expect(opponent.querySelectorAll('button').length).toBe(0);
    expect(opponent.querySelectorAll('.cf-name-text').length).toBe(0);
    expect(opponent.querySelectorAll('.cf-stats').length).toBe(0);
    expect(opponent.querySelectorAll('.arr-on').length).toBe(0);
    for (const name of names) expect(opponent.textContent).not.toContain(name);
  });

  it('reaches every card by keyboard', () => {
    // Both a hand card and a board card are real buttons, so the platform's own
    // Enter and Space activation applies; nothing here re-implements it.
    expect(handCard(0).tagName).toBe('BUTTON');
    expect(handCard(0).tabIndex).toBe(0);
    expect(cell(0, 0).tagName).toBe('BUTTON');
    expect(cell(0, 0).tabIndex).toBe(0);
  });

  it('keeps a played position in place and the rest where they were', () => {
    vi.useFakeTimers();
    const before = slots('player').map((s) => [
      s.style.getPropertyValue('--col'),
      s.style.getPropertyValue('--row'),
    ]);

    playATurn(0);
    playATurn(1);
    playATurn(2);
    vi.useRealTimers();

    const after = slots('player');
    expect(after.length).toBe(HAND_SIZE);
    expect(
      after.map((s) => [s.style.getPropertyValue('--col'), s.style.getPropertyValue('--row')]),
    ).toEqual(before);
    // The three played positions are empty and still occupy their slots.
    expect(after.filter((s) => s.classList.contains('slot-empty')).length).toBe(3);
  });

  it('renders empty cells as runes rather than as cards', () => {
    vi.useFakeTimers();
    playATurn(0);
    vi.useRealTimers();

    const board = host.querySelector<HTMLElement>('.board')!;
    expect(board.querySelectorAll('app-card').length).toBeLessThanOrEqual(2 * HAND_SIZE + 1);
    expect(board.querySelectorAll('.cell-empty .cell-rune').length).toBe(
      BOARD_SIZE * BOARD_SIZE - board.querySelectorAll('app-card').length,
    );
  });

  it('places a card into the cell that was activated', () => {
    handCard(0).click();
    fixture.detectChanges();
    const card = gs.state()!.player.hand[0];

    cell(2, 3).click();
    fixture.detectChanges();

    expect(gs.state()!.board[2][3]!.card).toBe(card);
    expect(gs.state()!.player.hand[0]).toBeNull();
  });

  it('gives each captured cell its place in the capture chain', () => {
    const state = gs.state()!;
    (gs as unknown as { _state: { set: (s: typeof state) => void } })._state.set({
      ...state,
      lastFlipped: [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
      ],
    });
    fixture.detectChanges();

    expect(cell(0, 0).style.getPropertyValue('--flip-index')).toBe('0');
    expect(cell(1, 1).style.getPropertyValue('--flip-index')).toBe('1');
  });
});
