# AGENTS.md

Instructions for coding agents working on Etxeak.

## Read before changing code

Before implementing a feature, read in full:

1. `README.md`
2. `ARCHITECTURE.md`
3. `FEATURES.md`
4. `FUTURE.md`
5. relevant source and test files

Do not infer current functionality from `FUTURE.md`.

## Document roles

- **README.md** — high-level game concept, design pillars, and project introduction.
- **ARCHITECTURE.md** — authoritative technical/domain architecture and simulation boundaries.
- **FEATURES.md** — current MVP design baseline and, once code exists, implemented/current-scope features.
- **FUTURE.md** — ideas intentionally deferred beyond current scope.
- **AGENTS.md** — repository working rules.

When implementation begins, keep FEATURES.md accurate: clearly distinguish designed-but-not-yet-implemented functionality from implemented functionality.

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

For the first Urumea MVP, prioritize the smallest coherent loop:

**people → kinship → land/assets → seasonal labour → production/consumption → marriage/migration → succession**

Prefer a shallow but complete playable loop over many disconnected systems.

## Workflow

- Verify the current branch and repository state before editing.
- Use a dedicated feature branch for implementation work unless explicitly told otherwise.
- Keep each PR focused.
- Update documentation in the same PR when architecture or visible behavior changes.
- Do not merge unless explicitly requested.
- Before requesting review, run available tests/build/lint and report failures accurately.
