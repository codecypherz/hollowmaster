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
ng generate component components/<name>  # Scaffold a new component
```

## Tech Stack

- **Angular 21** with standalone components (no NgModules)
- **Tailwind CSS v4** — imported via `@import "tailwindcss"` in `src/styles.css`
- **Vitest** for unit testing
- **Prettier** — 100 char print width, single quotes; HTML uses the `angular` parser

## Architecture

```
src/
  model/card.ts           # Card class + CARD_DB (the full card database)
  components/open-pack/   # OpenPack component — draws 6 random cards from CARD_DB
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

## Look and Feel requirements
**Always** follow these constraints when making changes to the UI. **Always** check these constraints after making changes to the UI.
- The theme needs to be Hollow Knight
- The in-game UI needs to fit on the screen without clipping.
- The in-game UI needs to take up as much space as possible.
- The in-game UI player cards and opponent cards must always be visible. Do not let them be clipped.
- The in-game UI board and all cards must always be visible.

### Card Look and Feel
All cards must satisfy these constraints
- Cards must have an aspect ratio of 2.5 : 3.5 to make them similar to trading cards.
- Cards must have 3 sections
  - Name
  - Image
  - Stats
- Cards must have direction chevrons (according to it's model)
  - The chevrons must be within the card border but outside of the 3 sections
- Card rarity is rendered as stars in the top-left corner of the image
- Card stats should never show the number for attack and defense, it should only render as a progress bar from 0 to 100.
- Opponent cards must maintain the same aspect ratio
- Opponent cards must be the same size as player cards.

### Board Look and Feel
- The board tiles must always be the same size as the player and opponent cards
- The board tiles must maintain the same aspect ratio
