## 1. Combat rules module (pure, Vitest)

- [x] 1.1 Create `src/model/combat.ts` with the band table stated once (`ROLL_BANDS`), `rollD100(rng)`, the `CombatValue` union, and `powerFor(stat, roll)` (halves round up). Verify with `src/model/combat.spec.ts`: every roll 1–100 maps to exactly one band, the band edges (95/94/85/84/70/69/51/50/32/31/17/16/7/6/2) are exact, and attack 40 @ 90 → 46 and defense 30 @ 20 → 27
- [x] 1.2 Add `decideCombat(attacker, defender)`: matching extremes and ties go to the defender, 100 wins, 1 loses, and otherwise the attacker needs strictly more power. Verify with a spec covering each scenario in "A combat is won by the higher power, with ties to the defender"
- [x] 1.3 Add `beginResolution(board, at, side)`, which classifies combat vs defenseless targets by opposite-facing chevrons and ignores friendly, unpointed, and off-board cells. Verify with specs for each "Only the card just played attacks" scenario, including the neighbour that points in without being pointed at
- [x] 1.4 Add `fight(board, res, target, rng)`: one attacker roll per turn (carried), the worn-down power (`value − defense`, unchanged after a defender's 1, an outright win sweeps), the loser flip, the one-step combo for either loser, pruning of targets taken by the combo, and `res: null` when the attacker loses. Each step emits `combat`/`capture` events. Verify with scripted-RNG specs: 60 vs 25 carries 35, a worn-down attack loses, a 100 beats three defenders, a defender's 1 costs nothing, a beaten attacker hands its friendly neighbours over, a combo doesn't chain, and a combo settles a pending combat
- [x] 1.5 Add `finish(board, res)`, which takes the remaining defenseless targets with no combo. Verify with specs: combats come first, losing forfeits the rest, a sweep takes the defenseless, and the event order is combat → loser → combo → … → defenseless
- [x] 1.6 Add the opponent's ordering policy (ascending base defense, ties broken by board order). Verify with a spec

## 2. Deal and first turn (model, Vitest)

- [x] 2.1 Add `randomReadyDeck(db, rng)` to `src/model/deck.ts`: shuffle-through dealing that skips cards at or above `RARITY_LIMIT.minStars` once the allowance is used, and throws when no card is below the threshold. Verify in `deck.spec.ts`: 500 deals all pass `isBattleReady` (using `addSixStarCard` so rare cards are actually in play), a single common card gives nine copies, and an all-rare database throws
- [x] 2.2 Add `starTotal(cards)` and `decideFirstTurn(playerStars, opponentStars, rng)` to `src/model/game.ts`. Verify with specs: heavier moves first, lighter moves second, and a tie follows the scripted coin (and both outcomes occur under `Math.random` across many runs)

## 3. Game state and service

- [x] 3.1 Extend `GameState`: the `'player-choosing'` phase, `resolution: Resolution | null`, `events: TurnEvent[]` with a monotonically increasing `seq`, and `firstTurn`. Derive or remove `lastFlipped`/`lastPlaced` so the event record is the only record. Verify `ng build` passes with every reader updated
- [x] 3.2 Add the `GAME_RANDOM` injection token (default `Math.random`) and thread it through every roll, deal, coin flip, and empty-cell pick in `GameService`. Verify that service specs can provide a scripted sequence
- [x] 3.3 Rewrite `startGame`: the opponent's hand from `randomReadyDeck`, `firstTurn` from star totals, and when the opponent moves first, start in `'opponent-turn'` and schedule its move. Verify with service specs for both first-turn branches and the coin flip
- [x] 3.4 Rewrite `placeCard` and `opponentMove` on top of a shared resolution driver: the player parks in `'player-choosing'` when two or more combat targets remain, and the opponent runs straight through using the ordering policy. Remove `resolveBattles`, `roll`, and `STAT_VARIANCE`. Verify with service specs: no combat fought until the choice, the last combat needs no choice, and the turn passes only once resolution ends
- [x] 3.5 Add `chooseCombat(row, col)`: it is refused (no change) for a cell that is not a remaining combat target, and `selectCard`/`placeCard` are refused while choosing. Verify with specs covering "Only a remaining target can be chosen" and "No placement while a combat order is pending"
- [x] 3.6 Pace the opponent with `OPPONENT_THINK_MS + combats × CLASH_MS` (where `CLASH_MS` mirrors `--dur-clash`, with a comment like `SCORE_STEP_MS`'s). Verify with a fake-timer spec
- [x] 3.7 Update `game.service.spec.ts`: delete the chain-capture and "player moves first" assertions, keep the score/end/inspect/retreat specs passing with scripted RNG, and confirm the opponent hand is always Ready. Verify `ng test` is green

## 4. Screen: choosing, announcing, status

- [x] 4.1 In `Game.onCellActivate`, route offered targets to `chooseCombat` + `inspect` while choosing, and only inspect otherwise. Add the `cell-choosable` class (glyph and outline, not colour alone) and the aria-label suffix. Verify with `game.spec.ts`: offered cells are marked, others aren't, a click fights, a non-target only inspects, and the marking clears
- [x] 4.2 Scoreboard status: "Choose your battle" in `'player-choosing'`, plus correct active-side marking when the opponent opens the match. Verify with `scoreboard.spec.ts` / `game.spec.ts`
- [x] 4.3 Add the first-turn announcement banner over the board (`role="status"`, `pointer-events: none`) showing both star totals, who moves first, and "by coin flip" when it applies. Verify with a component spec for both the tie and non-tie text

## 5. Screen: motion

- [x] 5.1 Add motion tokens (`--dur-clash`, `--dur-land`, plus any easing) to `src/styles/tokens.css`. Verify that no new literal durations or easings appear in the component stylesheets (grep)
- [x] 5.2 Build the component-local event sequencer in `Game`: queue by `seq`, play `place`/`combat`/`capture` in order, advance on the clash's final `animationend`, flush on new events or destroy, and skip waiting under reduced motion. Verify with `game.spec.ts`: events play in order, a placement spanning several state updates plays only its new events, and a reduced-motion path reveals at once
- [x] 5.3 Landing: an `is-landing` class after the travel, with a settle-and-impact keyframe and a soul-light ring as a pseudo-element (no layout shift). Verify visually via a scratch Playwright screenshot of a mid-landing frame
- [x] 5.4 Clash layer over `.board` (`pointer-events: none`): both cards with ATK/DEF labels, roll reveal resolving to power ("WIN"/"FAIL" for 100/1), the carried power on later combats, a strike flash, loser recoil, and a "Victor" text label. Verify with a component spec for the content (rolls, powers, carried power, outright labels, Victor) and a scratch screenshot for the look
- [x] 5.5 Capture reveal: apply `is-flipped` from the sequencer's released set, so a combat's loser and combo turn after its clash, with `--stagger` between them. Verify with `game.spec.ts` on reveal order
- [x] 5.6 Reduced motion: the clash shows its finished state statically, and landing, shake, burst, and banner motion are removed in the `prefers-reduced-motion` blocks. Verify with an extended `e2e/reduced-motion.spec.ts` assertion that a combat's rolls, powers, and Victor are visible without animation

## 6. Browser verification and wrap-up

- [x] 6.1 Make the e2e game helpers turn-aware: wait for "Your Turn" before selecting, and place into an empty cell rather than assuming `2-2` is free (the opponent may move first). Verify `npm run e2e` passes repeatedly (e.g. `--repeat-each=5` on the game specs)
- [x] 6.2 Add a durable e2e check that the clash layer and choosable-cell marking never move or resize an arena column and leave the codex and Retreat visible, across the existing viewport ladder. Verify `npm run e2e` is green
- [x] 6.3 Full pass: `ng test`, `ng build`, `npm run e2e` all green, and `npx prettier --check` clean on changed files. Review the scratch screenshots in `test-results/` for the landing and clash
