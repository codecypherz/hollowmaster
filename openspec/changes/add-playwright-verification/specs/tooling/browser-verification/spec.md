## Purpose

Governs how this project answers questions that only a real browser can answer — layout, fit,
clipping, scrollbars, width-gated rendering, and motion — so that spec claims of that kind are
verified by one committed, re-runnable harness instead of a driver improvised per change, and so
that a verification run never disturbs a dev server the developer is already using.

## ADDED Requirements

### Requirement: Browser verification runs through the committed harness

All browser-driven verification of this project SHALL be performed with Playwright through the
repository's committed Playwright configuration. No other mechanism for driving a browser — a
hand-rolled DevTools-protocol driver, a directly launched browser binary, a headless-browser
script written for a single occasion — SHALL be used to verify this project's behavior. The
configuration SHALL be committed to the repository, so that any contributor or assistant runs the
same base URL, viewport, browser, and artifact policy without supplying them.

#### Scenario: A spec claim about rendering is verified

- **WHEN** a claim about how the application renders, lays out, fits, or animates must be verified
- **THEN** it is verified by a Playwright run against the committed configuration

#### Scenario: No bespoke browser driver is introduced

- **WHEN** browser verification is needed and the committed harness does not yet cover the case
- **THEN** the harness is extended
- **AND** no separate browser-driving script or protocol client is written alongside it

#### Scenario: The run needs no remembered invocation

- **WHEN** a contributor or assistant runs browser verification
- **THEN** a named script in the project runs the suite with no flags to recall
- **AND** the base URL, viewport, browser, and output location come from the committed
  configuration rather than the command line

#### Scenario: Verification is reproducible by someone else

- **WHEN** a verification result is reported
- **THEN** the run that produced it can be repeated by another party from the repository alone

### Requirement: A run adopts an already-running dev server

Before starting a dev server of its own, a verification run SHALL determine whether one is already
serving the configured base URL. Where one is, the run SHALL use that server and SHALL NOT start a
second one. The run SHALL NOT restart, reconfigure, or otherwise disturb a server it did not start,
and SHALL leave it running when the run ends.

#### Scenario: A developer's server is already running

- **WHEN** a verification run begins and a dev server is already serving the base URL
- **THEN** the run drives that server
- **AND** no additional dev server is started

#### Scenario: An adopted server survives the run

- **WHEN** a run that adopted an already-running server finishes, whether it passed or failed
- **THEN** that server is still running and still serving the base URL

#### Scenario: An adopted server is not restarted

- **WHEN** a run adopts an already-running server
- **THEN** the run does not stop, restart, or change the configuration of that server

### Requirement: A run cleans up the server it started

Where no dev server is serving the configured base URL, the verification run SHALL start one, wait
for it to become ready before driving it, and SHALL stop that server when the run ends — including
when the run fails, errors, or is interrupted. A verification run SHALL NOT leave behind a dev
server it started.

#### Scenario: No server is running

- **WHEN** a verification run begins and nothing is serving the base URL
- **THEN** the run starts a dev server
- **AND** waits for it to serve the base URL before driving the application

#### Scenario: A started server is torn down on success

- **WHEN** a run that started its own server completes with all checks passing
- **THEN** that server is stopped
- **AND** nothing is left listening on the base URL's port

#### Scenario: A started server is torn down on failure

- **WHEN** a run that started its own server ends because a check failed or the run errored
- **THEN** that server is still stopped

#### Scenario: Repeated runs do not accumulate servers

- **WHEN** verification is run several times in succession with no server running beforehand
- **THEN** each run starts and stops exactly one server
- **AND** no server from an earlier run is still listening when a later run begins

### Requirement: The durable suite covers the claims only a browser can settle

The repository SHALL carry a committed suite of browser checks covering the application behaviors
that cannot be observed outside a real browser. That suite SHALL at minimum cover: reaching the
in-game screen through the route guard's required path rather than by direct navigation; the
in-game arena's fit across a ladder of viewport sizes that includes at least one too small to host
the arena at the card renderer's minimum supported width; the absence of horizontal and vertical
scrolling at each size on that ladder; the card's width-gated ability section observed on both
sides of its threshold; and the application's behavior under a reduced-motion preference.

#### Scenario: The in-game screen is reached the way the guard requires

- **WHEN** the suite needs the in-game screen
- **THEN** it starts a match from the Battle screen and follows the transition to the in-game route
- **AND** does not depend on navigating to the in-game route directly

#### Scenario: The fit ladder includes a viewport too small for the arena

