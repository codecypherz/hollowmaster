import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { CardComponent } from '../card/card';
import { CardInspector } from '../card-inspector/card-inspector';
import { HandRack } from '../hand-rack/hand-rack';
import { Scoreboard } from '../scoreboard/scoreboard';
import { fitArena, type ArenaGeometry } from '../../model/arena';
import { Card } from '../../model/card';
import { BOARD_SIZE, Coord, GameState, Owner } from '../../model/game';
import { createParticleField, particleVars } from '../../model/particle';

/** Both hands as they stood at the previous state, for spotting what was played. */
interface HandSnapshot {
  player: readonly (Card | null)[];
  opponent: readonly (Card | null)[];
}

/** The hand position a placement came from. */
interface Source {
  side: Owner;
  index: number;
}

@Component({
  selector: 'app-game',
  imports: [CardComponent, CardInspector, HandRack, Scoreboard],
  templateUrl: './game.html',
  styleUrl: './game.css',
})
export class Game {
  private gs = inject(GameService);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly state = computed(() => this.gs.state()!);
  readonly scores = this.gs.scores;

  /** The board's dimensions come from the rules, not from the stylesheet. */
  readonly boardSize = BOARD_SIZE;

  /** Whose turn it is, or `null` once the match is over. */
  readonly activeSide = computed<Owner | null>(() => {
    const phase = this.state().phase;
    if (phase === 'player-turn') return 'player';
    if (phase === 'opponent-turn') return 'opponent';
    return null;
  });

  readonly particles = createParticleField(14, 0xa17);
  readonly vars = particleVars;

  /* The arena's fit, refreshed on every host resize. Seeded rather than left
     empty so the first painted frame is already laid out at a sane unit; the
     observer's initial callback replaces it with the measured one. */
  private readonly geometry = signal<ArenaGeometry>(fitArena(1920, 1080));

  /** `--cw`: a card's laid-out width, in CSS pixels. */
  readonly cardUnit = computed(() => this.geometry().unit);

  /** `--arena-scale`: the uniform viewing transform, `1` when the arena fits. */
  readonly arenaScale = computed(() => this.geometry().scale);

  /** Both hands one state ago; how the travel animation finds its origin. */
  private previousHands: HandSnapshot | null = null;

