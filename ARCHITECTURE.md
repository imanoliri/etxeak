# Architecture

## Purpose

Etxeak is a simulation-first generational strategy game. The software architecture should make household life, kinship, work, land, and historical change independently testable and reusable across campaigns.

The first campaign is **Urumea, c. 1100**, but the engine must not hard-code Urumea-specific rules into the simulation core.

## Architectural principles

1. **Discrete seasonal turns** — one simulation turn is one season; four seasons form a year.
2. **Deterministic simulation** — given the same initial state, player decisions, and random seed, the simulation should produce the same result.
3. **Simulation separate from UI** — game rules must run without rendering or browser state.
4. **Data-driven campaigns** — geography, starting households, seasonal calendars, occupations, assets, historical events, and balance values belong in content/configuration data rather than engine code where practical.
5. **People are persistent entities** — every person has a stable ID and genealogy even if the UI only foregrounds household heads and other important adults.
6. **Autonomy by default, intervention by exception** — ordinary labour and life progression should resolve automatically; the player can override important choices.
7. **No hidden duplication of property or population** — births, deaths, marriages, migration, inheritance, and construction must move or transform explicit state.
8. **Historical systems are contextual** — later crops, institutions, technologies, building types, and social structures should be enabled by campaign/date/location rather than universally available.

## Core simulation loop

Each seasonal turn resolves in explicit phases:

1. **Season opens**
   - Update available seasonal activities.
   - Surface urgent conditions, events, shortages, and opportunities.
2. **Planning**
   - Auto-assign eligible workers to occupations/workplaces.
   - Apply player overrides and locked assignments.
   - Choose or continue construction and land-development projects.
   - Resolve household-level decisions such as marriage, migration, or major purchases when available.
3. **Work and production**
   - Apply labour to fields, livestock, forestry, mines, workshops, construction, transport, and other productive assets.
   - Progress multi-season and multi-year projects.
4. **Consumption and storage**
   - Consume food and other household necessities.
   - Update stores, livestock, spoilage, slaughter, seed reserves, and similar seasonal resources.
5. **Social and demographic resolution**
   - Resolve births, deaths, aging milestones, marriages, departures, arrivals, and household formation when applicable.
6. **Events and consequences**
   - Resolve local, systemic, and historical events.
   - Update relationships, obligations, rights, reputation, and memories.
7. **Season summary**
   - Present material changes and notable family events.

At the end of winter, the game also produces an **annual household summary** and advances year-based processes.

## Domain model

### World

The top-level campaign state.

Suggested shape:

- current date: year + season
- deterministic random seed/state
- places and geography
- households
- people
- assets and projects
- relationships and rights
- historical/world state
- event log
- campaign ruleset

### Person

Every individual exists as a persistent entity, including children.

Core fields:

- stable ID
- given name and surname/name components
- sex
- birth/death dates
- biological/legal parents where known
- spouse/partner links
- household membership
- residence
- age/life stage
- occupation
- skills/aptitudes
- work capacity
- health/status as needed
- migration status
- inheritance links
- important memories/events

Children are simulated but should not require routine micromanagement. They gain work capacity gradually at historically plausible ages and become eligible for marriage/adult household roles according to period-appropriate campaign rules.

### Household

The main social-management unit.

A household contains:

- household ID
- current adult heads
- household display name, normally derived from the heads for the MVP
- members
- residence
- controlled or accessed assets
- stored resources
- obligations/debts
- rights
- household priorities
- reputation/relationships
- lineage/history references

For the initial design, a household may be displayed using the surnames of its two heads, e.g. **Irizar Etxezarreta**. Naming conventions must remain campaign-configurable rather than assumed universal across all centuries.

### Genealogy

Genealogy is derived from persistent Person relationships rather than maintained as a separate disconnected structure.

The genealogy view should be able to show:

- parents and children
- marriages/unions
- household membership over time
- departures and migrations
- founding of new households
- succession/inheritance
- deaths

### Residence / building

Code should distinguish the **social household** from the **physical building**.

Do not use one ambiguous object for both.

A residence/building may be:

- a dwelling/etxe
- later, where historically appropriate, a baserri/farmstead
- workshop
- forge
- mill
- mine structure
- port facility
- other campaign-specific structure

The recognizable later baserri should not be assumed to exist in the Urumea c. 1100 campaign.

### Place and land

The world uses real geography, but the MVP does not need a full GIS simulation.

A Place can represent:

- settlement
- house site
- field parcel
- pasture
- woodland
- river location
- ford/bridge
- mine/resource site
- market
- religious site
- port
- route node

Places can have coordinates and connections/distances. Access and control are modeled through ownership, customary rights, leases, kinship, obligations, or other campaign-specific mechanisms.

