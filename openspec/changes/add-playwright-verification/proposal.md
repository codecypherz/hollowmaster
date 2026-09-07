## Why

Almost every requirement in this repo's largest specs is a claim about what a browser
*renders*: the card spec gates its ability section on rendered width, `game/screen` forbids a
scrollbar "at any viewport size" and requires a small viewport to scale the arena rather than
reflow it, and both specs turn on motion and reduced-motion behaviour. None of that is
observable from jsdom, so `ng test` cannot support those claims — and until now the gap was
filled by a bespoke harness: a hand-rolled ~60-line driver that launched the cached Chromium
binary with `--remote-debugging-port` and spoke raw CDP over Node's global `WebSocket`. That
harness lived only in an assistant memory file, was rewritten from scratch each time it was
needed, left no artifact anyone else could re-run, and understood nothing about the dev server —
so it could collide with a server the developer already had running, or leave one of its own
behind.

`@playwright/test` 1.63 is now a devDependency and all five browser payloads are already cached.
The bespoke driver has no remaining reason to exist, and the practice around it needs to be
written down where it binds the project rather than one assistant's memory.

## What Changes

**Playwright becomes the only way this project drives a browser.** The CDP-over-WebSocket
approach is retired. Every browser-driven check — spec verification during a change, a screenshot
to review a design, a one-off "does this actually render" question — goes through Playwright and
the committed config.

- **A committed `playwright.config.ts`** is the single source of the run: base URL, viewport,
  Chromium-only project, artifact output, and — critically — a `webServer` block whose
  `reuseExistingServer` setting makes server handling automatic rather than a thing anyone has to
  remember. A dev server already listening on the base URL is adopted and left running; if none is
  listening, Playwright starts one and tears down that same server when the run ends.
- **A durable `e2e/` suite** covering the screens the specs care most about — the Battle entry and
  its transition through `gameActiveGuard` into `/game`, the in-game arena's fit and no-scrollbar
  guarantee across a viewport ladder including one deliberately too small to host the arena, the
  card renderer's width-gated ability section on both sides of its threshold via the style guide,
  and the reduced-motion pass. These are the checks that were being re-improvised per change; they
  become a suite that runs in seconds.
- **A scratch-verification convention** for the one-off questions a durable spec should not absorb.
  A throwaway script written to the session scratchpad runs against the *same* committed config, so
  it inherits the server reuse and cleanup rather than reinventing them.
- **`npm run e2e`, `e2e:ui`, and `e2e:headed`** as the entry points, so no invocation needs a
  remembered flag string.
- **Screenshots are review artifacts, not baselines.** Runs write PNGs to a gitignored output
  directory to be looked at; no golden images are committed and no pixel diffing is configured.
  This is deliberate — WSL2 font rasterisation makes committed baselines noisy, and the design
  surfaces here are still moving.
- **`CLAUDE.md` gains a Browser Verification section** that names Playwright as the required tool,
  states the server-reuse-and-cleanup rule, and points at the config and scripts — so the practice
  binds at the project level for any assistant or contributor, not through a personal memory file.
- **Housekeeping.** `test-results/.last-run.json` was committed by the install and is not
  gitignored; the run's output directories get ignored and that file is removed from the index.
- **Non-goals:** committed screenshot baselines or pixel diffing, Firefox and WebKit projects
  (cached and one config block away, but not run by default), CI wiring, replacing any Vitest unit
  test, and mobile or portrait emulation beyond what the fit ladder already exercises.

**Recommendation beyond the ask.** Two further uses are worth taking now because they cost almost
nothing on top of this work, and one is worth explicitly declining:

- *Take:* trace-on-first-retry and screenshot/video-on-failure. When a verification run disagrees
  with a spec, the trace viewer answers "what did the page actually look like at that moment"
  without a re-run.
- *Take:* `e2e:ui` mode as the debugging path for layout questions. It replaces the
  evaluate-wait-evaluate dance the CDP driver forced, and Playwright's auto-waiting removes the
  class of flake where Angular's async change detection had not yet run.
- *Decline:* moving component behaviour tests out of Vitest. The `game.service` rules, the guard,
  and the card model are correctly tested in jsdom and would only get slower in a browser. The
  split stays: **Vitest for logic, Playwright for what only a real browser can answer.**

## Capabilities

### New Capabilities

- `tooling/browser-verification`: How this project verifies claims that require a real browser —
  that Playwright is the required and only such tool, how a run acquires a dev server and what it
  owes that server on exit, what the durable suite must cover, that screenshots are artifacts
  rather than baselines, and that this obligation is recorded in the project's own instructions
  rather than in any individual's memory. Nothing today specifies any of this; the practice is
  currently unwritten at the project level.

### Modified Capabilities

<!-- None. No player-facing behaviour changes: this change adds a verification harness, its
     suite, and the project instructions that govern their use. The existing specs are the
     subject of that verification, not a party to it — their requirements are unchanged. -->

## Impact

- **`package.json`** — `e2e`, `e2e:ui`, `e2e:headed` scripts. `@playwright/test` is already a
  devDependency; no new dependency is added.
- **`playwright.config.ts`** (new, repo root) — base URL, Chromium project, `webServer` with
  existing-server reuse, artifact output directory, trace/screenshot-on-failure policy.
- **`e2e/`** (new) — the durable specs, plus a small helper for the recurring "start a match and
  land on `/game`" navigation that `gameActiveGuard` requires be reached through Battle rather than
  by direct URL.
- **`.gitignore`** — ignore `test-results/` and `playwright-report/`.
- **`test-results/.last-run.json`** — removed from version control.
- **`CLAUDE.md`** — a new Browser Verification section; the Commands block gains the e2e scripts.
- **Assistant memory** — the `browser-verification` reference memory describing the CDP driver is
  superseded and rewritten to point at the project-level instructions.
- **Unchanged:** all of `src/`, `angular.json`, the Vitest setup, and every existing spec under
  `openspec/specs/`. No application code is touched.
