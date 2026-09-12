import { InjectionToken } from '@angular/core';
import { PersistedUser, parsePersistedUser } from '../model/user';

/**
 * The one boundary between the application and wherever user data is kept.
 *
 * Nothing outside an implementation of this port touches the underlying store,
 * so replacing browser storage with a backend is a second implementation
 * rather than a rewrite. The port is asynchronous even though `localStorage`
 * is not: a synchronous port simply cannot be fulfilled by a network store,
 * and adopting one now would guarantee the rewrite this shape exists to avoid.
 *
 * Neither method rejects. A store that cannot be read yields `null` — the
 * caller seeds a fresh user — and a store that cannot be written swallows the
 * failure, because there is no save state to show the player and an
 * unactionable error is worse than a silent one.
 */
export interface UserStore {
  load(): Promise<PersistedUser | null>;
  save(user: PersistedUser): Promise<void>;
}

/** The one `localStorage` entry this application owns. */
export const STORAGE_KEY = 'hollowmaster.user.v1';

/** The default store: the browser's `localStorage`, behind the port. */
export class LocalStorageUserStore implements UserStore {
  async load(): Promise<PersistedUser | null> {
    let raw: string | null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage unavailable in this browser — a private window, a blocked
      // origin. Indistinguishable, from here, from having nothing stored.
      return null;
    }
    if (raw === null) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    return parsePersistedUser(parsed);
  }

  async save(user: PersistedUser): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Full, or unavailable. The in-memory user stays correct for the session
      // and the player is told nothing they could act on.
    }
  }
}

/**
 * How the application reaches storage. Defaulted to `localStorage` so nothing
 * has to provide it, and overridable so a test substitutes an in-memory store
 * with a single `providers` entry.
 */
export const USER_STORE = new InjectionToken<UserStore>('UserStore', {
  providedIn: 'root',
  factory: () => new LocalStorageUserStore(),
});
