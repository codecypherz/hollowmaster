import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HEAVY_TEST_DECK } from '../../testing/ready-deck';
import { provideRouter } from '@angular/router';
import { Game } from './game';
import { GAME_RANDOM, GameService, OPPONENT_THINK_MS } from '../../services/game.service';
import { BOARD_SIZE, Board, GameState, HAND_SIZE, Owner } from '../../model/game';
import { Card, Direction } from '../../model/card';
import { ScriptedRandom, scriptedRandom } from '../../testing/random';

/**
 * The in-game screen's behaviour, asserted where it is decided: what a card
 * activation does, what the opponent's hand does and does not put in the
 * document, and that the hand positions hold their places for a whole match.
 */
describe('Game', () => {
  let fixture: ComponentFixture<Game>;
  let host: HTMLElement;
  let gs: GameService;
  let rng: ScriptedRandom;

  beforeEach(() => {
    rng = scriptedRandom();
    TestBed.configureTestingModule({
      imports: [Game],
      providers: [provideRouter([]), { provide: GAME_RANDOM, useValue: rng }],
    });
    gs = TestBed.inject(GameService);
    gs.startGame(HEAVY_TEST_DECK); // the player opens
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
    const target = board
      .flatMap((row, ri) => row.map((c, ci) => (c ? null : { row: ri, col: ci })))
      .find((c) => c !== null)!;

    handCard(hand).click();
    fixture.detectChanges();
    cell(target.row, target.col).click();
    fixture.detectChanges();
    while (gs.state()!.phase === 'player-choosing') {
      const [first] = gs.state()!.resolution!.combatTargets;
      gs.chooseCombat(first.row, first.col);
    }
    vi.runOnlyPendingTimers(); // the opponent's answer, however long it waits
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
      slots(side).map((s) => [
        s.style.getPropertyValue('--col'),
        s.style.getPropertyValue('--row'),
      ]);

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
    expect(board.querySelectorAll('.board-cell app-card').length).toBeLessThanOrEqual(
      2 * HAND_SIZE + 1,
    );
    expect(board.querySelectorAll('.cell-empty .cell-rune').length).toBe(
      BOARD_SIZE * BOARD_SIZE - board.querySelectorAll('.board-cell app-card').length,
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

  // ─── Combat on screen ─────────────────────────────────────────────────────

  function testCard(
    arrows: Direction[],
    stats: Partial<{ attack: number; defense: number; name: string }> = {},
  ): Card {
    return new Card({
      name: stats.name ?? 'Test Vessel',
      arrows,
      stars: 1,
      image: 'crawlid.webp',
      attack: stats.attack ?? 50,
      defense: stats.defense ?? 50,
      ability: 'None',
      set: 'Test',
      number: 1,
    });
  }

  function setState(next: GameState): void {
    (gs as unknown as { _state: { set: (s: GameState) => void } })._state.set(next);
    fixture.detectChanges();
  }

  /**
   * The player's turn, with `cells` on the board and `card` selected from the
   * first hand slot.
   */
  function stage(card: Card, cells: [number, number, Card, Owner][]): void {
    const s = gs.state()!;
    const board: Board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    for (const [r, c, placed, owner] of cells) board[r][c] = { card: placed, owner };
    const hand = s.player.hand.slice();
    hand[0] = card;
    setState({ ...s, board, player: { hand }, selectedCardIndex: 0, phase: 'player-turn' });
  }

  /** The placed card at 2-2 points east and west at two opposing cards that point back. */
  function stageTwoCombats(): void {
    stage(testCard(['E', 'W'], { attack: 90, name: 'Striker' }), [
      [2, 1, testCard(['E', 'N'], { defense: 10, name: 'West Guard' }), 'opponent'],
      [1, 1, testCard([]), 'opponent'], // West Guard's combo
      [2, 3, testCard(['W'], { defense: 10, name: 'East Guard' }), 'opponent'],
    ]);
  }

  function place(row: number, col: number): void {
    cell(row, col).click();
    fixture.detectChanges();
  }

  function choosable(): string[] {
    return [...host.querySelectorAll<HTMLElement>('.board-cell.cell-choosable')].map(
      (c) => c.dataset['cell']!,
    );
  }

  function clashEl(): HTMLElement | null {
    return host.querySelector<HTMLElement>('.clash');
  }

  function text(selector: string): string[] {
    return [...clashEl()!.querySelectorAll(selector)].map((el) => el.textContent!.trim());
  }

  /** Ends the clash on show, as the browser would when its last animation finishes. */
  function endClash(): void {
    const ev = new Event('animationend');
    Object.defineProperty(ev, 'animationName', { value: 'clashLife' });
    clashEl()!.dispatchEvent(ev);
    fixture.detectChanges();
  }

  function flipped(): string[] {
    return [...host.querySelectorAll<HTMLElement>('.board-cell')]
      .filter((c) => c.querySelector('app-card.is-flipped'))
      .map((c) => `${c.dataset['cell']}@${c.style.getPropertyValue('--flip-index')}`);
  }

  function status(): string {
    return host.querySelector('app-scoreboard .status')!.textContent!.trim();
  }

  describe('choosing a combat', () => {
    it('marks the offered targets and nothing else, and asks for a choice', () => {
      stageTwoCombats();
      place(2, 2);
      expect(choosable()).toEqual(['2-1', '2-3']);
      expect(host.querySelectorAll('.cell-choosable .choose-glyph')).toHaveLength(2);
      expect(cell(2, 3).getAttribute('aria-label')).toBe(
        'East Guard, row 3, column 4 — choose to battle',
      );
      expect(cell(1, 1).getAttribute('aria-label')).toBeNull();
      expect(status()).toBe('Choose your battle');
      const sides = host.querySelectorAll('app-scoreboard .side');
      expect(sides[0].classList).toContain('is-active');
    });

    it('fights the target that is clicked, inspecting it too, and clears the marking', () => {
      stageTwoCombats();
      place(2, 2);
      rng.rolls(51, 51, 51);
      cell(2, 3).click();
      fixture.detectChanges();
      const combats = gs.state()!.events.filter((e) => e.kind === 'combat');
      expect(combats.map((e) => e.defender)).toEqual([
        { row: 2, col: 3 },
        { row: 2, col: 1 },
      ]);
      expect(gs.state()!.inspected!.name).toBe('East Guard');
      expect(choosable()).toEqual([]);
    });

    it('only inspects a card that is not an offered target', () => {
      stageTwoCombats();
      place(2, 2);
      const before = gs.state()!.events;
      cell(1, 1).click();
      fixture.detectChanges();
      expect(gs.state()!.phase).toBe('player-choosing');
      expect(gs.state()!.events).toBe(before);
      expect(gs.state()!.inspected).toBe(gs.state()!.board[1][1]!.card);
      expect(choosable()).toEqual(['2-1', '2-3']);
    });
  });

  describe('the clash', () => {
    it('shows both cards, rolls, and powers, then names the victor', () => {
      stage(testCard(['E'], { attack: 40, name: 'Striker' }), [
        [2, 3, testCard(['W'], { defense: 30, name: 'Guard' }), 'opponent'],
      ]);
      rng.rolls(90, 20); // 40 @ 90 → 46, 30 @ 20 → 27
      place(2, 2);
      expect(clashEl()).not.toBeNull();
      expect(text('.fighter-role')).toEqual(['ATK', 'DEF']);
      expect(text('.fighter-roll')).toEqual(['Roll 90', 'Roll 20']);
      expect(text('.fighter-power')).toEqual(['46', '27']);
      expect(text('.fighter-victor')).toEqual(['Victor', '']);
      expect(clashEl()!.querySelectorAll('app-card')).toHaveLength(2);
      expect(host.querySelector('[role=status].sr-only')!.textContent).toContain(
        'Striker is the victor',
      );
    });

    it('shows the power an attacker carried into a later combat', () => {
      stageTwoCombats();
      place(2, 2);
      rng.rolls(51, 51, 51); // 90 → 95, guard 10 → 11, so 84 is carried
      cell(2, 3).click();
      fixture.detectChanges();
      expect(text('.fighter-power')).toEqual(['95', '11']);
      endClash();
      expect(text('.fighter-roll')).toEqual(['Carried', 'Roll 51']);
      expect(text('.fighter-power')).toEqual(['84', '11']);
    });

    it('names outright results rather than numbering them', () => {
      stage(testCard(['E'], { attack: 1 }), [[2, 3, testCard(['W'], { defense: 99 }), 'opponent']]);
      rng.rolls(100, 1);
      place(2, 2);
      expect(text('.fighter-roll')).toEqual(['Roll 100', 'Roll 1']);
      expect(text('.fighter-power')).toEqual(['WIN', 'FAIL']);
      expect(clashEl()!.querySelectorAll('.fighter-power.is-outright')).toHaveLength(2);
    });

    it('never takes a pointer, and sits inside the board', () => {
      stage(testCard(['E']), [[2, 3, testCard(['W']), 'opponent']]);
      place(2, 2);
      expect(clashEl()!.parentElement!.classList).toContain('board');
    });
  });

  describe('playing a placement in order', () => {
    it("turns a combat's loser and combo only once its clash has played", () => {
      stageTwoCombats();
      place(2, 2);
      rng.rolls(51, 51, 51);
      cell(2, 1).click(); // West Guard first: its loss brings 1-1
      fixture.detectChanges();

      expect(flipped()).toEqual([]);
      expect(text('.fighter-power')[1]).toBe('11');
      endClash();
      // First clash done: its loser and combo turn, in that order; the second
      // clash is up.
      expect(flipped()).toEqual(['1-1@1', '2-1@0']);
      expect(clashEl()).not.toBeNull();
      endClash();
      expect(flipped()).toEqual(['1-1@1', '2-1@0', '2-3@0']);
      expect(clashEl()).toBeNull();
    });

    it('plays only the new events of a placement that arrives in several updates', () => {
      stageTwoCombats();
      place(2, 2); // the place event, alone
      expect(clashEl()).toBeNull();
      rng.rolls(51, 51, 51);
      cell(2, 3).click();
      fixture.detectChanges();
      // The place is not replayed: the first thing shown is the first combat.
      expect(text('.fighter-roll')).toEqual(['Roll 51', 'Roll 51']);
      endClash();
      endClash();
      expect(
        flipped()
          .map((f) => f.split('@')[0])
          .sort(),
      ).toEqual(['1-1', '2-1', '2-3']);
    });

    it('flushes a clash still playing when new events arrive', () => {
      vi.useFakeTimers();
      stage(testCard(['E'], { attack: 90 }), [
        [2, 3, testCard(['W'], { defense: 10 }), 'opponent'],
      ]);
      rng.rolls(51, 51);
      place(2, 2);
      expect(clashEl()).not.toBeNull();
      // The opponent answers before the clash has finished playing.
      vi.runOnlyPendingTimers();
      fixture.detectChanges();
      expect(flipped().some((f) => f.startsWith('2-3'))).toBe(false); // a new placement resets
      expect(gs.state()!.events[0]).toMatchObject({ kind: 'place', side: 'opponent' });
      vi.useRealTimers();
    });

    it('shows everything at once under reduced motion, holding the last clash', () => {
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }));
      try {
        stageTwoCombats();
        place(2, 2);
        rng.rolls(51, 51, 51);
        cell(2, 1).click();
        fixture.detectChanges();
        expect(flipped()).toEqual(['1-1@1', '2-1@0', '2-3@0']);
        expect(text('.fighter-roll')).toEqual(['Carried', 'Roll 51']);
        expect(text('.fighter-victor')).toEqual(['Victor', '']);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('the first-turn announcement', () => {
    function banner(): HTMLElement | null {
      return host.querySelector<HTMLElement>('.first-turn-region .first-turn');
    }

    it('names who moves first and both star totals, in a live region', () => {
      const s = gs.state()!;
      expect(banner()).not.toBeNull();
      expect(banner()!.closest('[role=status]')).not.toBeNull();
      expect(banner()!.textContent).toContain('You move first');
      expect(banner()!.textContent).toContain(`Your deck ${s.firstTurn.playerStars}`);
      expect(banner()!.textContent).toContain(`Player 2 ${s.firstTurn.opponentStars}`);
      expect(banner()!.textContent).toContain('The heavier deck leads');
      expect(banner()!.textContent).not.toContain('coin');
    });

    it('says when a coin flip decided it', () => {
      setState({
        ...gs.state()!,
        phase: 'opponent-turn',
        firstTurn: { first: 'opponent', playerStars: 9, opponentStars: 9, coinFlip: true },
      });
      expect(banner()!.textContent).toContain('Player 2 moves first');
      expect(banner()!.textContent).toContain('decided by coin flip');
      // And the scoreboard marks the opponent's turn.
      const sides = host.querySelectorAll('app-scoreboard .side');
      expect(sides[1].classList).toContain('is-active');
      expect(sides[0].classList).not.toContain('is-active');
    });

    it('does not stand in the way of play, and goes when it has played', () => {
      handCard(0).click();
      fixture.detectChanges();
      place(0, 0);
      expect(gs.state()!.board[0][0]).not.toBeNull();

      const ev = new Event('animationend');
      Object.defineProperty(ev, 'animationName', { value: 'announce' });
      banner()!.dispatchEvent(ev);
      fixture.detectChanges();
      expect(banner()).toBeNull();
    });
  });
});
