import { Routes } from '@angular/router';
import { Battle } from '../components/battle/battle';
import { DeckSelect } from '../components/deck-select/deck-select';
import { Game } from '../components/game/game';
import { gameActiveGuard } from './game-active.guard';

export const routes: Routes = [
  // The default destination is named rather than hosted at '' directly, so the
  // nav's link, the wildcard redirect, and the guard's fallback all name it
  // with the same string.
  { path: '', redirectTo: 'battle', pathMatch: 'full' },

  // Battle, deck selection, and Game are eager: Battle is the first paint, and
  // deck selection and Game sit on the path into a match, which must not wait
  // on a chunk. Everything else can. Deck selection is beneath `battle`, so the
  // nav's Battle link stays current while a deck is chosen.
  { path: 'battle', component: Battle },
  { path: 'battle/deck', component: DeckSelect },
  { path: 'game', component: Game, canActivate: [gameActiveGuard] },

  {
    path: 'shop',
    loadComponent: () => import('../components/shop/shop').then((m) => m.Shop),
  },
  {
    path: 'decks',
    loadComponent: () => import('../components/decks/decks').then((m) => m.Decks),
  },
  {
    path: 'collection',
    loadComponent: () => import('../components/collection/collection').then((m) => m.Collection),
  },
  // The Decks page was the Cards page; an address saved before the rename still lands there.
  { path: 'cards', redirectTo: 'decks' },
  {
    // Development reference only — deliberately not linked from any
    // player-facing screen, and lazy so it adds nothing to the game bundle.
    path: 'style-guide',
    loadComponent: () => import('../components/style-guide/style-guide').then((m) => m.StyleGuide),
  },

  { path: '**', redirectTo: 'battle' },
];
