## Context

See `proposal.md` — Why. The constraints that actually shape the approach:

- **The dev server is not ours to own.** The developer frequently has `npm start` already running
  on `localhost:4200` and expects it to still be there afterwards. The previous CDP driver dodged
  this by serving on port 4300, which avoided the collision but also guaranteed a *second* Angular
  compile every time — slow, and it meant verification never looked at the same server the
  developer was looking at.
- **`gameActiveGuard` blocks direct navigation to `/game`.** Every in-game check has to start at
  `/battle` and click through. This is a fixed cost paid by most of the suite.
- **Angular change detection is asynchronous.** The old driver's sharpest edge was that a DOM read
  in the same evaluate block as a click saw the pre-click DOM, forcing a manual
  evaluate-wait-evaluate rhythm that was easy to get wrong and produced flaky, unreliable results.
- **All five Playwright browser payloads are already cached** under `~/.cache/ms-playwright`
  (chromium-1243, chromium_headless_shell-1243, firefox-1543, webkit-2359, ffmpeg-1011), so adding
  a browser project later is a config edit, not a download.
- **The environment is WSL2**, which is why font rasterisation cannot be trusted to be stable
  enough for committed pixel baselines.
- **`test-results/.last-run.json` is already tracked in git**, committed by the install in `b6cbaae`
  and matched by no `.gitignore` rule.

## Goals / Non-Goals

**Goals:**

- One committed configuration that every browser run — durable or throwaway — goes through, so
  server handling, base URL, and artifact policy are decided once.
- Server acquisition and cleanup that is structurally correct rather than remembered: nothing about
  it should depend on anyone thinking to check a port first.
- A suite short enough that running it is never the expensive option.
- Practice recorded where the repository carries it.

**Non-Goals:**

- Exhaustive end-to-end coverage of game rules. Those are `game.service` unit tests and stay there.
- Any assertion that compares pixels to a stored image.
- CI configuration. Nothing runs this but a person or an assistant, on this machine, for now.
- Cross-browser coverage in the default run.

## Decisions

### Use `webServer.reuseExistingServer` rather than checking the port ourselves

Playwright's `webServer` block is the exact shape of the user's requirement, and it is the reason
this change is small. Given a `url` and `reuseExistingServer: true`, Playwright probes the URL
before the run: if it answers, Playwright attaches to it and touches nothing on exit; if it does
not, Playwright spawns `command`, waits for the URL to respond, and kills that process group when
the run ends — including on failure and on interrupt.

*Alternatives considered.* A pre-run shell script doing `ss -ltn | grep 4200`, conditionally
starting `ng serve` in the background and trapping EXIT to kill it. This is what the bespoke
approach would have grown into, and it is worse in the ways that matter: the trap does not fire on
every interrupt path, the readiness wait becomes a hand-written poll loop, and the whole thing is a
second mechanism to keep correct. Rejected — the built-in already does it, and does it on the
failure paths too.

*Consequence for the config:* `reuseExistingServer` is written as a plain `true` rather than the
common `!process.env.CI` idiom. There is no CI here, and the literal reads as what the project
actually wants.

### Serve on 4200 with `npm start`, deliberately colliding with the developer's server

The base URL is `http://localhost:4200` — the port `ng serve` already defaults to — precisely so
that a server the developer already has running is the one adopted. Moving to a private port would
make adoption impossible and reintroduce the duplicate-compile cost the old driver paid. The
`webServer.command` is `npm start` so the started server is configured identically to the
developer's.

`webServer.timeout` gets a generous allowance (~120s): a cold Angular dev-server compile is well
past Playwright's 60s default, and a timeout here would look like a broken harness.

### Chromium only, as a single named project

One project, `chromium`. Firefox and WebKit are cached and are each a four-line addition to the
`projects` array when a cross-engine question actually arises; carrying them in the default run
triples the wall clock to answer questions nobody has asked.

### Reduced motion as a second project, not a per-test flag

The reduced-motion pass is expressed as its own Playwright project with
`use: { reducedMotion: 'reduce' }` and its own spec file. Setting it per-test via `test.use` also
works, but a project makes it possible to re-run *only* the reduced-motion pass, and keeps the
preference visible in the config rather than buried in a spec.

### Screenshots as artifacts: `screenshot: 'only-on-failure'` plus explicit captures

Two distinct kinds of image, deliberately not conflated:

1. **Failure evidence** — `use: { screenshot: 'only-on-failure', trace: 'on-first-retry' }`.
   Automatic, never looked at unless something broke.