- **WHEN** the suite exercises the in-game screen across its viewport ladder
- **THEN** at least one viewport on the ladder is too small to host the arena at the card
  renderer's minimum supported width

#### Scenario: Scrolling is checked at every size on the ladder

- **WHEN** the in-game screen is rendered at each viewport on the ladder
- **THEN** the suite observes whether the page scrolls horizontally or vertically at that size

#### Scenario: The ability gate is observed on both sides

- **WHEN** the suite exercises the card renderer
- **THEN** it observes a card rendered below the ability section's width threshold and a card
  rendered at or above it

#### Scenario: Reduced motion is exercised

- **WHEN** the suite runs the reduced-motion pass
- **THEN** the application is loaded with a reduced-motion preference expressed by the browser

#### Scenario: The suite runs unattended

- **WHEN** the committed suite is run
- **THEN** it completes without requiring a person to interact with the browser

### Requirement: One-off verification reuses the same harness

A verification question too narrow or too short-lived to belong in the committed suite SHALL still
be answered through the committed configuration, so that it inherits the same server acquisition,
cleanup, base URL, and artifact behavior. Such a one-off check SHALL be written outside the
repository's tracked files and SHALL NOT be committed.

#### Scenario: A throwaway check is needed

- **WHEN** a question arises that does not warrant a permanent check
- **THEN** the throwaway check runs against the committed configuration
- **AND** the server is acquired and released by the same rules as a suite run

#### Scenario: Throwaway checks do not accumulate in the repository

- **WHEN** a one-off check has served its purpose
- **THEN** no trace of it remains in the repository's tracked files

#### Scenario: A recurring question is promoted

- **WHEN** the same one-off check is wanted a second time
- **THEN** it is added to the committed suite rather than rewritten

### Requirement: Screenshots are review artifacts, not baselines

Screenshots produced by a verification run SHALL exist to be looked at by a person. The project
SHALL NOT commit golden screenshots and SHALL NOT fail a run on pixel comparison against a stored
image. Run output — screenshots, reports, traces, and result metadata — SHALL be excluded from
version control.

#### Scenario: A screenshot is captured

- **WHEN** a verification run captures a screenshot
- **THEN** it is written to the run's output directory for review
- **AND** it is not compared against a stored reference image

#### Scenario: A design change does not break verification

- **WHEN** the application's appearance changes intentionally
- **THEN** no stored image needs updating for verification to pass

#### Scenario: Run output stays out of version control

- **WHEN** a verification run writes screenshots, a report, traces, or result metadata
- **THEN** none of it appears as an untracked-but-uncommitted addition to the repository
- **AND** none of it is committed

### Requirement: A failed check leaves enough evidence to diagnose it

When a browser check fails, the run SHALL retain evidence of the failure — at minimum an image of
the page as it stood — so that the failure can be investigated without reproducing it.

#### Scenario: A check fails

- **WHEN** a browser check fails during a run
- **THEN** the run retains an image of the page at the point of failure
- **AND** the retained evidence is written to the run's output directory

#### Scenario: Diagnosis does not require a re-run

- **WHEN** a failure is investigated after the run has ended
- **THEN** the retained evidence is sufficient to see what the page looked like when the check
  failed

### Requirement: Logic is tested outside the browser

Behavior that can be verified without rendering — game rules, services, guards, and model code —
SHALL continue to be tested in the project's unit test suite and SHALL NOT be moved into browser
checks. The browser suite SHALL be reserved for claims that depend on real rendering.

#### Scenario: A rule change is tested

- **WHEN** game rules, a service, a guard, or model code changes
- **THEN** the change is covered by the unit test suite

#### Scenario: The browser suite stays focused

- **WHEN** a check is proposed for the browser suite
- **THEN** it is included only if it depends on behavior a real browser provides that the unit test
  environment does not

### Requirement: The verification obligation is recorded in the project's instructions

The project's own contributor instructions SHALL state that browser verification goes through the
committed harness, SHALL state the server adoption and cleanup rules, and SHALL name the commands
that run it. This obligation SHALL live in the repository rather than depending on any individual's
or assistant's retained memory.

#### Scenario: A contributor or assistant arrives with no prior context

- **WHEN** someone reads the project's instructions for the first time
- **THEN** they learn that browser verification uses the committed harness
- **AND** they learn that an already-running dev server is adopted and that a started one is
  cleaned up
- **AND** they learn which commands run the suite

#### Scenario: The instruction does not depend on memory

- **WHEN** the practice is consulted
- **THEN** it is found in the repository's tracked instructions
- **AND** no external or personal memory store is required to know it
