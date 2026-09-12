## Context

See proposal.md — Why. The state of the code this design has to fit into:

- **`src/model/card.ts`** holds the `Card` class and `CARD_DB`. `Card` validates in its constructor
  and throws, because card definitions are hand-authored and static — an invalid card is a defect,
  not a runtime condition. `set` + `number` already identify a card uniquely, and the module asserts
  that uniqueness once over `CARD_DB`. `stars` is a whole number 1–6, guaranteed by the constructor.
- **`CARD_DB` holds fifteen cards** with this rarity spread: nine one-star, three two-star, two
  three-star, one four-star, and **no five-star or six-star cards at all**. Every weight table below
  has to survive that.
- **`src/services/game.service.ts`** is the only existing stateful service and sets the house
  pattern: `@Injectable({ providedIn: 'root' })`, a `private readonly _state = signal<T>(...)`, a
  readonly projection via `asReadonly()`, `computed()` for anything derivable (scores are computed
  from the board precisely so they cannot drift), and plain exported pure functions below a
  `// ─── Helpers ───` rule for the logic worth unit-testing.
- **`src/components/card/card.ts`** renders every card in the application. It takes its width from
  its container and derives everything else in container-query units. Its ability section is gated
  on the card's rendered width (200px, per `design-system/card`), and its declared minimum supported
  width is 120px.
- **`src/components/game/game.css`** fits the arena by computing a card unit from the viewport and
  applying a single uniform `transform: scale()` to the whole arena when the viewport cannot host
  it — the pattern `design-system/card` explicitly permits and `game/screen` requires.
- **Motion tokens** (`--dur-*`, `--dur-stagger`, `--ease-out-soft`) live in `src/styles/tokens.css`.
  Reduced motion is handled per component with a `@media (prefers-reduced-motion: reduce)` block,
  and `e2e/reduced-motion.spec.ts` runs the whole suite in a Playwright project that expresses the
  preference through the browser.
- **There is no persistence of any kind.** No storage, no serialization, no schema versions, and no
  external input anywhere in the application — `CARD_DB` is the only data and it is compiled in.

## Goals / Non-Goals

**Goals:**

- One user state shape that is trivially serializable, so the persistence boundary is a near-identity
  mapping rather than a translation layer.
- Pack odds that live entirely in a declared table, so tuning them is editing six numbers per tier
  and nothing else.
- A draw that is a pure function of (tier, catalogue, randomness), so the odds can be measured in
  Vitest to any precision without a browser.
- A persistence port whose shape a network-backed implementation can satisfy unchanged.
- An opening sequence whose choreography is driven by component state rather than by CSS timing
  alone, so skipping and reduced motion are the same mechanism seen twice.

**Non-Goals:**

- A migration framework. Version 1 is the first persisted shape; there is nothing to migrate from.
- Any asynchrony in the *domain* model. Only the storage port is async.
- Changing where a match's cards come from. `GameService.startGame()` keeps dealing from `CARD_DB`;
  dealing from the owned collection is a later change and this design deliberately leaves the seam
  untouched rather than half-built.
- Rebalancing `CARD_DB` or adding the five- and six-star cards the tables anticipate.

## Decisions

### The collection is a quantity map keyed by a composite card key string

