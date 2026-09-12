import { TestBed } from '@angular/core/testing';
import { Shop } from './shop';
import { UserService } from '../../services/user.service';
import { USER_STORE, UserStore } from '../../services/user-store';
import { PACKS, PACK_SIZE } from '../../model/pack';
import { PersistedUser } from '../../model/user';
import { cardKey } from '../../model/card';

/** A store that holds nothing and remembers nothing. */
class NullStore implements UserStore {
  async load(): Promise<PersistedUser | null> {
    return null;
  }
  async save(): Promise<void> {}
}

describe('Shop', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Shop>>;
  let shop: Shop;
  let user: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: USER_STORE, useValue: new NullStore() }],
    });
    user = TestBed.inject(UserService);
    fixture = TestBed.createComponent(Shop);
    shop = fixture.componentInstance;
    fixture.detectChanges();
  });

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const wares = () => [...fixture.nativeElement.querySelectorAll('.ware')] as HTMLElement[];

  // ─── 7.1 The page is a storefront, not a placeholder ────────────────────

  it('no longer presents itself as a placeholder', () => {
    expect(fixture.nativeElement.querySelector('.page-title')!.textContent).toContain('Shop');
    // "Coming soon" survives only where something genuinely is.
    const markers = [...fixture.nativeElement.querySelectorAll('.coming-soon')];
    expect(markers).toHaveLength(2);
    for (const marker of markers) {
      expect(marker.closest('.placeholder')).not.toBeNull();
    }
  });

  it('keeps the themed treatment of the page', () => {
    for (const part of [
      '.void-bg',
      '.mist-layer',
      '.particles .particle',
      '.corner',
      '.ornament',
    ]) {
      expect(fixture.nativeElement.querySelector(part), part).not.toBeNull();
    }
  });

  // ─── 7.2 The purse ──────────────────────────────────────────────────────

  describe('the purse', () => {
    it('shows a new player zero rather than a blank', () => {
      const purse = fixture.nativeElement.querySelector('[data-testid="purse"]')!;
      expect(purse.textContent!.trim()).toBe('0');
      // The mark names the currency, so the balance is a number and a mark.
      expect(purse.querySelector('img.geo-mark')!.getAttribute('alt')).toBe('Geo');
    });

    it('spells the currency nowhere on the page', () => {
      user.creditGeo(500);
      fixture.detectChanges();
      expect(text()).not.toContain('Geo');
      expect(text().toLowerCase()).not.toContain('geo');
      // Every amount on the page goes through the primitive.
      expect(fixture.nativeElement.querySelectorAll('app-geo').length).toBeGreaterThan(0);
    });

    it('follows the balance without a reload', () => {
      user.creditGeo(640);
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('[data-testid="purse"]')!.textContent!.trim(),
      ).toBe('640');
    });
  });

  // ─── 7.3 The wares ──────────────────────────────────────────────────────

  describe('the pack wares', () => {
    it('presents all three tiers in ascending price order', () => {
      expect(shop.wares.map((w) => w.name)).toEqual(['Level 1', 'Level 2', 'Level 3']);
      expect(shop.wares.map((w) => w.price)).toEqual([100, 250, 500]);

      // The name a ware carries is the one printed on its wrapper.
      const rendered = wares().map((el) =>
        el.querySelector('app-pack .pack-name')!.textContent!.trim(),
      );
      expect(rendered).toEqual(['Level 1', 'Level 2', 'Level 3']);
    });

    it('shows each ware as one sealed pack, with no name set outside it', () => {
      for (const [i, el] of wares().entries()) {
        const packs = el.querySelectorAll('app-pack');
        expect(packs).toHaveLength(1);

        const art = packs[0].querySelector('img.pack-art') as HTMLImageElement;
        expect(art.getAttribute('src')).toBe(shop.wares[i].art);

        // Nothing captions the pack: the only place the tier's name appears on
        // the ware is inside the wrapper.
        expect(el.querySelector('.ware-name')).toBeNull();
        const outside = el.textContent!.replace(packs[0].textContent!, '');
        expect(outside).not.toContain(shop.wares[i].name);
      }
    });

    it('states each price exactly once, as a Geo amount', () => {
      user.creditGeo(1000);
      fixture.detectChanges();

      for (const [i, el] of wares().entries()) {
        const amounts = [...el.querySelectorAll('app-geo')];
        expect(amounts).toHaveLength(1);
        expect(amounts[0].textContent!.trim()).toBe(String(shop.wares[i].price));
        expect(amounts[0].querySelector('img.geo-mark')).not.toBeNull();
      }
    });

    it('carries no card count and no odds copy', () => {
      expect(fixture.nativeElement.querySelectorAll('.ware-contents')).toHaveLength(0);
      expect(fixture.nativeElement.querySelectorAll('.ware-odds')).toHaveLength(0);
      const copy = text().toLowerCase();
      expect(copy).not.toContain(`${PACK_SIZE} cards`);
      expect(copy).not.toMatch(/\d+%/);
    });
  });

  // ─── 7.4 Affordability ──────────────────────────────────────────────────

  describe('affordability', () => {
    it('marks every pack and offers no control at zero Geo', () => {
      expect(user.geo()).toBe(0);
      expect(wares().every((el) => el.classList.contains('is-unaffordable'))).toBe(true);
      expect(fixture.nativeElement.querySelectorAll('[data-buy]')).toHaveLength(0);
      expect(fixture.nativeElement.querySelectorAll('[data-locked]')).toHaveLength(3);
      expect(fixture.nativeElement.querySelectorAll('.ware button')).toHaveLength(0);
    });

    it('keeps the price on an unaffordable ware, on a plate that is not a control', () => {
      for (const [i, el] of wares().entries()) {
        const plate = el.querySelector('[data-locked]')!;
        const amount = plate.querySelector('app-geo')!;
        expect(amount.textContent!.trim()).toBe(String(shop.wares[i].price));
        expect(amount.querySelector('img.geo-mark')).not.toBeNull();
        expect(plate.textContent!.toLowerCase()).toContain('not enough');

        // Nothing on the plate, or anywhere else in the ware, can be reached.
        expect(plate.querySelectorAll('button, a')).toHaveLength(0);
        expect(el.querySelectorAll('button, a')).toHaveLength(0);
      }
    });

    it('refuses a buy that reaches it anyway', () => {
      shop.buy(PACKS[0]);
      expect(user.geo()).toBe(0);
      expect(user.totalCards()).toBe(9);
      expect(shop.opening()).toBeNull();
    });

    it('opens Level 1 and keeps Level 3 marked at exactly 100 Geo', () => {
      user.creditGeo(100);
      fixture.detectChanges();

      expect(shop.canAfford(PACKS[0])).toBe(true);
      expect(shop.canAfford(PACKS[2])).toBe(false);
      expect(fixture.nativeElement.querySelector('[data-buy="level-1"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('[data-buy="level-3"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-locked="level-3"]')).not.toBeNull();
    });

    it('makes a pack buyable when the balance reaches it, without a reload', () => {
      expect(fixture.nativeElement.querySelector('[data-buy="level-3"]')).toBeNull();
      user.creditGeo(500);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-buy="level-3"]')).not.toBeNull();
    });
  });

  // ─── 7.4b The control that buys a pack ──────────────────────────────────

  describe('the buy control', () => {
    beforeEach(() => {
      user.creditGeo(1000);
      fixture.detectChanges();
    });

    it('is labelled with the price and nothing else', () => {
      for (const [i, el] of wares().entries()) {
        const button = el.querySelector('[data-buy]') as HTMLButtonElement;
        expect(button.tagName).toBe('BUTTON');
        expect(button.getAttribute('data-buy')).toBe(shop.wares[i].id);
        expect(button.textContent!.trim()).toBe(String(shop.wares[i].price));
        expect(button.querySelector('app-geo img.geo-mark')).not.toBeNull();
      }
    });

    it('presents no separate purchase label', () => {
      expect(text().toLowerCase()).not.toContain('buy');
      const controls = [...fixture.nativeElement.querySelectorAll('button')] as HTMLElement[];
      for (const control of controls) {
        expect(control.textContent!.toLowerCase()).not.toContain('buy');
      }
    });

    it('buys that pack when it is activated', () => {
      const button = fixture.nativeElement.querySelector('[data-buy="level-2"]') as HTMLElement;
      button.click();
      fixture.detectChanges();
      expect(user.geo()).toBe(750);
      expect(shop.opening()).not.toBeNull();
    });
  });

  // ─── 7.5 The purchase ───────────────────────────────────────────────────

  describe('buying a pack', () => {
    beforeEach(() => {
      user.creditGeo(1000);
      fixture.detectChanges();
    });

    it('spends exactly the price and grants exactly five cards', () => {
      shop.buy(PACKS[1]);
      expect(user.geo()).toBe(750);
      expect(user.totalCards()).toBe(14);
    });

    it('opens the overlay on the pack that was bought', () => {
      shop.buy(PACKS[2]);
      fixture.detectChanges();

      expect(shop.opening()!.pack).toBe(PACKS[2]);
      const overlay = fixture.nativeElement.querySelector('app-pack-opening')!;
      expect(overlay.querySelector('app-pack .pack-name')!.textContent!.trim()).toBe(PACKS[2].name);
    });

    it('opens the overlay on the cards that were granted, in reveal order', () => {
      shop.buy(PACKS[2]);
      const revealed = shop.opening()!.cards;
      expect(revealed).toHaveLength(PACK_SIZE);

      const rarities = revealed.map((c) => c.stars);
      expect(rarities).toEqual([...rarities].sort((a, b) => a - b));

      // Every revealed card is accounted for in the collection.
      for (const card of revealed) {
        expect(user.collection().get(cardKey(card))).toBeGreaterThan(0);
      }
    });

    it('raises the quantity of a card already held rather than discarding it', () => {
      const before = user.totalCards();
      shop.buy(PACKS[0]);
      const revealed = shop.opening()!.cards;
      const counts = new Map<ReturnType<typeof cardKey>, number>();
      for (const c of revealed) {
        counts.set(cardKey(c), (counts.get(cardKey(c)) ?? 0) + 1);
      }
      expect(user.totalCards()).toBe(before + PACK_SIZE);
      for (const [key, drawn] of counts) {
        expect(user.collection().get(key)!).toBeGreaterThanOrEqual(drawn);
      }
    });

    it('returns to the storefront when the opening is closed', () => {
      shop.buy(PACKS[0]);
      expect(shop.opening()).not.toBeNull();
      shop.closeOpening();
      fixture.detectChanges();
      expect(shop.opening()).toBeNull();
      expect(fixture.nativeElement.querySelector('app-pack-opening')).toBeNull();
      expect(
        fixture.nativeElement.querySelector('[data-testid="purse"]')!.textContent!.trim(),
      ).toBe('900');
    });
  });

  // ─── 7.6 The development aid ────────────────────────────────────────────

  describe('the Geo grant', () => {
    it('states its amount as a Geo amount rather than in words', () => {
      const button = fixture.nativeElement.querySelector('[data-testid="grant"]')!;
      const amount = button.querySelector('app-geo')!;
      expect(amount.textContent!.trim()).toBe(String(shop.grantAmount));
      expect(amount.querySelector('img.geo-mark')).not.toBeNull();
      expect(button.textContent!.toLowerCase()).not.toContain('geo');
    });

    it('credits the purse', () => {
      const button = fixture.nativeElement.querySelector('[data-testid="grant"]')!;
      button.click();
      fixture.detectChanges();
      expect(user.geo()).toBe(500);
      expect(
        fixture.nativeElement.querySelector('[data-testid="purse"]')!.textContent!.trim(),
      ).toBe('500');
    });

    it('says on its face that it is a temporary development aid', () => {
      const note = fixture.nativeElement.querySelector('.dev-note')!.textContent!.toLowerCase();
      expect(note).toContain('temporary');
      expect(note).toContain('development aid');
      expect(note).toContain('not a purchase');
    });

    it('presents no real-money purchase, currency bundle, or reward claim', () => {
      const copy = text().toLowerCase();
      for (const forbidden of [
        '$',
        '€',
        '£',
        'usd',
        'checkout',
        'credit card',
        'claim',
        'reward',
      ]) {
        expect(copy, `the page says "${forbidden}"`).not.toContain(forbidden);
      }
    });
  });

  // ─── 7.7 The placeholders ───────────────────────────────────────────────

  describe('the forthcoming wares', () => {
    it('shows power-ups and cosmetics as sections marked forthcoming', () => {
      const powerUps = fixture.nativeElement.querySelector('[data-placeholder="power-ups"]')!;
      const cosmetics = fixture.nativeElement.querySelector('[data-placeholder="cosmetics"]')!;
      for (const el of [powerUps, cosmetics]) {
        expect(el.textContent!.toLowerCase()).toContain('coming soon');
      }
      expect(powerUps.textContent).toContain('Power-ups');
      expect(cosmetics.textContent).toContain('Cosmetics');
    });

    it('claims no price and offers no control', () => {
      for (const el of [...fixture.nativeElement.querySelectorAll('.placeholder')]) {
        expect(el.querySelectorAll('button')).toHaveLength(0);
        expect(el.querySelectorAll('a')).toHaveLength(0);
        expect(el.textContent).not.toMatch(/\d/);
        expect(el.textContent!.toLowerCase()).not.toContain('geo');
      }
    });

    it('spends nothing and opens nothing when activated', () => {
      user.creditGeo(500);
      const geoBefore = user.geo();
      for (const el of [...fixture.nativeElement.querySelectorAll('.placeholder')]) {
        (el as HTMLElement).click();
      }
      fixture.detectChanges();
      expect(user.geo()).toBe(geoBefore);
      expect(shop.opening()).toBeNull();
    });
  });
});