2. **Review artifacts** — explicit `page.screenshot()` calls in checks whose purpose is to produce
   something to look at (the viewport ladder, the card size ladder). Written under the run's
   `outputDir`.

`expect(page).toHaveScreenshot()` is deliberately not used anywhere, and no
`*-snapshots/` directory is created. *Alternative considered:* pixel baselines for the card alone,
since `design-system/card` is the most stable spec in the repo. Rejected for now — the card's
frame craft is still being refined, and one committed baseline invites the rest.

### Scratch checks live in a gitignored `e2e/scratch/`, not in the session scratchpad

A one-off check must run against the committed config to inherit its server behavior, and
Playwright only collects tests under `testDir`. A file written to an out-of-tree scratchpad would
therefore not be picked up without overriding `testDir` — which is exactly the config divergence
this change exists to prevent. So scratch specs go in `e2e/scratch/`, which is gitignored:
inside `testDir` for collection, outside version control for hygiene, and runnable as
`npm run e2e -- scratch/<name>`.

*Alternative considered:* passing an absolute out-of-tree path to `playwright test`. It does not
work without also moving `testDir`, and moving `testDir` per invocation defeats the point.

### A single `startMatch(page)` helper for the guard-gated route

Most in-game checks open `/battle`, click the primary action, and wait for `/game`. That is one
helper in `e2e/helpers.ts`, not a fixture — it is three lines of Playwright and a fixture would
obscure more than it saves. Web-first assertions (`await expect(locator)...`) carry the waiting,
which retires the manual evaluate-wait-evaluate rhythm entirely; no `waitForTimeout` should appear
in the suite.

### Fit is asserted on measurements, not on eyeballing a screenshot

The no-scrollbar guarantee is checked by comparing `scrollWidth`/`scrollHeight` against
`clientWidth`/`clientHeight` on the document element at each viewport on the ladder, and clipping is
checked by comparing each column's and card's bounding box against the viewport rectangle. The
screenshots taken alongside are for a person to review, not the assertion. This keeps the check
deterministic while still producing something to look at.

The ladder includes a viewport deliberately below what the arena needs at the card's minimum
supported width, since `game/screen` specifies uniform scaling there and that path is otherwise
never exercised.

### Superseding the memory rather than leaving it

The existing `browser-verification` assistant memory documents the CDP driver in enough detail to
be followed, so leaving it in place would keep the retired approach alive. It gets rewritten to
point at `CLAUDE.md` and the committed config. The authority moves into the repository; the memory
becomes a pointer to it.

## Risks / Trade-offs

- **An adopted server is not necessarily serving the current code.** If the developer's `ng serve`
  is running stale or has crashed its watcher, verification silently checks the wrong thing. →
  Mitigation: the practice section in `CLAUDE.md` notes that an adopted server's freshness is the
  developer's, and a check whose result is surprising should be re-run against a server the harness
  started itself.
- **Adoption means the harness cannot control server configuration.** A developer running
  `ng serve` on a different port or with different flags will not be adopted, and Playwright will
  start a second server on 4200 — which then fails to bind if something unrelated holds the port. →
  Mitigation: 4200 is the documented port; the failure is loud rather than silent.
- **Headless Chromium under WSL2 can need sandbox flags.** → Mitigation: the first task in the
  plan is a smoke run that proves the harness launches at all, before any spec is written against
  it; launch args are added there if the run demands them.
- **No pixel baselines means an unintended visual regression can pass.** This is the accepted cost
  of the chosen approach. → Mitigation: the review-artifact screenshots exist precisely so that a
  person looks; the durable checks cover the structural claims (fit, clipping, gating) where
  regressions actually hurt.
- **A suite that gets slow stops being run.** → Mitigation: Chromium only, no retries locally, no
  video, and a fit ladder of a few sizes rather than a sweep.
- **Removing `test-results/.last-run.json` from the index is a tracked-file deletion.** It is
  generated output with no history worth keeping, but it is still a `git rm`. → Mitigation: it is
  called out as its own task rather than folded into a config commit.

## Migration Plan

No runtime migration — no application code changes. The sequence that matters is that the harness
is proven to launch before anything is written against it, and that `CLAUDE.md` and the memory are
updated in the same change that lands the config, so the retired CDP approach is never the
best-documented option in the repository.

Rollback is deleting `playwright.config.ts` and `e2e/`; nothing else depends on them.