### Productive asset

Production happens through explicit assets rather than generic income.

Examples:

- field
- herd or pig group
- pasture access
- woodland
- mine
- forge
- mill
- fishing resource
- port facility

An asset defines:

- location
- capacity
- seasonal work requirements
- required occupations/skills
- inputs
- outputs
- condition
- access/ownership
- modifiers

### Occupation and work assignment

A person can have a persistent occupation such as farmer, herder, charcoal burner, miner, smith, builder, transporter, etc.

The simulation should:

1. retain an occupation until circumstances change;
2. automatically choose sensible work based on household needs, skills, season, available workplaces, distance, and existing occupation;
3. allow the player to override or lock an assignment;
4. prevent ineligible children or incapacitated people from being treated as full workers;
5. allow part-time/seasonal work where historically appropriate.

**Occupation** and **this season's task** should be separate concepts. A farmer can spend part of winter repairing a building without ceasing to be a farmer.

### Project

Construction and land development are projects with progress over time.

Examples:

- clear/create farmland
- build or expand a dwelling
- establish a mine
- build a forge
- construct a mill
- build port infrastructure

A project contains:

- site
- required labour
- required materials
- eligible seasons
- progress
- expected duration
- required skills/tools
- completion effects

Projects should take realistic numbers of seasons or years. They do not complete instantly when resources are clicked.

### Marriage and household formation

Marriage changes both kinship and residence.

Possible outcomes include:

- spouse joins the husband's existing household;
- spouse joins the wife's existing household;
- couple establishes a new household;
- couple moves into another established household where circumstances support it.

The simulation should choose a plausible default from inheritance, available space/resources, family needs, local practice, and opportunity. The player may intervene in important marriages.

### Migration

Migration can be temporary or permanent.

Reasons include:

- paid work
- apprenticeship/learning
- marriage
- service
- lack of land
- trade
- institutional/religious career
- founding a new household

A migrant remains part of the genealogy and can retain relationships, obligations, remittances, claims, or return possibilities.

### Succession and inheritance

Succession is a state transition, not a scripted cutscene.

When a household head dies, retires, or loses the role:

- determine eligible successors;
- transfer household headship;
- transfer or divide property according to campaign rules and player decisions;
- move non-inheriting members where appropriate;
- preserve all genealogy and historical ownership records;
- create new households/branches when necessary.

## Seasonal calendar

Campaigns define which activities are possible or important in each season.

The Urumea MVP should at minimum support distinct windows for:

- planting/sowing
- livestock care and grazing
- harvest
- slaughter and preservation
- woodland work
- construction
- winter consumption and maintenance

The calendar must be configuration, because agricultural timing and economic activities can differ by period, elevation, crop, and region.

## Demography

Population should emerge organically from people rather than from a settlement growth percentage.

Population changes through:

- births
- childhood survival
- aging
- marriage
- fertility
- death
- inward migration
- outward migration
- household splitting

Demographic rates should be historically calibrated later, but the architecture must support age-specific and context-sensitive probabilities rather than a single annual population-growth value.

## Historical change

The simulation core should expose mechanisms; campaign content determines when new opportunities or pressures appear.

Examples:

- new political authority
- church obligations
- market access
- a mill or road
- new crop
- improved forge technology
- war or feud
- institutional career
- migration network

Historical change modifies available actions and incentives rather than awarding abstract technology points.

## Recommended code boundaries

A later implementation should keep modules roughly separated as:

- `domain/` — entity types and invariants
- `simulation/` — seasonal resolution and rule systems
- `systems/` — demography, labour, production, marriage, inheritance, migration, construction
- `content/` — campaign data and historical configuration
- `state/` — serialization, save/load, migrations
- `ui/` — map, household, genealogy, planning, summaries
- `tests/` — deterministic simulation tests and scenario tests

Exact framework choices can be decided when implementation begins; the simulation layer should remain framework-independent.

## Save games and reproducibility

Save data should be versioned JSON and include:

- schema version
- campaign ID/version
- simulation date
- random seed/state
- world/entity state
- player decisions/overrides
- event/history log where needed

A fixed seed is important for debugging and for reproducible tests.

## MVP interfaces

The first playable version should eventually expose:

- **World/map view** — places, resources, households, and movement.
- **Household view** — heads, members, stores, assets, obligations, and current work.
- **Season planning view** — auto assignments plus player overrides and projects.
- **Genealogy view** — family tree and household branches.
- **Season/year summary** — production, consumption, births/deaths, migrations, marriages, and notable events.

## MVP boundary

The Urumea MVP proves this chain:

**season → labour → production/consumption → demographic/social change → household continuity**

If that chain produces believable multi-generational stories, later historical systems can be layered onto it without changing the fundamental architecture.
