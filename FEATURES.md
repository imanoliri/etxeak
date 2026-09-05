# Features

This document defines the **current implementation target: MVP-0 — One House**.

Anything not listed here is outside the current implementation scope and belongs in [FUTURE.md](FUTURE.md).

## MVP-0 premise

The game uses the Urumea-region map, but only **one family is simulated**.

At game start, the player chooses one of several predefined families. Each option has different people, location, buildings/assets, occupations, and starting resources.

Only the chosen family is simulated during play. The other scenarios are not AI neighbours, but they can appear as **static commerce contacts** when Commerce mode is opened.

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
- family food consumption, food-shortage consequences, and autumn animal slaughter;
- explicit sheep records with age and sex, spring reproduction, yearly aging, age classes, and age-dependent slaughter yields;
- deterministic annual aging, simple births, and deaths;
- resource HUD and seasonal summaries;
- construction projects for new etxeak, fields, and rocky-terrain mines;
- a deterministic campaign geography layer exposing prototype terrain, elevation, slope, drainage, and historically sourced mineral-deposit data for every map coordinate;
- Builder labour progressing projects over multiple seasons, with automatic return to the worker's previous occupation when no projects remain;
- moving people between completed etxeak;
- value-based commerce with the unchosen family locations, including map zoom-out, production-limited exports, distance food costs, and trade-year relationship tracking;
- opening completed etxeak through a founding marriage: choose an eligible man, select the wife's family on the external-family map, pay the marriage value, then establish the couple as the etxe heads;
- deterministic simulation tests run by Netlify before deploy.

Still designed but not yet implemented in MVP-0:

- explicit per-person seasonal task assignment separate from occupation;
- local per-etxe stores rather than the current pooled family stores;
- additional building/asset types such as forges and workshops;
- deeper health, disease, and nutrition-state simulation beyond the current shortage-pressure model;
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
- animal reproduction, aging, and slaughter;
- woodland work;
- construction and repairs;
- winter consumption/maintenance.

Assets only produce when they have the necessary workers, inputs, and seasonal conditions.

## Livestock lifecycle

Livestock is no longer only an undifferentiated resource count. The current prototype models the household's sheep as explicit animal records while keeping the aggregate **Animals** number available to the existing HUD, commerce, and household-value systems.

Each living sheep has:

- a stable animal ID;
- sex;
- age in whole years;
- one derived life stage: **newborn**, **juvenile**, **adult**, or **old**.

Current prototype thresholds are:

- newborn: under 1 year;
- juvenile: at least 1 and under 2 years;
- adult: at least 2 and under 8 years;
- old: 8 years or older.

These thresholds are provisional gameplay values rather than a final historical/livestock model.

### Reproduction

- Reproduction is resolved in **Spring**.
- At least one pasture must actually receive Herder labour that spring.
- The flock must contain at least one breeding-age adult female and one breeding-age adult male.
- Each worked pasture can produce at most one lamb that spring, capped by the number of breeding-age females.
- New lambs begin at age 0 and receive a deterministic seeded sex assignment through the normal simulation RNG.
- A pasture no longer creates livestock through an unconditional abstract `+1`; new livestock arises through this breeding state.

### Aging

- All living sheep age by one year at the end of Winter.
- The simulation records notable transitions into breeding-age adulthood and old age in the season results/history.
- Age is therefore persistent across years and directly affects breeding eligibility and slaughter value.

### Slaughter

- Slaughter remains an explicit **Autumn** action.
- The simulation selects an older slaughterable animal first rather than deleting an anonymous livestock point.
- If the flock currently has a breeding-age male/female pair, ordinary slaughter protects that pair where possible.
- Newborn sheep are not slaughterable through this action.
- Prototype food yields are age-sensitive: juvenile = **3 food**, adult = **5 food**, old = **4 food**.
- These yields are provisional balance values and need historical calibration.

### Commerce and household payments

Because livestock is now explicit, giving livestock in commerce or as an etxe-founding marriage payment removes actual animal records. Receiving livestock through commerce creates explicit animals. The aggregate livestock total must always stay synchronized with the number of living animal records.

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
- A newly constructed etxe begins **unopened**. It cannot accept ordinary residence moves until a founding couple has opened it.
- Productive assets and construction projects can only be worked by eligible people whose current etxe is within **1.5 km** of that location.
- Each etxe's 1.5 km working radius is drawn on the map as a subtle dashed circle.
- New etxe construction must begin within the working radius of an existing etxe, allowing geographic expansion to proceed outward rather than teleporting construction labour across the map.
- The 8-person capacity and 1.5 km radius are MVP-0 balance values, not final historical claims.

## Opening a new etxe

A completed etxe is only a building until a household is established there.

1. Select the unopened etxe.
2. Choose a living **working-age man** from the player's family who is unmarried and is not already head of another etxe.
3. The map uses the same regional zoom-out as Commerce mode to show the other static family locations.
4. Select the family the wife will come from.
5. Pay the marriage value and open the etxe. The man moves there, the woman joins the player's genealogy, and both become heads of the etxe.

Marriage payment:

