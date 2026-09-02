# Features

This document defines the **current implementation target: MVP-0 — One House**.

Anything not listed here is outside the current implementation scope and belongs in [FUTURE.md](FUTURE.md).

## MVP-0 premise

The game uses the Urumea-region map, but only **one family is simulated**.

At game start, the player chooses one of several predefined families. Each option has different people, location, buildings/assets, occupations, and starting resources.

Only the chosen family exists during play. The other choices are alternative starting scenarios, not AI neighbours.

## Implementation status

Implemented on the current MVP-0 branch:

- four data-driven starting-family scenarios;
- interactive topographic/OSM map with scenario, etxe, asset, and project markers;
- persistent individual people, parent/spouse links, and working-age restrictions;
- a simple graphical family-tree view;
- automatic occupation choice when a person becomes working-age, plus player occupation overrides;
- automatic occupation-to-asset labour allocation;
- seasonal field cycle: spring sowing, summer tending, autumn harvest;
- pasture, forestry, and mining production;
- family food consumption and autumn animal slaughter;
- deterministic annual aging, simple births, and deaths;
- resource HUD and seasonal summaries;
- construction projects for new etxeak and fields;
- Builder labour progressing projects over multiple seasons;
- moving people between completed etxeak;
- deterministic simulation tests run by Netlify before deploy.

Still designed but not yet implemented in MVP-0:

- explicit per-person seasonal task assignment separate from occupation;
- local per-etxe stores rather than the current pooled family stores;
- additional building/asset types such as forges and workshops;
- deeper starvation/health consequences;
- save/load persistence.

## Core loop

**Choose family → plan season → work/produce → consume → build/develop → move people → advance season**

One turn equals one season. Four seasons form a year.

The optional season timer can advance automatically. Automatic passage must show the **same complete season summary and notifications** as pressing **Next season**; the timer pauses while the summary is open and resumes after the player continues.

By default, the UI automatically advances one season every **7 seconds**. The player can change the delay from **1–300 seconds**, pause/resume automatic progression, or use the manual **Next season** action. The wall-clock timer is only UI orchestration: every transition still calls the same deterministic seasonal simulation step.

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

## Etxe capacity and work radius

- Each etxe has a finite population capacity. MVP-0 currently uses **8 residents per etxe** as a provisional gameplay value.
- The map shows **current residents / maximum capacity** directly on each etxe marker.
- The etxe panel shows the same occupancy, available space, and work radius.
- A full etxe cannot accept additional residents and does not generate new births until space becomes available.
- Productive assets and construction projects can only be worked by eligible people whose current etxe is within **1 km** of that location.
- Each etxe's 1 km working radius is drawn on the map as a subtle dashed circle.
- New etxe construction must begin within the working radius of an existing etxe, allowing geographic expansion to proceed outward rather than teleporting construction labour across the map.
- The 8-person capacity and 1 km radius are MVP-0 balance values, not final historical claims.

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
- Starting scenarios are now defined and shown as selectable map locations before play.
- After selection, only the chosen family's etxe, assets, and projects are rendered.

## Direct seasonal feedback

When a season resolves, its results are shown directly in the main game UI rather than requiring a blocking summary modal:

- every resource type in the top bar has an emoji;
- resource changes appear as signed deltas such as **+9** or **-4** beside the current total;
- map locations use compact **color-coded pictograms** rather than emoji overlays; fields use a wheat pictogram and pastures use a sheep pictogram;
- every location worked during the completed season receives a visible **👤** worker marker (with a count when multiple workers were applied);
- the non-blocking season notification strip only shows **notable events and warnings**; routine production, consumption, sowing/tending/harvest, and construction-work progress are intentionally omitted because those outcomes are already represented by resource deltas and map activity markers.

The same feedback is used for manual and automatic season advancement.

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


## UI principles

- The map is the primary surface; HUD elements should occupy as little screen area as practical.
- Family identity and season/timer controls use compact top HUD elements.
- Resources use a single compact row rather than a tall panel.
- Zoom and map-layer controls live together on the right edge.
- Map entities use small pictographic markers rather than unexplained letter codes.
- Family and Build are secondary actions; **Next season** remains the primary bottom action.
- Selecting an etxe or productive asset opens contextual detail rather than permanently occupying map space.
- The basemap is visually softened so terrain and gameplay markers remain more prominent than modern map detail.
