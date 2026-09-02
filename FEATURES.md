# Features

This document defines the **current implementation target: MVP-0 — One House**.

Anything not listed here is outside the current implementation scope and belongs in [FUTURE.md](FUTURE.md).

## MVP-0 premise

The game uses the Urumea-region map, but only **one family is simulated**.

At game start, the player chooses one of several predefined families. Each option has different people, location, buildings/assets, occupations, and starting resources.

Only the chosen family exists during play. The other choices are alternative starting scenarios, not AI neighbours.

## Core loop

**Choose family → plan season → work/produce → consume → build/develop → move people → advance season**

One turn equals one season. Four seasons form a year.

## Seasonal economy

Different activities matter in different seasons, including:

- sowing/planting;
- tending livestock and grazing;
- harvest;
- animal slaughter/preservation;
- woodland work;
- construction and repairs;
- winter consumption/maintenance.

Assets only produce when they have the necessary workers, inputs, and seasonal conditions.

## Family and people

- Every family member is a persistent individual.
- People have names, sex, age, parent/child relationships, residence, occupation, and work capacity.
- Children age naturally and gain work capacity gradually.
- Population changes organically through births and deaths.
- A genealogy view represents the selected family.

MVP-0 does **not** require external spouses or marriage with other families.

## Starting families

Provide several selectable starting scenarios.

Each scenario defines:

- family name;
- starting people and ages;
- starting map location;
- initial etxe/dwelling;
- starting fields, animals, woodland/resource access, workshops, or other assets;
- starting stores;
- initial occupations.

The scenarios should encourage different economic openings without requiring different game rules.

## Etxeak and residences

- The family begins with at least one physical etxe/dwelling.
- The family may build additional etxeak.
- Family members can be moved between the family's etxeak.
- Each etxe has local residents, assets, stores/projects as appropriate.
- Building a new etxe does not create a new AI family.

## Occupations and work

- Eligible people have persistent occupations.
- The game automatically proposes/assigns sensible work.
- The player can override assignments.
- Occupation is distinct from the task performed this season.
- Children below the configured work age are not full workers.

Initial occupations may include:

- farmer;
- herder;
- builder;
- forestry worker;
- miner;
- smith;
- other roles required by enabled starting assets.

## Productive assets

MVP-0 can support explicit assets such as:

- fields;
- livestock groups;
- pasture;
- woodland;
- mines;
- workshops/forges;
- other assets enabled by the scenario.

Each asset has a location, labour need, inputs, outputs, capacity, and seasonal rules.

## Resources and stores

The family produces and consumes real resources rather than generic income.

At minimum, the simulation should support enough resource flow to make seasonal survival and expansion meaningful:

- food;
- seed/planting reserves where required;
- livestock;
- construction materials;
- outputs required by enabled productive assets.

## Construction and development

Projects consume labour, materials, and time.

Examples:

- clear/create farmland;
- build a new dwelling/etxe;
- expand a dwelling;
- establish a mine;
- build a workshop/forge;
- improve enabled productive assets.

Projects progress over seasons or years. They never complete instantly when purchased.

## Map

The first map prototype is implemented as a full-screen interactive topographic map.

- The MVP-0 playable viewport is approximately **42.88–43.48° N, 2.42–1.65° W**, matching the selected Gipuzkoa / adjoining northern Navarre region.
- The default presentation uses a topographic basemap, with OpenStreetMap available as an alternate layer.
- The map supports pan and zoom while keeping the player near the playable region.
- Starting families will occupy different real locations inside this region.
- Assets and buildings exist at concrete map coordinates.
- Distance/location may affect where people can work and where new etxeak/assets can be established.
- No neighbouring family simulation is required.
- The current map intentionally contains no family markers until the starting-family scenarios are defined.

## Explicit exclusions

MVP-0 has none of the following:

- simulated neighbouring families;
- diplomacy or reputation;
- favours or reciprocal labour;
- trade between families;
- external marriage;
- feuds or warfare;
- Church/lordship/political systems;
- complex inheritance disputes;
- autonomous cadet families;
- inter-family migration;
- historical technology diffusion;
- large historical event chains.

These are future systems.

## MVP-0 success criterion

The MVP succeeds if playing a single family is already interesting because the player must balance:

**people + seasonal labour + resources + construction + geographic expansion**

and can naturally grow from one etxe into several family-controlled etxeak.
