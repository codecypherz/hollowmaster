# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hollow Master is an Angular web app — a card game inspired by Tetra Master (FF9) using Hollow Knight characters and art. Users open packs of cards drawn from a card database.

## Commands

```bash
npm start          # Dev server at http://localhost:4200
ng serve           # Same as above
ng build           # Production build to dist/
ng test            # Run unit tests with Vitest
npm run e2e        # Browser verification with Playwright (see below)
npm run e2e:ui     # The same suite in Playwright's UI mode, for debugging
npm run e2e:headed # The same suite with the browser window shown
ng generate component components/<name>  # Scaffold a new component
```

## Tech Stack

- **Angular 21** with standalone components (no NgModules)
- **Tailwind CSS v4** — imported via `@import "tailwindcss"` in `src/styles.css`
- **Vitest** for unit testing, **@playwright/test** for browser verification — logic is
  tested in Vitest, and only claims that need real rendering go to Playwright
- **Prettier** — 100 char print width, single quotes; HTML uses the `angular` parser

## Architecture

```
src/
  model/card.ts           # Card class + CARD_DB (the full card database)
  app/                    # Root App component, routing config (currently no routes)
  main.ts                 # Bootstrap entry point
public/images/            # Card artwork (webp/png)
```

### Key patterns

- Components are **standalone** — declare `imports: []` directly in `@Component`.
- Each component has its own `.ts`, `.html`, and `.css` files co-located in its folder.
- The `Card` model lives in `src/model/card.ts` alongside `CARD_DB`, the static array of all cards. New cards are added there.
- Card images are served from `public/images/` and referenced as `/images/<filename>` in the `Card` constructor.
- Angular control flow syntax (`@for`, `@if`, `@empty`) is used in templates — not `*ngFor`/`*ngIf` directives.

## Browser Verification

Playwright, through the committed `playwright.config.ts`, is the required and only way this
project drives a browser. Do not write a separate driver, launch a browser binary directly, or
speak the DevTools protocol by hand — extend the suite in `e2e/` instead. Run it with
`npm run e2e`, debug with `npm run e2e:ui`, and watch it with `npm run e2e:headed`.

The config handles the dev server: a server already on `http://localhost:4200` is adopted and
left running, and one the harness starts is torn down when the run ends. Nothing about a run
requires checking the port first.

Screenshots are review artifacts written to `test-results/` for a person to look at — no
baselines are committed and nothing is compared against a stored image. One-off checks go in
`e2e/scratch/`, which is gitignored but inside `testDir`, so a throwaway spec inherits this
config and leaves no trace: `npm run e2e -- scratch/<name>`. Vitest remains the home for logic
tests; the browser suite is for what only a browser can answer.

What the harness owes and what the suite must cover is specified in
`openspec/specs/tooling/browser-verification/spec.md` — that spec is the single authority, so
read it rather than restating it here.

## Look and Feel requirements

Card and board-tile rendering is specified in `openspec/specs/design-system/card/spec.md`.
That spec is the single authority: aspect ratio, sections, chevrons, stars, stat bars,
frame craft, rarity, and the card's minimum supported width all live there, and board
tiles follow the card. Do not restate those constraints here — read the spec instead.

The in-game screen is specified in `openspec/specs/game/screen/spec.md` (its four-column
arena, the standing panel and Retreat control, the card inspector, how the arena is fitted to
the viewport, and the motion that carries a turn) and `openspec/specs/game/rules/spec.md`
(the board's dimensions, the deal, turns, capture, score, and how a match ends). Those specs
are the single authority for that screen the same way the card spec is for the card — read
them rather than restating their constraints here.
