import { Component, computed, signal } from '@angular/core';
import { CardComponent } from '../card/card';
import { Geo } from '../geo/geo';
import { PackComponent } from '../pack/pack';
import { Card, CardOptions, CARD_DB } from '../../model/card';
import { PACKS } from '../../model/pack';
import { createParticleField, particleVars } from '../../model/particle';

export interface Token {
  name: string;
  value: string;
}

/** A card standing in for one star rating on the guide, real or synthesised. */
export interface RatingSample {
  stars: number;
  card: Card;
  synthetic: boolean;
}

/**
 * The card's declared minimum supported width, and the width its ability
 * section appears at. The ladder is built from them so the guide can never
 * drift from the contract it is demonstrating.
 */
const CARD_MIN_WIDTH = 120;
const ABILITY_GATE = 200;

/**
 * The pack's declared minimum supported width, and the width the guide shows a
 * pack at otherwise. The minimum is read from the same contract the renderer
 * states, so the narrowest example on the page cannot drift below it.
 */
const PACK_MIN_WIDTH = 120;
const PACK_DEMO_WIDTH = 190;

/** Prefixes the guide groups tokens by. Anything else lands in "other". */
const GROUPS = [
  { key: 'color', prefix: '--color-', title: 'Colour' },
  { key: 'font', prefix: '--font-', title: 'Typography' },
  { key: 'spacing', prefix: '--spacing-', title: 'Spacing' },
  { key: 'dur', prefix: '--dur-', title: 'Motion' },
  { key: 'ease', prefix: '--ease-', title: 'Easing' },
  { key: 'elev', prefix: '--elev-', title: 'Elevation' },
] as const;

/**
 * The living style guide.
 *
 * Token sections are built by reading the custom properties actually registered
 * on :root at runtime — never from a hand-kept list. A token added to the theme
 * shows up here on its own, and a value shown here is by construction the value
 * the rest of the app uses.
 */
@Component({
  selector: 'app-style-guide',
  imports: [CardComponent, Geo, PackComponent],
  templateUrl: './style-guide.html',
  styleUrl: './style-guide.css',
})
export class StyleGuide {
  private readonly tokens = signal<Token[]>(readRootTokens());

  readonly groups = computed(() => {
    const all = this.tokens();
    return GROUPS.map((g) => ({
      ...g,
      tokens: all.filter((t) => t.name.startsWith(g.prefix)),
    })).filter((g) => g.tokens.length > 0);
  });

  readonly tokenCount = computed(() => this.tokens().length);

  /**
   * One card per rating 1-6, so the star track is reviewable across the model's
   * whole range and the frame can be seen not varying with it. Ratings the
   * database has no card for are synthesised from a real one rather than
   * skipped — a missing tier would go unreviewed.
   */
  readonly ratings = computed<RatingSample[]>(() => {
    const byStars = new Map<number, Card>();
    for (const c of CARD_DB) if (!byStars.has(c.stars)) byStars.set(c.stars, c);
    const donor = CARD_DB[0];

    return [1, 2, 3, 4, 5, 6].map((stars) => {
      const real = byStars.get(stars);
      if (real) return { stars, card: real, synthetic: false };
      return {
        stars,
        synthetic: true,
        card: new Card({
          name: `Sample ${stars}★`,
          arrows: ['N', 'NE', 'E', 'S', 'W'],
          stars,
          image: donor.image.replace('/images/', ''),
          attack: 40 + stars * 8,
          defense: 30 + stars * 9,
          ability: 'Placeholder card, synthesised so this rating can be reviewed.',
          set: donor.set,
          number: 900 + stars,
        }),
      };
    });
  });

  /**
   * The stat bars at the bottom, middle, and top of the range, so the label and
   * the fill can both be judged where each is hardest to read: a fill narrower
   * than the label, and a fill running the whole track under it.
   */
  readonly statSamples = computed(() =>
    [
      { label: 'Low · 3 / 6', attack: 3, defense: 6 },
      { label: 'Middling · 45 / 40', attack: 45, defense: 40 },
      { label: 'High · 100 / 92', attack: 100, defense: 92 },
    ].map(({ label, attack, defense }) => ({
      label,
      card: this.variant({ name: 'Husk Sentry', attack, defense, number: 910 + attack }),
    })),
  );

