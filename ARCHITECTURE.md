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

MVP-0 currently implements deterministic placeholder age-specific death rates and a simple annual birth chance for the two living household heads. These values exist only to exercise organic population change and are not yet historically calibrated.

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

## Current code boundaries

The MVP-0 implementation is deliberately lightweight and framework-free:

- `src/scenarios.js` — data-driven starting families, people, initial resources, and assets;
- `src/simulation.js` — deterministic seasonal economy, demography, food-shortage pressure, construction, occupation restoration, and movement;
- `src/commerce.js` — deterministic resource values, value-based trade quotes, partner production capability, geographic distance, transport cost, and distinct trade-year history;
- `src/households.js` — eligible etxe founders, marriage-value calculation, static wife candidates, resource payment, and opening a completed etxe with a founding couple;
- `src/map.js` — Leaflet-only rendering and map interaction;
- `src/ui.js` — DOM rendering for setup, family, build, resources, and summaries;
- `src/main.js` — application orchestration;
- `tests/` — deterministic simulation tests.

The simulation module does not import Leaflet or browser DOM APIs. Campaign/scenario data remains separate from simulation logic.

### Season-result presentation

`advanceSeason(state)` returns structured presentation metadata in addition to human-readable messages:

- `resourceDeltas` for the six HUD totals (food, wood, stone, livestock, people, etxeak);
- `activities` identifying map coordinates and worker counts for productive assets/projects worked during that season;
- the existing `messages` list for results that do not map cleanly to a single resource or location.

The UI renders this without altering simulation state: signed resource deltas in the top bar, 👤 activity markers on the map, and a compact non-blocking notification strip. The notification strip filters out routine economic messages (production, consumption, sowing/tending/harvest, and ordinary construction progress) because those are already visible through resource deltas and activity markers. It is reserved for notable events and warnings such as births, deaths, shortages, work-age transitions, and completed projects. Manual and automatic season passage use the same result object. The old blocking summary modal is no longer part of the normal season loop.

### Real-time season clock

MVP-0 uses a small real-time clock in `src/main.js` to invoke seasonal turns automatically. The default delay is **7 seconds per season**, configurable by the player from **1–300 seconds**, with pause/resume and manual advancement.

This timer is deliberately outside `src/simulation.js`. Wall-clock time is not part of deterministic game state: whether a season is advanced by the timer or by the manual button, the application calls the same `advanceSeason(state)` simulation transition. A manual advance temporarily suspends the timer while its season summary is open, then resumes it if autoplay was running.

As the project grows, these modules can split further into `domain/`, `systems/`, `content/`, `state/`, and `ui/` without changing the core rule that rendering is independent from simulation.

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

## MVP-0 architecture: One House

MVP-0 intentionally runs only **one family simulation**. The map may contain many usable locations, but there are no AI households or neighbouring-family agents.

### Starting scenarios

A starting scenario is data, not bespoke code. Each scenario defines:

- family/household identity and display name;
- starting people and genealogy;
- starting residence/location;
- starting assets and stores;
- occupations;
- initial construction/development options.

The player selects exactly one starting family when beginning a game. Other starting families are not instantiated.

### Builder occupation restoration

Builder is treated as a temporary assignment when it replaces another occupation.

- assigning a working person to Builder remembers their last non-Builder occupation;
- when the final active construction/land-development project completes, Builders automatically return to that remembered occupation;
- a Builder without remembered work falls back to a sensible nearby non-construction occupation;
- occupation restoration happens in simulation state, not UI state.

### Food shortages

MVP-0 tracks food shortages across the current calendar year.

- every season in which household food is insufficient increments yearly shortage pressure;
- at year end, each shortage season adds age-sensitive mortality risk;
- each shortage season reduces the annual household birth chance by 5 percentage points from the current 20% prototype baseline, reaching zero after four shortage seasons;
- after annual demography resolves, the yearly shortage counter resets;
- these are provisional gameplay rates, not final historical calibration.

### Failed sowing state

Fields use the `sowingFailed` warning state specifically when a spring sowing attempt fails because there is no seed food. A missing Farmer can still prevent sowing and produce a message, but it does not set the red-ring warning state. The map renders the red ring only for `sowingFailureReason: "no-seed"`; Leaflet is not the source of truth.

### Etxe capacity and spatial labour

MVP-0 gives every residence two explicit gameplay constraints:

- **capacity** — default 8 residents;
- **work radius** — 1.5 km.

Capacity is stored on each residence so later building types/upgrades can vary it. Birth creation and movement into a residence both check available capacity. The two household heads must also reside in the same etxe for the current simplified birth rule.

Labour availability is spatial rather than tied only to an asset's nominal owning residence. For each productive asset or construction project, the simulation selects the nearest unused worker with the required occupation whose residence is within the 1.5 km work radius. A person can therefore work an asset associated with another family etxe if their own etxe is close enough, while remote assets remain inactive.

The work radius is simulation data expressed in kilometres; Leaflet only visualizes it as a subtle circle. Map rendering must never become the source of truth for distance checks.

For MVP-0, new etxe projects must themselves be within 1.5 km of an existing etxe so construction can be physically reached. This makes expansion a sequence of inhabited/workable nodes.

Both values are provisional balance constants and should remain easy to configure.

### Static commerce contacts

MVP-0 still simulates exactly one family. The unchosen starting scenarios may, however, be projected onto the map as **static commerce contacts**.

