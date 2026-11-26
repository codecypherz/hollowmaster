import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { CardComponent } from '../card/card';
import { CardInspector } from '../card-inspector/card-inspector';
import { HandRack } from '../hand-rack/hand-rack';
import { Scoreboard } from '../scoreboard/scoreboard';
import { fitArena, type ArenaGeometry } from '../../model/arena';
import { Card } from '../../model/card';
import { CombatEvent, CombatValue } from '../../model/combat';
import {
  BOARD_SIZE,
  Board,
  Coord,
  FirstTurn,
  GameState,
  Owner,
  TurnEvent,
  other,
} from '../../model/game';
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

/** One side of a clash, as the screen shows it. */
export interface ClashSide {
  card: Card;
  owner: Owner;
  role: 'ATK' | 'DEF';
  /** `Roll 87`, or `Carried` for an attacker fighting on a value it carried in. */
  roll: string;
  /** The power, or `WIN` / `FAIL` for an outright 100 / 1. */
  power: string;
  outright: boolean;
  victor: boolean;
}

/** A combat, ready to present. */
export interface ClashView {
  seq: number;
  attacker: ClashSide;
  defender: ClashSide;
  /** The whole combat in a sentence, for assistive technology. */
  summary: string;
}

/** An event waiting to be shown, with what it needs from the state it arrived in. */
interface Queued {
  event: TurnEvent;
  /** Who placed the card this event's placement began with. */
  side: Owner;
  board: Board;
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Whether an `animationend` is the end of the named keyframes, whatever scoping prefix they carry. */
function ended(event: Event, name: string): boolean {
  return (
    event.target === event.currentTarget &&
    ((event as AnimationEvent).animationName ?? '').endsWith(name)
  );
}

const cellKey = (c: Coord) => `${c.row}-${c.col}`;

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
    if (phase === 'player-turn' || phase === 'player-choosing') return 'player';
    if (phase === 'opponent-turn') return 'opponent';
    return null;
  });

  /** The combat targets the player may choose between right now, by cell key. */
  private readonly choosable = computed<ReadonlySet<string>>(() => {
    const s = this.state();
    if (s.phase !== 'player-choosing' || !s.resolution) return new Set();
    return new Set(s.resolution.combatTargets.map(cellKey));
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

  // ─── The event player ─────────────────────────────────────────────────────
  //
  // The match state is final the moment it changes; only what the screen shows
  // of it is staged. Events are queued by `seq` and played in order: a capture
  // is revealed, and a combat raises the clash and holds the queue until the
  // clash's last animation ends. Newly arriving events flush a clash still
  // playing to its end rather than dropping it, so nothing is ever skipped and
  // nothing ever waits on the visuals.

  /** The combat being presented, if any. */
  readonly clash = signal<ClashView | null>(null);

  /** Captured cells the screen has turned so far, each with its place in its batch. */
  private readonly revealed = signal<ReadonlyMap<string, number>>(new Map());

  /** The first-turn announcement on show, if any. */
  readonly announcement = signal<FirstTurn | null>(null);

  private queue: Queued[] = [];
  private lastSeq = 0;
  private waiting = false;
  private batch = 0;
  private announced: FirstTurn | null = null;

  constructor() {
    // Whatever was recorded before this screen existed is history, not news.
    this.lastSeq = Math.max(0, ...(this.gs.state()?.events.map((e) => e.seq) ?? []));

    effect(() => {
      const s = this.gs.state();
      untracked(() => this.receive(s));
    });

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
      const placed = s?.events[0];
      if (!s || !previous || placed?.kind !== 'place') return;
      const source = vacatedSlot(previous, s);
      if (source) this.travel(source, placed.at);
    });

    inject(DestroyRef).onDestroy(() => {
      this.queue = [];
      this.waiting = false;
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
   * the card currently selected for placement — except an offered combat
   * target while the player is choosing, which is fought as well as read.
   */
  onCellActivate(row: number, col: number): void {
    const s = this.state();
    const cell = s.board[row][col];
    if (cell) {
      if (this.isChoosable(row, col)) this.gs.chooseCombat(row, col);
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
    this.gs.restartGame();
  }

  isPlaceable(row: number, col: number): boolean {
    const s = this.state();
    return s.phase === 'player-turn' && s.selectedCardIndex !== null && s.board[row][col] === null;
  }

  /** An offered combat target, while the player is choosing which to fight. */
  isChoosable(row: number, col: number): boolean {
    return this.choosable().has(cellKey({ row, col }));
  }

  /** Captured, and turned by the screen: its clash, if it had one, has played. */
  isFlipped(row: number, col: number): boolean {
    return this.revealed().has(cellKey({ row, col }));
  }

  /**
   * A captured cell's place among the captures released with it — a combat's
   * loser, then its combo, then any defenseless — so the stylesheet delays its
   * turn by that many staggers.
   */
  flipIndex(row: number, col: number): number {
    return this.revealed().get(cellKey({ row, col })) ?? 0;
  }

  /**
   * An empty cell names its place. An offered combat target names its card and
   * the choice, since the label replaces the name the card would give it.
   */
  cellLabel(row: number, col: number): string | null {
    const cell = this.state().board[row][col];
    const where = `row ${row + 1}, column ${col + 1}`;
    if (!cell) return `Empty cell, ${where}`;
    if (this.isChoosable(row, col)) return `${cell.card.name}, ${where} — choose to battle`;
    return null;
  }

  statusText(): string {
    const s = this.state();
    if (s.phase === 'player-turn') return 'Your Turn';
    if (s.phase === 'player-choosing') return 'Choose your battle';
    if (s.phase === 'opponent-turn') return 'The Pale Court Ponders...';
    return '';
  }

  resultText(): string {
    const w = this.state().winner;
    if (w === 'player') return 'Soul Restored — Victory';
    if (w === 'opponent') return 'Shade Lingers — Defeat';
    return 'The Void Holds — Draw';
  }

  /** The clash's last animation has finished: release what it decided. */
  onClashAnimationEnd(event: Event): void {
    if (!ended(event, 'clashLife')) return;
    this.waiting = false;
    this.clash.set(null);
    this.pump();
  }

  onAnnouncementEnd(event: Event): void {
    if (ended(event, 'announce')) this.announcement.set(null);
  }

  // ─── The event player, continued ──────────────────────────────────────────

  private receive(s: GameState | null): void {
    if (!s) {
      this.queue = [];
      this.waiting = false;
      this.clash.set(null);
      return;
    }

    if (s.firstTurn !== this.announced) {
      this.announced = s.firstTurn;
      // A new match: nothing of the last one is still to be shown.
      this.announcement.set(s.firstTurn);
      this.revealed.set(new Map());
      this.queue = [];
      this.waiting = false;
      this.clash.set(null);
    }

    const fresh = s.events.filter((e) => e.seq > this.lastSeq);
    if (fresh.length === 0) return;
    this.lastSeq = fresh[fresh.length - 1].seq;
    const opening = s.events[0];
    const side: Owner = opening?.kind === 'place' ? opening.side : 'player';

    if (this.waiting) {
      // Flushed to its end, not dropped: what it decided is still released.
      this.waiting = false;
      this.clash.set(null);
    }
    for (const event of fresh) this.queue.push({ event, side, board: s.board });
    this.pump();
  }

  private pump(): void {
    while (!this.waiting && this.queue.length > 0) {
      const { event, side, board } = this.queue.shift()!;
      if (event.kind === 'place') {
        this.revealed.set(new Map());
        this.batch = 0;
        this.clash.set(null);
        // Under reduced motion the announcement does not fade by itself; the
        // first card down is what retires it.
        if (prefersReducedMotion()) this.announcement.set(null);
      } else if (event.kind === 'capture') {
        const next = new Map(this.revealed());
        next.set(cellKey(event.at), this.batch++);
        this.revealed.set(next);
      } else {
        this.batch = 0;
        this.clash.set(clashView(event, side, board));
        // Under reduced motion the clash is drawn finished and held until the
        // next event replaces it, so there is nothing to wait for.
        if (!prefersReducedMotion()) this.waiting = true;
      }
    }
  }

  /**
   * Sends the landed card from the slot it was played out of to the cell it
   * landed in: the offset between the two is written to the destination and the
   * cell animates from there back to zero, then lands.
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
      cell.classList.remove('is-landing');
      cell.classList.add('is-flying');
      const onEnd = (event: AnimationEvent) => {
        if (event.target !== cell) return;
        if (event.animationName.endsWith('flyIn')) {
          cell.classList.remove('is-flying');
          cell.classList.add('is-landing');
        } else if (event.animationName.endsWith('land')) {
          cell.classList.remove('is-landing');
          cell.removeEventListener('animationend', onEnd);
        }
      };
      cell.addEventListener('animationend', onEnd);
    });
  }
}

/** How a combat value reads in a clash. */
function powerText(value: CombatValue): string {
  if (value.kind === 'outright-win') return 'WIN';
  if (value.kind === 'outright-loss') return 'FAIL';
  return String(value.value);
}

/** A combat event, made ready to present against the board it was fought on. */
export function clashView(
  event: CombatEvent & { seq: number },
  side: Owner,
  board: Board,
): ClashView {
  const attackerCard = board[event.attacker.row][event.attacker.col]!.card;
  const defenderCard = board[event.defender.row][event.defender.col]!.card;
  const attacker: ClashSide = {
    card: attackerCard,
    owner: side,
    role: 'ATK',
    roll: event.attackRoll === null ? 'Carried' : `Roll ${event.attackRoll}`,
    power: powerText(event.attack),
    outright: event.attack.kind !== 'power',
    victor: event.winner === 'attacker',
  };
  const defender: ClashSide = {
    card: defenderCard,
    owner: other(side),
    role: 'DEF',
    roll: `Roll ${event.defenseRoll}`,
    power: powerText(event.defense),
    outright: event.defense.kind !== 'power',
    victor: event.winner === 'defender',
  };
  const victor = attacker.victor ? attacker : defender;
  const summary =
    `${attackerCard.name} attacks ${defenderCard.name}. ` +
    `Attack: ${attacker.roll}, power ${attacker.power}. ` +
    `Defense: ${defender.roll}, power ${defender.power}. ` +
    `${victor.card.name} is the victor.`;
  return { seq: event.seq, attacker, defender, summary };
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
