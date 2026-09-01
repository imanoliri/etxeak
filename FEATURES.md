# Features

This document describes the **current design baseline and intended feature set for the first Urumea MVP**. It is not a claim that every item is already implemented in code.

Ideas intentionally postponed beyond the MVP belong in [FUTURE.md](FUTURE.md).

## Core game loop

- One turn equals one **season**.
- Four seasonal turns form one year.
- Each season enables different activities and pressures.
- The player reviews the household, accepts or changes automatic labour decisions, makes important family/economic choices, then advances the season.
- The simulation resolves production, consumption, projects, demographic changes, social changes, and events.
- Winter closes with an annual summary.

## Seasonal activities

The MVP should distinguish at least:

- sowing/planting
- tending livestock and grazing
- harvest
- animal slaughter and food preservation
- woodland work
- construction and repairs
- winter consumption and maintenance

Activities may span more than one season and can be constrained by weather, labour, land, tools, and available resources.

## People

- Population consists of persistent individual people rather than an abstract population number.
- People are born, age, work, marry, migrate, form households, and die.
- Population therefore grows or declines organically.
- Children are represented in genealogy from birth.
- Children do not require routine player control.
- Work capacity increases with age rather than appearing at birth.
- Marriage/adulthood rules are period- and campaign-dependent.

## Household heads and family naming

- Each household has named adult heads.
- The heads are the principal named characters presented to the player.
- For the initial design, the household display name combines the heads' surnames, e.g. **Irizar Etxezarreta**.
- Naming rules must remain configurable so later historical periods are not forced into a modern naming convention.

## Genealogy

- Every person remains connected to parents, children, spouses, and household history.
- The game provides a genealogical/family-tree view.
- The tree records marriages, deaths, migrations, household splits, and new branches.
- People remain visible in family history after leaving the player's current residence.

## Households, dwellings, and estates

The game distinguishes:

- **household** — the social group living/working together;
- **dwelling/etxe** — the physical residence;
- **productive assets** — fields, livestock, woodland rights, mines, workshops, etc.;
- **later baserri** — only where historically appropriate.

A household can change residence without ceasing to exist, and a building can outlast several generations.

## Marriage and residence

Marriage can produce several outcomes:

- a spouse joins the husband's household;
- a spouse joins the wife's household;
- the couple establishes a new household;
- the couple moves into another available household where appropriate.

The simulation suggests a plausible default; the player may decide important cases.

## Household splitting and founding new houses

- Adult descendants can establish new households.
- New dwellings can be constructed.
- When a new house is founded, the player can decide which eligible people move there.
- Assets, livestock, stores, and inheritance can be divided rather than duplicated.
- New households become branches of the genealogy.

## Occupations

People can hold persistent occupations such as:

- farmer
- herder
- builder
- miner
- smith
- woodworker/forestry worker
- transporter
- other campaign-specific occupations

Occupation is different from a short seasonal task.

## Automatic labour

- Eligible people automatically choose sensible jobs/workplaces.
- Existing occupation, skill, household need, season, distance, and available work should influence assignment.
- People normally remain in an occupation until circumstances change.
- The player can override or lock important assignments.
- Children and people without sufficient work capacity cannot be assigned as normal adult workers.

## Productive assets

Places can contain productive assets requiring labour.

Examples:

- fields
- livestock groups
- pasture
- woodland
- mines
- forges/workshops
- mills
- later port facilities

Assets have capacity, labour demand, inputs, outputs, condition, and access/ownership.

## Construction and development

Construction is not instantaneous.

Projects can include:

- clearing or establishing farmland
- building/expanding a dwelling
- establishing a mine
- building a forge/workshop
- building a mill
- later infrastructure such as port facilities

Projects require labour and materials and progress over seasons or years.

## Migration

Family members can leave temporarily or permanently for:

- employment
- apprenticeship
- marriage
- service
- lack of land
- trade
- new household formation

Migrants remain part of the genealogy and can maintain links with their original household.

## Food and stores

The household produces, stores, and consumes physical resources.

The MVP should model enough food flow for seasonal decisions to matter:

- harvest enters stores;
- people consume food;
- livestock consumes/uses available resources as appropriate;
- slaughter converts animals into food/products;
- seed or breeding stock cannot simply be consumed without future consequences;
- winter shortages create meaningful risk.

## Succession and inheritance

- Household headship changes through death, retirement, or other eligible transitions.
- Property and rights pass to actual people/households.
- Inheritance may keep the estate together or contribute to household branching depending on campaign rules and decisions.
- The genealogy and historical ownership record persist across succession.

## Real geography

- Campaigns use real geographic settings.
- The Urumea campaign represents the river valley through named places, routes, resources, and land.
- Geography affects distance, work, migration, resource access, and future development.
- The MVP can use places/parcels and connections rather than requiring full cadastral or GIS-level simulation.

## Player role

The player manages the **house**, not every action of every person.

The player should normally intervene in:

- household priorities
- exceptional labour changes
- marriages
- migration
- inheritance
- construction
- acquisition or division of land/assets
- major social/economic choices

Routine work and ordinary life should continue automatically.

## First campaign: Urumea c. 1100

Initial target:

- one player household
- roughly 6–10 people
- neighboring households
- real Urumea geography at a useful gameplay abstraction
- basic fields, livestock, forest/pasture access
- seasonal production and consumption
- organic demography
- occupations and auto-assignment
- marriage and residence changes
- household splitting
- basic construction
- succession
- genealogy

The MVP succeeds if these systems can generate believable family stories across several generations without requiring scripted narratives.
