# In-game fit at the card's 120px minimum

Recorded, not fixed. Task 7.1 raised `--card-h`'s lower clamp bound in
`src/components/game/game.css` to `168px` so `--card-w` can never fall below the card's
declared minimum supported width of 120px. No other game layout rule was touched. This is
what the legacy layout then does, measured in Chromium against the running dev server with
a battle in progress.

| Viewport | `--card-w` | Verdict |
|---|---|---|
| 1920 × 1080 | 134px | **Fits.** The viewport term still wins over the floor; nothing overlaps or clips. |
| 1366 × 768 | 120px (floor) | **Fits the viewport, but crowds.** Nothing is clipped, and the board plus both hands are fully on screen — but the layout has no slack left: the `YOUR TURN` indicator sits on the board's top border, and the `RETREAT` button overlaps the bottom-left board tile. |
| 1280 × 600 | 120px (floor) | **Does not fit.** The board overflows the viewport top and bottom (`top: -56px`, `bottom: 660px` against a 600px viewport), and the opponent hand with it (`top: -55px`, `bottom: 659px`). The top board row and the bottom board row are both cut off, so two of the sixteen tiles are unusable. |

## What the in-game rework has to solve

At the floor the board alone needs `4 × 168px + 3 × 6px gap + 2 × 12px padding` = **714px**
of height, before the score bar and the retreat button. Anything under roughly 780px of
viewport height cannot show a 4 × 4 board of legible cards in the current single-screen
layout, and the two hands add nothing vertically only because they are already centred
against the board's own height.

The options are the screen's to choose, not the card's — the card's contract is that a
surface which cannot spare 120px per card changes its own layout rather than shrinking the
card. Candidates: drop the score bar and retreat button out of the vertical flow (overlay
or corner them), scroll or pan the board, or scale the whole play area as one unit so the
board and hands shrink together in CSS pixels the card never sees.
