import { Component, computed, signal } from '@angular/core';
import { CardComponent } from '../card/card';
import { Card, CARD_DB } from '../../model/card';
import { createParticleField, particleVars } from '../../model/particle';

export interface Token {
  name: string;
  value: string;
}

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
  imports: [CardComponent],
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

  /** Cards spanning the full rarity range present in the database. */
  readonly samples = computed<Card[]>(() => {
    const byRarity = new Map<number, Card>();
    for (const c of CARD_DB) if (!byRarity.has(c.rarity)) byRarity.set(c.rarity, c);
    return [...byRarity.entries()].sort((a, b) => a[0] - b[0]).map(([, c]) => c);
  });

  readonly demo = computed(() => this.samples()[0] ?? CARD_DB[0]);
  readonly demoAlt = computed(() => this.samples()[this.samples().length - 1] ?? CARD_DB[0]);

  /** The atmosphere demo's own field, at the tile's smaller density. */
  readonly particles = createParticleField(12, 0x5167);
  readonly vars = particleVars;

  readonly buttonStates = ['resting', 'is-hover', 'is-focus', 'disabled'] as const;

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
