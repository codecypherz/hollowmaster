## 1. Harness foundation

- [x] 1.1 Add `/test-results` and `/playwright-report` to `.gitignore`, and `git rm --cached test-results/.last-run.json` to drop the file the install committed in `b6cbaae`. Verify `git status` is clean after a Playwright run writes into `test-results/`, and that `git check-ignore -v test-results/.last-run.json` now reports a matching rule.
- [x] 1.2 Write `playwright.config.ts` at the repo root: `testDir: './e2e'`, `outputDir: './test-results'`, `use.baseURL: 'http://localhost:4200'`, a single `chromium` project on a landscape default viewport, `use.screenshot: 'only-on-failure'`, `use.trace: 'on-first-retry'`, `retries: 0`, no video, and `fullyParallel` off so viewport-resizing checks do not contend. Verify `npx playwright test --list` enumerates the config without error.
- [x] 1.3 Add the `webServer` block to the same config — `command: 'npm start'`, `url: 'http://localhost:4200'`, `reuseExistingServer: true`, `timeout: 120_000` per `design.md`. Verify `npx playwright test --list` still parses, and that the config contains no hand-written port probe or kill logic.
- [x] 1.4 Add `e2e`, `e2e:ui`, and `e2e:headed` scripts to `package.json` wrapping `playwright test`, `playwright test --ui`, and `playwright test --headed`. Verify each runs from a clean shell with no extra flags.
- [x] 1.5 Write `e2e/smoke.spec.ts` — load `/`, assert it lands on `/battle` and that the primary action is visible — and run it as the first proof the harness launches at all. Verify it passes under WSL2 headless Chromium; if the launch fails, add the minimum launch args needed and record which in a comment before continuing.

## 2. Server acquisition and cleanup

- [x] 2.1 Verify adoption: with `npm start` already running on 4200 in a separate shell, run `npm run e2e -- smoke` and confirm from the output that Playwright reported reusing the existing server, that no second Angular compile occurred, and that the developer's server is still serving `http://localhost:4200` after the run exits.
- [x] 2.2 Verify the adopted server is left alone: confirm the pre-existing `ng serve` process id is unchanged after the run, so the harness neither restarted nor reconfigured it.
- [x] 2.3 Verify start-and-teardown: with nothing listening on 4200, run `npm run e2e -- smoke` and confirm Playwright started a server, the run passed, and `ss -ltn` shows nothing on 4200 afterwards.
- [x] 2.4 Verify teardown on failure: temporarily point an assertion at a selector that cannot match, run with no server pre-running, and confirm that after the failing run nothing is left listening on 4200. Restore the assertion afterwards.
- [x] 2.5 Verify runs do not accumulate servers: run the suite three times in succession with nothing pre-running and confirm each run starts exactly one server and 4200 is free between runs.

## 3. Navigation helper and the guard path

- [x] 3.1 Add `e2e/helpers.ts` exporting `startMatch(page)` — open `/battle`, activate the primary action, await the `/game` URL and the arena's presence — using web-first assertions only. Verify a repo search of `e2e/` finds no `waitForTimeout` and no manual polling.
- [x] 3.2 Write `e2e/battle-to-game.spec.ts` asserting the guard's required path works and the direct path does not: `startMatch` reaches `/game` and renders the arena, while navigating straight to `/game` in a fresh context redirects to `/battle`. Verify both cases pass.
- [x] 3.3 Verify Retreat returns to `/battle` and re-blocks `/game`: after retreating mid-match, a direct visit to `/game` redirects. Verify the check passes.

## 4. In-game fit across the viewport ladder

