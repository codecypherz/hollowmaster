import { defineConfig, devices } from '@playwright/test';

/**
 * The single source of every browser run in this project — durable specs under
 * `e2e/` and throwaway checks under `e2e/scratch/` alike. Base URL, viewport,
 * browser, artifact policy, and server handling are decided here so no
 * invocation needs a remembered flag.
 *
 * See `openspec/specs/tooling/browser-verification/spec.md`.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',

  // Viewport-resizing checks measure the window they are given; running them
  // alongside each other would have them contend for it.
  fullyParallel: false,
  workers: 1,

  // Nothing runs this but a person on this machine, so a retry would only hide
  // a flake that should be fixed.
  retries: 0,

  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:4200',
    // Landscape: the arena is a four-column screen and is never checked in
    // portrait by default.
    viewport: { width: 1440, height: 900 },
    // Failure evidence only. Review screenshots are taken explicitly by the
    // checks whose purpose is to produce something to look at; no image is
    // ever compared against a stored reference.
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      // The reduced-motion pass belongs to its own project; running it here as
      // well would run it without the preference it exists to exercise.
      testIgnore: 'reduced-motion.spec.ts',
    },
    {
      // The preference lives in the config rather than inside a spec, so the
      // pass can be re-run on its own: `npm run e2e -- --project=reduced-motion`.
      name: 'reduced-motion',
      testMatch: 'reduced-motion.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        reducedMotion: 'reduce',
      },
    },
  ],

  /**
   * Server acquisition and cleanup, structurally rather than by remembering.
   * Playwright probes `url` first: a dev server the developer already has on
   * 4200 is adopted and left untouched on exit; where none answers, `command`
   * is spawned and that process group is killed when the run ends, including
   * on failure and on interrupt. No port probe or kill logic is hand-written.
   *
   * `reuseExistingServer` is a literal `true` rather than the usual
   * `!process.env.CI` — there is no CI here, and the literal says what this
   * project actually wants.
   */
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    // A cold Angular dev-server compile runs well past Playwright's 60s
    // default; timing out there would read as a broken harness.
    timeout: 120_000,
  },
});