- base required value: **10**;
- subtract **1** for each distinct calendar year in which the player previously completed at least one trade with the selected family;
- minimum required value: **3**;
- food value = **1**;
- wood value = **2**;
- stone value = **3**;
- livestock value = **3**;
- payment is made with one chosen resource type in MVP-0;
- because resources are indivisible, payment rounds upward to the next whole resource when an exact value is impossible.

Etxe heads are tied to the etxe they head and cannot simply be moved to another residence through the ordinary move control. Opened head couples can produce children under the current simplified annual demography rules.

## Occupations and work

- Eligible people have persistent occupations.
- The game automatically proposes/assigns sensible work.
- The player can override assignments.
- Occupation is distinct from the task performed this season.
- Children below the configured work age are not full workers.
- When a player changes a worker from a normal occupation to **Builder**, the previous non-Builder occupation is remembered. Once no active construction projects remain, that Builder automatically returns to the remembered occupation (or a sensible nearby non-construction fallback if none is known).

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

If seasonal food is insufficient, the missing amount is recorded as a **food-shortage season** for that calendar year. Each shortage season raises age-sensitive annual mortality risk and reduces the prototype annual birth chance by 5 percentage points from 20%; four shortage seasons reduce it to zero. The yearly shortage counter resets after winter demography resolves.

## Commerce

- The Commerce action temporarily shows the unchosen starting-family locations on the map and automatically zooms out to include them.
- Those families are **static trade contacts only**; their population, stores, births, deaths, work, and decisions are not simulated.
- Each contact can sell only resources implied by its productive assets:
  - fields → food;
  - pasture → livestock and food;
  - forest → wood;
  - mine → stone.
- Resource values are **food = 1, wood = 2, stone = 3, livestock = 3**.
- Pasture-producing families can sell livestock as well as food.
- Barter uses **equal intrinsic value**: the total value of what the player receives is the target value to pay.
- The player chooses one valued resource type to pay with; payment is `ceil(target value / payment-resource value)`, so indivisible units always round against the player.
- Rounding is performed once for the **whole requested quantity**, not once per received unit.
- The commerce panel has separate **Give** and **Receive** resource selectors plus an **8-square amount selector**. Pressing square N selects N trade units; squares 1 through N fill with the color associated with the resource being given.
- Selecting an amount only prepares the exchange. Nothing moves until the player presses **Trade**, and the quote shows the resulting total payment, received amount, and transport cost before confirmation.
- Every trade also consumes **1 food per started 50 km** between that family and the player's nearest etxe. This transport food is a separate sunk cost and never contributes to barter value.
- A successful trade records that family as traded-with for the current calendar year; multiple trades in the same year still count as one relationship year for marriage discounts.
- Distance uses the same geographic coordinates as the map, but trade calculations are simulation/domain logic rather than Leaflet state.
- Static trade contacts have no finite stock in MVP-0. Dynamic inventories, prices, bargaining, markets, and autonomous trade belong to later systems.

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

All three current construction types query the campaign geography layer before resources are spent:

- etxeak require stable, drained ground with a manageable slope and cannot occupy an exposed deposit;
- fields require drained, gently sloped valley land;
- mines require rocky terrain within a historically documented mining district enabled for the campaign year;
- all projects must also be within the normal 1.5 km etxe work radius;
- placement shows a translucent green/red suitability grid, and hovering a cell reports its terrain, prototype elevation, slope, and rejection reason.

The implemented mine project is a provisional MVP-0 development option:

- it costs **10 wood and 10 stone** when started;
- it requires **10 Builder work** over one or more seasons;
- it must be placed on an exposed mineral deposit and within the normal **1.5 km etxe work radius**;
- completion creates a normal mine asset, which produces **2 stone per season** when reached by an available Miner.
- no starting etxe is within immediate working distance of a documented mine; reaching Arditurri or Irugurutzeta requires geographic expansion through additional etxeak.

Altitude is visible geographic context but not an independent mine rule: the documented mining district is authoritative because suitable geology matters more than a universal elevation threshold. Arditurri is high-confidence evidence for medieval iron extraction; Irugurutzeta is marked medium-confidence because the wider Aiako Harria district is documented as medieval but the exact phase represented by the modern site is less securely dated. Site coordinates and source URLs live with the campaign data. The radius around each documented point, generated terrain/elevation/slope/drainage, costs, labour requirement, and output remain prototype gameplay abstractions rather than reconstructed historical GIS data.

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
- a field that could not be sown in spring specifically because **no seed food was available** receives a visible **red warning ring** until the next spring sowing attempt; if no Farmer is available for field work, the field simply remains unworked and **no failure notification is shown**;
- every location worked during the completed season receives a visible **👤** worker marker (with a count when multiple workers were applied);
- the non-blocking season notification strip only shows **notable events and warnings**; routine production, consumption, sowing/tending/harvest, and construction-work progress are intentionally omitted because those outcomes are already represented by resource deltas and map activity markers.

Livestock births and age-stage transitions are notable lifecycle events and therefore remain visible in seasonal feedback/history.

The same feedback is used for manual and automatic season advancement.

## Explicit exclusions

MVP-0 has none of the following:

- simulated neighbouring families;
- diplomacy or reputation;
- favours or reciprocal labour;
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