  constructor() {
    /* Placement travel. The card that lands is the real one — nothing is cloned
       into the body — so it is interactive the instant it appears, which is
       what the screen's "motion never gates interaction" rule requires. All the
       animation needs is where the card came from, and that is the hand slot
       the state has just emptied: whichever slot held a card a state ago and
       holds none now. Reading it from the state rather than from the click also
       covers the opponent's placements, which no click of ours precedes. */
    effect(() => {
      const s = this.gs.state();
      const previous = this.previousHands;
      this.previousHands = s ? { player: s.player.hand, opponent: s.opponent.hand } : null;
      if (!s || !previous || !s.lastPlaced) return;
      const source = vacatedSlot(previous, s);
      if (source) this.travel(source, s.lastPlaced);
    });

    /* Observe the host, write to `.arena`. The host is sized by the viewport
       alone — `100dvh` tall, `overflow: hidden` — so nothing the geometry puts
       on the inner element can feed back into what is being measured, and the
       observer settles after one callback per resize instead of oscillating.

       A `ResizeObserver` rather than a `window` resize listener: it also
       catches the host changing size without the window doing so, and it
       delivers the first measurement itself, so there is no separate
       measure-on-init path to keep in step with this one. */
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      this.geometry.set(fitArena(width, height));
    });
    observer.observe(this.host.nativeElement);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  /**
   * A card in the player's own hand: chosen to play *and* put up to be read.
   * The service's own turn guard decides whether the choice takes — out of turn
   * the activation still inspects, which is what makes a card readable while
   * the opponent is moving.
   */
  onHandActivate(index: number): void {
    const card = this.state().player.hand[index];
    if (!card) return;
    this.gs.selectCard(index);
    this.gs.inspect(card);
  }

  /**
   * A cell: a card to read where one sits, a place to play where none does.
   * Reading is never a move, so an occupied cell neither places nor disturbs
   * the card currently selected for placement.
   */
  onCellActivate(row: number, col: number): void {
    const s = this.state();
    const cell = s.board[row][col];
    if (cell) {
      this.gs.inspect(cell.card);
      return;
    }
    if (s.phase !== 'player-turn' || s.selectedCardIndex === null) return;
    this.gs.placeCard(row, col);
  }

  exitGame(): void {
    // Clear the state before navigating, so the in-game route's guard cannot
    // see a stale active game and send the player straight back in.
    this.gs.exitGame();
    this.router.navigate(['/battle']);
  }

  playAgain(): void {
    this.gs.startGame();
  }

  isPlaceable(row: number, col: number): boolean {
    const s = this.state();
    return s.phase === 'player-turn' && s.selectedCardIndex !== null && s.board[row][col] === null;
  }

  isFlipped(row: number, col: number): boolean {
    return this.state().lastFlipped.some((f) => f.row === row && f.col === col);
  }

  /**
   * A captured cell's place in the capture chain. `lastFlipped` is appended in
   * the order the chain fell, so the index is the cell's turn in the sequence
   * and the stylesheet delays its flip by that many staggers.
   */
  flipIndex(row: number, col: number): number {
    const at = this.state().lastFlipped.findIndex((f) => f.row === row && f.col === col);
    return at === -1 ? 0 : at;
  }

  cellLabel(row: number, col: number): string {
    return `Empty cell, row ${row + 1}, column ${col + 1}`;
  }

  statusText(): string {
    const s = this.state();
    if (s.phase === 'player-turn') return 'Your Turn';
    if (s.phase === 'opponent-turn') return 'The Pale Court Ponders...';
    return '';
  }

  resultText(): string {
    const w = this.state().winner;
    if (w === 'player') return 'Soul Restored — Victory';
    if (w === 'opponent') return 'Shade Lingers — Defeat';
    return 'The Void Holds — Draw';
  }

  /**
   * Sends the landed card from the slot it was played out of to the cell it
   * landed in: the offset between the two is written to the destination and the
   * cell animates from there back to zero.
   *
   * The measurement is taken in the frame after the state changed — the DOM is
   * updated by then but has not been painted, so the card is never seen at its
   * destination before it sets off. Rects are viewport lengths and the arena
   * may be scaled, so the offset is divided back out of the scale to give the
   * distance in the arena's own coordinates.
   */
  private travel(source: Source, target: Coord): void {
    if (typeof requestAnimationFrame !== 'function') return;
    requestAnimationFrame(() => {
      const root = this.host.nativeElement;
      const rack = root.querySelector(`.rack-${source.side}`);
      const from = rack?.querySelectorAll('.slot')[source.index] as HTMLElement | undefined;
      const cell = root.querySelector<HTMLElement>(
        `.board-cell[data-cell="${target.row}-${target.col}"]`,
      );
      if (!from || !cell) return;

      const scale = this.arenaScale();
      const a = from.getBoundingClientRect();
      const b = cell.getBoundingClientRect();
      cell.style.setProperty('--fly-x', `${(a.left - b.left) / scale}px`);
      cell.style.setProperty('--fly-y', `${(a.top - b.top) / scale}px`);
      cell.classList.add('is-flying');
      cell.addEventListener(
        'animationend',
        (event) => {
          if (event.target === cell) cell.classList.remove('is-flying');
        },
        { once: true },
      );
    });
  }
}

/**
 * The hand position emptied between two states, if any — the origin of the
 * placement that has just resolved.
 */
function vacatedSlot(previous: HandSnapshot, now: GameState): Source | null {
  const sides: [Owner, readonly (Card | null)[], readonly (Card | null)[]][] = [
    ['player', previous.player, now.player.hand],
    ['opponent', previous.opponent, now.opponent.hand],
  ];
  for (const [side, before, after] of sides) {
    const index = before.findIndex((card, i) => card !== null && after[i] === null);
    if (index !== -1) return { side, index };
  }
  return null;
}