- [x] 4.1 Write `e2e/game-fit.spec.ts` driving a viewport ladder of 1920×1080, 1600×900, 1440×900, 1366×768, and 1100×620, asserting at each size that `document.documentElement.scrollWidth <= clientWidth` and `scrollHeight <= clientHeight`. Verify the check passes at every size on the ladder.
- [x] 4.2 In the same spec, assert nothing is clipped at each size: the standing panel, the inspector, both hand racks, and the board each have a bounding box fully inside the viewport rectangle, and all 25 board cells and all 18 hand positions are present. Verify the check passes at every size.
- [x] 4.3 Add a viewport below what the arena needs at the card's 120px minimum (per `game/screen` — "A viewport too small for the arena scales it rather than breaking it") and assert the arena is uniformly scaled rather than reflowed: the four columns are still present and in order, all 25 cells and 18 positions still render, and the page still does not scroll. Verify the check passes.
- [x] 4.4 Assert a resize preserves the fit: resize from a wide-and-short viewport to a narrow-and-tall one within a single match and re-run the no-scroll and no-clip assertions after the refit. Verify the check passes in both directions.
- [x] 4.5 Capture a review screenshot at each ladder size into `test-results/`. Verify the files are produced, are visually correct on inspection, and that no `toHaveScreenshot` call and no `*-snapshots/` directory exists anywhere in `e2e/`.

## 5. Card rendering and the ability gate

- [x] 5.1 Write `e2e/card-rendering.spec.ts` against `/style-guide`, asserting the ability gate on both sides of its threshold per `design-system/card`: a card rendered below the threshold shows no ability section, and one at or above it shows the ability text, set, and number. Verify both assertions pass.
- [x] 5.2 In the same spec, assert the size ladder's narrowest example is at the card's minimum supported width and that no example renders narrower. Verify the check passes.
- [x] 5.3 Capture a review screenshot of the card size ladder into `test-results/`. Verify the image is produced and the gate is visible in it by eye.

## 6. Reduced motion

- [x] 6.1 Add a second Playwright project to the config with `use: { reducedMotion: 'reduce' }`, scoped to `e2e/reduced-motion.spec.ts`, per `design.md`. Verify `npx playwright test --list` shows both projects and that the reduced-motion project can be run alone by name.
- [x] 6.2 Write `e2e/reduced-motion.spec.ts` starting a match and placing a card under the reduced-motion preference, asserting the screen still reaches its post-placement state and that the fit assertions from section 4 still hold. Verify the check passes.

## 7. Scratch verification convention

- [x] 7.1 Add `/e2e/scratch/` to `.gitignore` so throwaway specs sit inside `testDir` for collection but outside version control. Verify a file written to `e2e/scratch/` is collected by `npx playwright test --list` and does not appear in `git status`.
- [x] 7.2 Prove the convention end to end: write a throwaway spec under `e2e/scratch/`, run it with `npm run e2e -- scratch/`, confirm it inherits the config's server adoption and cleanup, then delete it. Verify `git status` is clean and the repository holds no trace of it.

## 8. Project instructions and memory

- [x] 8.1 Add a **Browser Verification** section to `CLAUDE.md` stating that Playwright through the committed `playwright.config.ts` is the required and only way this project drives a browser, that a dev server already on 4200 is adopted and left running while a server the harness starts is torn down automatically, that screenshots are review artifacts and no baselines are committed, that one-off checks go in the gitignored `e2e/scratch/`, and that Vitest remains the home for logic tests. Point at the specs rather than restating their constraints, matching how the file already defers to `openspec/specs/`. Verify the section names the three npm scripts and does not duplicate any requirement text.
- [x] 8.2 Add the three e2e scripts to the Commands block in `CLAUDE.md`, and add `@playwright/test` to the Tech Stack list alongside Vitest with the logic-versus-rendering split stated in one line. Verify the file reads consistently with its existing sections.
- [x] 8.3 Rewrite the `browser-verification` assistant memory so it no longer describes the retired CDP-over-WebSocket driver, and instead records that browser verification is governed by `CLAUDE.md` and `playwright.config.ts` in the repository. Verify the memory contains no launch-flag or CDP-domain instructions that could be followed instead of the harness.
- [x] 8.4 Run the full suite once against an already-running server and once with none running. Verify both pass, that the adopted server survives and the started server does not, and that `git status` is clean afterwards.