  /**
   * A short name and one long enough to be stepped down and wrapped, so the
   * fitting can be judged without a card database that has such a name.
   */
  readonly nameSamples = computed(() =>
    [
      { label: 'Short name', name: 'Goam' },
      { label: 'Longest in the database', name: 'Aspid Hatchling' },
      { label: 'Deliberately long name', name: 'The Hollow Knight Of Hallownest' },
    ].map(({ label, name }, i) => ({ label, card: this.variant({ name, number: 920 + i }) })),
  );

  /** A card built from a real one, so a demonstration is never a blank slate. */
  private variant(overrides: Partial<CardOptions>): Card {
    const donor = this.demo();
    return new Card({
      name: donor.name,
      arrows: [...donor.arrows],
      stars: donor.stars,
      image: donor.image.replace('/images/', ''),
      attack: donor.attack,
      defense: donor.defense,
      ability: donor.ability,
      set: donor.set,
      number: donor.number,
      ...overrides,
    });
  }

  /** Cards spanning the full star range present in the database. */
  readonly samples = computed<Card[]>(() => {
    const byStars = new Map<number, Card>();
    for (const c of CARD_DB) if (!byStars.has(c.stars)) byStars.set(c.stars, c);
    return [...byStars.entries()].sort((a, b) => a[0] - b[0]).map(([, c]) => c);
  });

  readonly demo = computed(() => this.samples()[0] ?? CARD_DB[0]);
  readonly demoAlt = computed(() => this.samples()[this.samples().length - 1] ?? CARD_DB[0]);

  /** The atmosphere demo's own field, at the tile's smaller density. */
  readonly particles = createParticleField(12, 0x5167);
  readonly vars = particleVars;

  readonly buttonStates = ['resting', 'is-hover', 'is-focus', 'disabled'] as const;

  /**
   * Every tier the catalogue offers, so each wrapper's printed name is on the
   * page, plus the two widths the pack's contract is stated at.
   */
  readonly packs = PACKS;
  readonly packMinWidth = PACK_MIN_WIDTH;
  readonly packDemoWidth = PACK_DEMO_WIDTH;

  /** Floored at the minimum and straddling the ability gate, one pixel apart. */
  readonly sizeLadder = [CARD_MIN_WIDTH, 160, ABILITY_GATE - 1, ABILITY_GATE, 260] as const;
  readonly minWidth = CARD_MIN_WIDTH;
  readonly abilityGate = ABILITY_GATE;

  readonly cardStates = computed(() => [
    { label: 'Player-owned', props: { owner: 'player' as const } },
    { label: 'Opponent-owned', props: { owner: 'opponent' as const } },
    { label: 'Selected', props: { interactive: true, selectable: true, selected: true } },
    { label: 'Selectable', props: { interactive: true, selectable: true } },
    { label: 'Unselectable', props: { interactive: true, selectable: false } },
    { label: 'Captured', props: { owner: 'opponent' as const, flipped: true } },
  ]);

  /** Colour tokens that are not opaque enough to judge on their own ground.
      `transparent` catches the scrim, which is a color-mix rather than an rgba. */
  isTranslucent(value: string): boolean {
    return value.includes('rgba') || value.includes('/') || value.includes('transparent');
  }
}

/**
 * Collect the custom properties on :root.
 *
 * `getComputedStyle` enumerates custom properties in current browsers; the
 * stylesheet walk is a fallback for engines that do not, so the guide degrades
 * to the same list rather than to an empty page.
 */
function readRootTokens(): Token[] {
  if (typeof document === 'undefined') return [];
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const found = new Map<string, string>();

  for (let i = 0; i < cs.length; i++) {
    const name = cs.item(i);
    if (name.startsWith('--')) found.set(name, cs.getPropertyValue(name).trim());
  }

  if (found.size === 0) {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // cross-origin sheet
      }
      for (const rule of Array.from(rules)) {
        if (!(rule instanceof CSSStyleRule) || !rule.selectorText.includes(':root')) continue;
        const style = rule.style;
        for (let i = 0; i < style.length; i++) {
          const name = style.item(i);
          if (name.startsWith('--')) {
            found.set(
              name,
              cs.getPropertyValue(name).trim() || style.getPropertyValue(name).trim(),
            );
          }
        }
      }
    }
  }

  return [...found.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
