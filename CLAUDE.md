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
