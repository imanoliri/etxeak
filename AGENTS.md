# AGENTS.md

Instructions for coding agents working on Etxeak.

## Read before changing code

Before **every implementation task or behavioral change**, first inspect the current branch/repository state and read the current documentation before editing code.

Read in full:

1. `README.md`
2. `ARCHITECTURE.md`
3. `FEATURES.md`
4. `FUTURE.md`
5. `ROADMAP.md`
6. `AGENTS.md`
7. relevant source and test files

Do not rely on memory of an earlier version of these files: re-read them from the branch being changed. Do not infer current functionality from `FUTURE.md`.

If the requested change conflicts with the documented architecture or scope, resolve that explicitly before implementation rather than silently drifting the design.

## Document roles

- **README.md** — high-level game concept, design pillars, and project introduction.
- **ARCHITECTURE.md** — authoritative technical/domain architecture and simulation boundaries.
- **FEATURES.md** — current MVP design baseline and, once code exists, implemented/current-scope features.
- **FUTURE.md** — ideas intentionally deferred beyond current scope.
- **ROADMAP.md** — ordered development milestones and dependencies; it should link current work to deferred systems without redefining implemented behavior.
- **AGENTS.md** — repository working rules.

Keep the documentation synchronized with implementation throughout the task, not as a cleanup step at the end:

- update `FEATURES.md` whenever implemented/current-scope behavior changes;
- update `ARCHITECTURE.md` whenever rules, state, boundaries, or system responsibilities change;
- update `README.md` when player-visible behavior or the current playable slice materially changes;
- move genuinely deferred ideas to `FUTURE.md` rather than leaving them mixed into current scope;
- update `ROADMAP.md` when a requested feature changes the intended order or dependencies of future milestones;
- update `AGENTS.md` when a recurring development rule or repository workflow should apply to future agents.

Documentation and code for the same behavior belong in the same PR.

## Core design rules

- The primary unit of play is the **household/etxe across generations**, not a kingdom.
- One simulation turn is one **season**.
- Population must arise from persistent people: births, deaths, marriage, migration, and household splitting. Never fake household growth with a generic population-growth percentage.
- Every person needs a stable identity sufficient to preserve genealogy.
- Routine labour should be autonomous by default; the player overrides important decisions.
- Occupation and current seasonal task are separate concepts.
- Households, physical dwellings, and productive assets are separate domain entities.
- Assets and property must move through real transfers/inheritance; do not duplicate them during household splits.
- Construction and land development take labour, materials, and time.
- Historical technologies are adopted when available; there is no generic research-point tech tree.
- Do not introduce a single Basque-versus-Castilian culture slider or a single modernization score.
- The map represents real geography, but simulation detail should serve gameplay rather than require cadastral precision.
- Historical change should alter pressures/opportunities, not simply grant upgrades.

## Historical caution

Avoid anachronism.

In particular:

- do not automatically call an 11th-century rural dwelling a **baserri** in the later architectural sense;
- do not characterize the medieval Basque population generically as nomadic tribes;
- do not assume modern two-surname naming conventions are universally historical;
- do not assume one marriage-residence rule applies in every region and century;
- do not make later crops, institutions, technologies, ports, or industries available before campaign data enables them.

If a mechanic depends on a historical claim, prefer configurable rules and document the assumption. Where uncertainty matters to gameplay, research it before hard-coding it.

## Simulation architecture

Keep the simulation core independent of rendering/UI.

Prefer pure or easily testable transformations such as:

`nextState = advanceSeason(state, playerDecisions, rng)`

Use deterministic seeded randomness. Tests must be able to replay the same scenario exactly.

Keep campaign-specific data outside generic simulation modules wherever practical.

## State integrity

- Use stable IDs for people, households, places, assets, and projects.
- Preserve deceased/migrated people when genealogy/history needs them.
- Avoid storing contradictory duplicated state.
- Validate transfers of residence, household membership, property, and inheritance.
- Version save-game schemas when persistence is added.

## Testing expectations

For every simulation system, add deterministic tests for both normal and edge cases.

The repository uses Node's built-in test runner through `npm test`. Netlify runs the test suite before publishing a Deploy Preview, so a simulation-test failure must block the preview.

High-value scenario tests include:

- child ages into partial/full work eligibility;
- worker auto-assignment respects player lock;
- seasonal harvest changes stores;
- slaughter reduces herd and adds food;
- multi-season construction progresses but does not finish instantly;
- marriage moves a spouse without duplicating the person;
- couple forms a new household and receives only transferred assets;
- migrant remains in genealogy;
- death triggers succession without duplicating property;
- fixed seed + same decisions produces identical results.

## Scope discipline

Do not implement features from FUTURE.md unless explicitly requested.

The current implementation target is **MVP-0: One House**.

MVP-0 contains exactly one simulated family chosen from several predefined starting scenarios. Do not create AI neighbouring families merely because the map contains other places. Unchosen scenarios may appear only as static external contacts under the documented commerce and etxe-opening marriage rules.

Prioritize this coherent loop:

**family → people → occupations → seasonal work → production/consumption → construction → additional family etxeak → movement of family members**

For MVP-0 specifically:

- no diplomacy;
- no other-family relationships;
- no general/dynamic external marriage system; the only MVP-0 exception is the documented etxe-opening flow that sources a static wife from another scenario family;
- no simulated/dynamic family-to-family economy; the only allowed MVP-0 exception is the documented static value-based commerce system;
- no feuds;
- no political/religious interaction systems;
- no autonomous cadet families.

Resource-value rules are shared by commerce and etxe-opening marriage payments: **food = 1, wood = 2, stone = 3, livestock = 3**. Payment must round upward when indivisible units cannot exactly meet a required value. Commerce transport food is a separate sunk cost and does not contribute to barter value.

Keep the data model extensible enough for these later systems, but do not implement them prematurely.

Prefer a shallow but complete playable household economy over disconnected future systems.

## Workflow

- Verify the current branch and repository state before editing.
- **Documentation-first:** read the current documentation listed above before touching implementation.
- Use a dedicated feature branch for implementation work unless explicitly told otherwise.
- Keep each PR focused.
- **Implement and document together:** whenever behavior changes, update the relevant documentation in the same working pass rather than postponing documentation until the end.
- Add or update deterministic tests alongside simulation-rule changes.
- After implementation, re-check the relevant documentation against the resulting behavior and remove contradictions/stale statements.
- Before requesting review or merge, run available tests/build/lint and verify the Netlify Deploy Preview when configured.
- Do not merge unless explicitly requested.
- Keep `src/simulation.js` free of DOM and Leaflet dependencies.
- Treat values in the current starting scenarios as provisional balance content unless they have been historically researched and documented.