`UserState.collection` is a `ReadonlyMap<CardKey, number>`, where `CardKey` is the template type
`` `${string}#${number}` `` produced by `cardKey(card)` — `FC#7` for Vengefly. Quantity is the value;
absence means zero, and the reader is a `quantityOf(collection, card)` helper that returns `0` for a
missing key, so no caller special-cases absence (the spec's requirement).

A single string key rather than a nested `Map<set, Map<number, n>>` because the composite identity is
already the card's identity in the card model, and one flat key gives O(1) lookup, trivial iteration,
and a serialized form with no nesting.

*Alternative considered:* keying by the `Card` object itself. Rejected outright — cards are recreated
when the module reloads and object identity cannot survive serialization, so the map would break the
moment persistence landed.

*Alternative considered:* an array of `{ set, number, quantity }` entries. Rejected for the in-memory
shape: lookup is O(n), and nothing structurally prevents the same card appearing in two entries,
which is exactly the invariant a map gives for free. It **is** the persisted shape (below), where
self-description matters more than lookup.

### The catalogue index lives in `card.ts`, beside the uniqueness assertion

`card.ts` gains `cardKey(card): CardKey`, `cardKeyOf(set, number): CardKey`, and
`CARD_BY_KEY: ReadonlyMap<CardKey, Card>`, built once from `CARD_DB`.

The module already asserts that no two cards share a set and number. That assertion and this index
are the same fact stated twice; building the index *is* the check (a collision is a duplicate key),
so they become one pass. Putting the index in `user.ts` instead would leave the card module asserting
an invariant it doesn't use and the user module rebuilding it.

The index is what deserialization resolves against, and it is also what makes "cards no longer in the
catalogue are dropped on load" a lookup miss rather than a scan.

### `UserService` mirrors `GameService`: one signal, readonly projection, computed derivations

```
private readonly _state = signal<UserState>(seedUser());
readonly state       = this._state.asReadonly();
readonly geo         = computed(() => this._state().geo);
readonly collection  = computed(() => this._state().collection);
readonly totalCards  = computed(...);   // Σ quantities
readonly distinctCards = computed(...); // map size
```

Mutations are `grantCards(cards)`, `creditGeo(amount)`, and `purchase(price, cards)`. There is no
public `spendGeo` — every spend in the application is a purchase, and exposing a bare deduction
invites the split state the spec forbids. `purchase` returns a boolean: it checks affordability,
and on success applies the deduction and the grant in **one** `_state.update()` call, so no
intermediate state is ever published to a signal consumer.

`UserState`, the seed, and the pure functions over a collection (`grantAll`, `quantityOf`,
`totalCards`) live in `src/model/user.ts` under the same `// ─── Helpers ───` convention as
`game.service.ts`, so they are unit-testable without Angular's injector.

### The starter set is nine stated card identities, not "every one-star card"

`STARTER_CARD_KEYS` is an explicit frozen list of nine keys — `FC#1`, `FC#7`, `FC#8`, `FC#9`,
`FC#10`, `FC#11`, `FC#12`, `FC#13`, `FC#14` (Crawlid, Vengefly, Gruzzer, Tiktik, Aspid Hatchling,
Wandering Husk, Husk Hornhead, Leaping Husk, Husk Bully) — with a module-level assertion that each
resolves in `CARD_BY_KEY` and that there are exactly nine.

These happen to be exactly the one-star cards today, and choosing them is why: a new player owns a
`HAND_SIZE` deck of the weakest cards. But *stating* the rule as "every one-star card" would silently
change the starter set the next time a one-star card is added to `CARD_DB`, and would change how many
cards a new player gets. An explicit list is a decision; a derivation is an accident waiting.

### Pack tiers are three records in one table, weights stated as integers summing to 100

```ts
export type Rarity = 1 | 2 | 3 | 4 | 5 | 6;
export type RarityWeights = Readonly<Record<Rarity, number>>;

export interface PackDefinition {
  readonly id: 'level-1' | 'level-2' | 'level-3';
  readonly name: string;        // 'Level 1'
  readonly price: number;       // Geo
  readonly weights: RarityWeights;
}
```

**The table, and the numbers this change ships with:**

| Rarity | Level 1 | Level 2 | Level 3 |
| ------ | ------- | ------- | ------- |
| ★1     | 55      | 30      | 10      |
| ★2     | 30      | 28      | 15      |
| ★3     | 11      | 21      | 22      |
| ★4     | 2       | 13      | 25      |
| ★5     | 1       | 5       | 18      |
| ★6     | 1       | 3       | 10      |
| **Σ**  | **100** | **100** | **100** |

**Prices:** Level 1 — **100 Geo**; Level 2 — **250 Geo**; Level 3 — **500 Geo**.

What the table yields, and what the spec's ladder requirements are checked against:

| Measure                    | Level 1 | Level 2 | Level 3 |
| -------------------------- | ------- | ------- | ------- |
| Expected rarity of a card  | 1.67    | 2.44    | 3.56    |
| Chance of ★4 or better     | 4%      | 21%     | 53%     |
| Chance of ★6               | 1%      | 3%      | 10%     |

Every weight is ≥ 1, which is what makes "every pack can yield every card" true by construction
rather than by convention. Each rarity's column is monotone across the tiers — ★1 and ★2 fall, ★3
through ★6 rise — with the crossover between ★2 and ★3, so Level 2 is genuinely a middle rather than
Level 1 with a tail.

Weights sum to 100 so the table reads as percentages at a glance, but the drawing code treats them
strictly as **weights over a running sum**, never as percentages. It has to: renormalization (below)
breaks the sum, and a table that must total exactly 100 is a table that is painful to tune.

*Alternative considered:* a guaranteed-rare slot — "Level 3 always contains at least one ★4+". It is
a good mechanic and a common one, but it is not what was asked for, and it would make the pack's
contents no longer a product of five independent draws, which several spec scenarios rest on. Noted
as a candidate for a later change.

### Renormalization is the weighted pick itself, not a separate step

The draw sums the weights of only those rarities the catalogue can actually supply, then picks
against that sum. Dividing by the sum of the surviving weights *is* proportional renormalization —
there is no rescaling pass, no mutated table, and nothing to keep in sync.

```
drawPack(def, catalogue, rng): Card[]
  byRarity = group catalogue by stars              // computed once per draw
  live     = rarities where byRarity has ≥1 card
  total    = Σ def.weights[r] for r in live
  ×5:  roll = rng() * total; walk live accumulating until roll falls in a band
       → pick uniformly from byRarity[r] using rng()
```

Against today's `CARD_DB` — no ★5, no ★6 — the effective distributions become:

| Rarity | Level 1 | Level 2 | Level 3 |
| ------ | ------- | ------- | ------- |
| ★1     | 56.1%   | 32.6%   | 13.9%   |
| ★2     | 30.6%   | 30.4%   | 20.8%   |
| ★3     | 11.2%   | 22.8%   | 30.6%   |
| ★4     | 2.0%    | 14.1%   | 34.7%   |

The ladder survives the missing rarities intact, which is the point of checking it here rather than
discovering it after the tables ship.

*Alternative considered:* falling back to the next-lower represented rarity when a weighted rarity is
empty. Rejected — it concentrates the missing ★5 and ★6 weight entirely onto ★4, distorting the shape
of the table rather than preserving it, and it needs a second rule for when there is no lower rarity.

### Randomness is a parameter, defaulted, not reached for

`drawPack(def, catalogue, rng: () => number = Math.random)`. Tests pass a scripted generator — a
small LCG for distribution measurements, a literal array-backed stub for exact-outcome assertions.
This is what makes the whole odds table verifiable in Vitest, per `cards/packs`.

`game.service.ts` calls `Math.random()` directly today and is not changed by this; the difference is
that a shuffle's fairness is self-evident where a weight table's is not.

### The persistence port is asynchronous, and bootstrap waits on it

```ts
export interface UserStore {
  load(): Promise<PersistedUser | null>;
  save(user: PersistedUser): Promise<void>;
}
```

`localStorage` is synchronous and a `Promise`-returning port is more machinery than it needs **today**.
It is chosen anyway because the spec's requirement is that swapping the implementation changes nothing
else, and a synchronous port simply cannot be fulfilled by a network store — adopting one now would
guarantee the rewrite this design exists to avoid.

The cost is paid once, at bootstrap: `provideAppInitializer(() => inject(UserService).load())` in
`app.config.ts` holds the application until the user is resolved. No component ever sees a loading
state, no signal ever publishes a placeholder user, and the `localStorage` implementation resolves in
a microtask so nothing is visibly delayed. A future backend adapter turns that into a splash — a
behaviour change confined to bootstrap, which is the right place for it.

Writes are fire-and-forget: every mutation calls `save()` and ignores both the resolution and the
rejection. A store that refuses a write must not take the application down with it, and there is no
save state to show the player.

The port is provided through an injection token with the `localStorage` implementation as the default,
so a Vitest suite substitutes an in-memory store with one `providers` entry.

### The persisted shape is a versioned envelope with a self-describing entry array

```jsonc
{
  "version": 1,
  "geo": 350,
  "collection": [{ "set": "FC", "number": 7, "quantity": 3 }]
}
```

An array of entries rather than a JSON object keyed by `FC#7`, because the composite key would have
to be parsed back out of a string, and a hand-inspected record should say what its fields are. This
is the one place the array shape beats the map shape, and it is a boundary, so the conversion cost is
paid once on each side.

`version` is a number checked for exact equality against the current constant. Anything else — a
missing version, a newer one, a string — is treated as unreadable.

### Stored data is validated by a hand-written reader that returns null, never throws

`card.ts` throws on invalid input because its input is hand-authored source. Stored data is the
application's **first external input**, and the opposite rule applies: `parsePersistedUser(raw)`
returns `PersistedUser | null`, checking the version, the shape of every field, that `geo` is a
non-negative integer, and that each entry has a string `set`, an integer `number`, and a positive
integer `quantity`. Entries failing their own check are dropped individually; entries whose key does
not resolve in `CARD_BY_KEY` are dropped on resolution. Only a malformed *envelope* costs the whole
record, and the cost is a freshly seeded user.

*Alternative considered:* adding `zod`. Rejected as disproportionate for one object shape in a project
with no runtime dependencies beyond Angular.

### The Shop splits into a storefront and an opening overlay

`src/components/shop/` keeps the page — void background, particle field, ornaments, header — and
gains the purse, the three pack wares, the dev-grant control, and the power-up and cosmetic
placeholders. `src/components/pack-opening/` is a new component taking `cards: Card[]` and emitting
`done`, with no knowledge of Geo, prices, or the user.

The split is what makes the choreography testable and keeps the storefront from growing a second
state machine inside it. The purchase is settled by `UserService.purchase()` **before** the overlay
opens, so the overlay animates a result that has already happened — which is exactly why navigating
away mid-reveal cannot forfeit the pack.

### The reveal is a hero card that collects into a row

The overlay has two regions: a **hero slot** in the centre where the card currently being revealed
appears large, and a **collected row** beneath it where revealed cards come to rest in order.

Sequence: the hero slot plays the card's arrival, the card holds long enough to read, then it travels
down into the next position in the row and the following card arrives. After the fifth, the hero slot
empties and all five sit in the row together as the summary.

The hero is laid out at a width comfortably above the card renderer's 200px ability gate, which is
what satisfies "an opened card is readable" — the player reads the ability text of each card as it
arrives, not squinting at a row of five. The row is laid out at a smaller width, floored at the card's
120px declared minimum, and the whole overlay is uniformly scaled by a single `transform: scale()`
when the viewport cannot host it — the same fit mechanism `game.css` uses and `design-system/card`
permits for an already-laid-out surface.

Emphasis by rarity is carried by **dwell time and flourish**: a higher-star card holds longer and
arrives with a stronger glow keyed off the existing gold and soul glow tokens. Because ordering is
ascending, that emphasis naturally escalates across the five.

### The reveal is driven by component state, so skip and reduced motion are one mechanism

The overlay holds `revealedCount = signal(0)` and advances it on a timer chain; CSS animations key
off each card's position relative to that count. Three inputs end the sequence, all by the same
route — setting `revealedCount` to 5 and clearing pending timers:

1. **Skip** — the player activates the skip control.
2. **Reduced motion** — `matchMedia('(prefers-reduced-motion: reduce)').matches` is read at open, and
   the sequence jumps straight to complete. The component's CSS also carries a
   `@media (prefers-reduced-motion: reduce)` block zeroing the animations, matching `game.css`'s
   belt-and-braces handling.
3. **Destruction** — the component tears its timers down, so navigating away leaves nothing running.

Rarity emphasis has to survive the motion being removed, per the spec. It does, because the emphasis
is a rarity-keyed *class* on the card's wrapper — a glow and a rarity label — not an animation. Under
reduced motion the glow is still there; only the travel and the staging are gone.

*Alternative considered:* a pure-CSS sequence of staggered `animation-delay`s. Rejected — it cannot be
skipped without either duplicating the end state in a second stylesheet path or fighting the
animations mid-flight, and the reduced-motion path would then be a third rendering of the same layout.

### No new design token; Geo is gold

The palette already carries a full gold ramp used for ornament and structure, and gold reads as
currency without explanation. The purse and prices use `--color-gold` / `--color-gold-light`; the
grant control uses the dim end so it reads as an aside rather than a reward. The proposal left this
open; it resolves to no token change.

### Verification split

Vitest carries everything that is not a rendering claim: the collection multiset and its invariants,
the Geo floor, `purchase` atomicity in both directions, the starter seed, the weight tables (every
weight positive, each rarity monotone across tiers, expected rarity and ★4+ chance strictly
increasing), renormalization against a catalogue missing a rarity and against a single-rarity
catalogue, reveal ordering including ties, a scripted-RNG reproducibility check, a large-sample
distribution check, the persistence round trip, and the corrupt/unversioned/unknown-card fallbacks.

Playwright carries only what a browser settles, extending `e2e/`: the reveal shows five cards one at a
time in ascending rarity, the purse decrements and survives a reload, an unaffordable pack is inert,
the sequence collapses under the existing `reduced-motion` project, and the Shop and the overlay both
fit the viewport without scrolling.

## Risks / Trade-offs

- **`CARD_DB` cannot fill ★5 or ★6, so Level 3 today delivers far less than its table promises** —
  28 of its 100 weight is redistributed, and its best possible card is Goam. → The tables are written
  for the catalogue the game is heading toward, and the effective distribution above shows the ladder
  survives regardless. Unit tests assert both the declared and the effective distributions, so the gap
  is a visible, measured fact rather than a surprise when ★5 cards land.
- **Five draws from fifteen cards means duplicate-heavy packs** — a Level 1 pack will often be five
  cards the player already owns. → This is why the collection is a multiset: a duplicate is a visible
  quantity increase rather than nothing. It stays somewhat unsatisfying until `CARD_DB` grows or
  duplicates gain a use; both are later changes and neither needs this design revisited.
- **The dev grant is a real control in a shipped screen** — it could outlive its welcome or read as a
  game mechanic. → It is labelled as a development aid on the screen, and the change that makes
  matches pay out Geo removes it. It is deliberately not styled as a reward.
- **Bootstrap now waits on storage.** → With `localStorage` the wait is a microtask. The risk is real
  only for a future network adapter, which is the case this shape was chosen to serve; that change
  brings a splash with it.
- **Fire-and-forget writes can silently lose data** on a full or unavailable store, and the player is
  told nothing. → The spec requires exactly this (an unactionable error state is worse), and the
  in-memory user stays correct for the session. A quota-aware surface belongs with the backend.
- **The reveal's timing is tuned by feel and hard to regression-test.** → Playwright asserts the
  observable claims — one at a time, ascending rarity, five at the end — and the timings themselves
  are tokens, tunable without touching the tested behaviour.
- **The game still deals from `CARD_DB`, so a player's collection has no effect on a match.** The
  progression loop is visibly half-connected. → Deliberate and stated in the proposal's non-goals;
  this design leaves the `startGame()` seam untouched rather than partly rewired.

## Migration Plan

There is no existing persisted data anywhere, so there is nothing to migrate: version 1 is the first
shape written, and every browser is a first visit. Rollback is removing the change — the storage key
is left behind, and a reinstated version 1 reader would find its own data intact.

The one forward obligation this creates: a later change to the persisted shape must either bump
`version` and add a reader for the old one, or bump it and accept that existing players are reseeded.
The reader already treats an unrecognised version as unreadable, so the second option is the default
and is safe; it is just not free once players have collections worth keeping.

## Open Questions

- Should a card's quantity be capped, or duplicates be convertible into Geo or a rarer card? The
  multiset supports any of these without a shape change, so it can be decided once duplicates are
  actually annoying in practice.
- Which Geo amount the dev grant should credit. It affects nothing but how many clicks a tester needs;
  starting at 500 — one Level 3 pack — and adjusting is fine.
