import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';

/**
 * The persistent navigation chrome for the out-of-battle pages.
 *
 * Its visibility keys off the route rather than off `GameService.isActive()`:
 * a player can be browsing the Shop with a battle in progress, and the nav must
 * show there. It is the in-game *screen* that takes the whole viewport, so the
 * predicate is a routing fact. It yields that viewport by not rendering at all
 * — `@if`, not `display: none` — so no space is reserved for it.
 */
@Component({
  selector: 'app-nav-shell',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-shell.html',
  styleUrl: './nav-shell.css',
})
export class NavShell {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly visible = computed(() => !this.url().startsWith('/game'));
}