Commerce is intentionally shallow:

- entering Commerce mode reveals the other scenario locations and fits the map to them;
- a contact's saleable resources are derived from its configured productive assets;
- valued resources are food = 1, wood = 2, stone = 3;
- barter uses equal intrinsic resource value: food = 1, wood = 2, stone = 3, livestock = 3;
- the total value of the requested received quantity is the target value;
- the player pays with whole units of one selected valued resource, using `ceil(target value / payment-resource value)`, so any indivisible mismatch is lost by the player;
- rounding is applied once to the whole requested trade, not separately per received unit;
- transport is outside the barter value and additionally consumes 1 food per started 50 km from the player's nearest etxe;
- successful trades record distinct calendar years per partner family;
- the contact has no simulated inventory, labour, demography, preferences, or price response.

The trade calculation lives in `src/commerce.js`, outside Leaflet/UI code. The map only displays partner locations and the UI only submits trade choices.

This is an explicit MVP-0 exception to the otherwise single-family world: other families exist as fixed external economic endpoints, not autonomous household simulations.

### Opening a completed etxe

Construction and household establishment are separate state transitions.

A completed new etxe is created with:

- `opened: false`;
- no head-person IDs;
- zero residents;
- normal physical capacity and coordinates.

Ordinary movement into that residence is blocked until it is opened.

To open it, `src/households.js` validates a founding man who is alive, working-age, unmarried, and not already an etxe head. The UI then reuses the external-family/commerce map zoom to select a static source family for a wife.

The wife payment uses the same resource-value system as commerce:

- base required value 10;
- -1 for each distinct year with at least one successful trade with that family;
- minimum required value 3;
- payment rounds upward to whole units of the chosen resource.

On success, the simulation deducts payment, moves the man into the residence, creates the incoming woman as a persistent person, links the spouses, records both head IDs on the residence, marks it opened, and renames it from the two heads' surnames. New opened head couples participate in the same per-residence birth logic as the original household.

### Controlled family and etxeak

MVP-0 has one controlled lineage/family that may occupy **multiple physical etxeak** over time.

This means:

- there is one family-level simulation context;
- there may be several household/residence groups belonging to that family;
- people can be moved between residences;
- each residence can have its own local assets and work;
- founding a new etxe does not create a competing AI faction.

For MVP-0, avoid introducing a generalized diplomacy/other-household framework unless required by later architecture boundaries.

### Simplified seasonal resolution

The current engine implements this resolution in `src/simulation.js`. Each turn resolves:

1. season opens;
2. persistent occupations generate suggested work assignments;
3. player may override assignments and choose construction/development;
4. production and project progress resolve;
5. consumption/storage resolve;
6. aging, births/deaths, and simple family changes resolve;
7. movement between the family's etxeak resolves;
8. season summary is shown.

No relationship, diplomacy, dynamic marriage negotiation, dynamic inter-family market, feud, or reputation phase exists in MVP-0. Fixed static commerce and the constrained wife-sourcing action used to open new etxeak are immediate player actions outside seasonal resolution.

### Map implementation

The first map shell uses **Leaflet** as a UI-only rendering layer. Simulation state must not depend on Leaflet objects.

The initial MVP-0 geographic viewport is approximately:

- south: **42.88° N**
- north: **43.48° N**
- west: **2.42° W**
- east: **1.65° W**

This is an intentionally simple bounding box matching the selected regional scope rather than a historical or administrative border. Simulation entities should store ordinary latitude/longitude coordinates so the rendering technology can be replaced later without changing domain state.

The initial UI offers:

- OpenTopoMap as the default terrain-oriented basemap;
- OpenStreetMap as an alternate layer;
- constrained panning around the selected region;
- responsive full-screen rendering for mobile and desktop.

External map tiles are presentation data only. Historical places, buildings, productive assets, family locations, paths, and other gameplay-relevant geography must live in repository-owned campaign data rather than being inferred from tile labels.

### MVP-0 interfaces

The first playable version needs only:

- **Start-family selection** — choose one predefined family/scenario.
- **Map view** — real geography, family etxeak, buildable/productive locations, and assets.
- **Family view** — named people, ages, genealogy, residence, occupation, and work status.
- **Etxe view** — residents, stores, buildings/assets, and current projects.
- **Season planning** — suggested labour plus player overrides.
- **Build/develop controls** — create/expand fields, dwellings, and other enabled assets.
- **Move people** — reassign eligible family members to another family etxe.
- **Season summary** — outputs, consumption, population changes, project progress.
- **Commerce mode** — reveal static external families, inspect distance/production, and execute value-based trades.
- **Open-etxe flow** — choose an eligible male founder, reuse the external-family zoom to choose a wife family, inspect discounted marriage value, pay, and establish the founding couple.

### MVP-0 success criterion

MVP-0 proves this chain:

**family → people → occupations → seasonal work → resources → construction → new etxe → redistribution of people**

If that loop is understandable and enjoyable with no other families present, the simulation is ready for the fuller Urumea MVP.

## Post-MVP-0 architecture

Later versions can activate the already-planned broader systems:

- multiple independent households;
- marriage between families;
- kinship networks;
- inheritance and succession;
- migration outside the controlled family;
- relationships, favours, obligations, reputation, and conflict;
- markets and institutions;
- historical change.

These must layer on top of the MVP-0 simulation rather than replacing its household economy.
