# Etxeak

**A generational historical strategy game where you guide a Basque house through centuries of social, political, cultural, technological, and economic change, shaping its family, land, kinship, and inheritance.**

## Concept

Etxeak is a historical strategy and simulation game about the long life of a Basque **etxe**: not only a physical house, but a household, estate, family identity, and continuity across generations.

The player does not rule a kingdom or conquer a map. The player guides a house and its descendants through changing historical conditions. Family members are born, grow up, marry, inherit, migrate, form new branches, and die. Land, rights, obligations, reputation, knowledge, relationships, and memories can outlive any individual person.

The central question is:

> **What does this house become as the world around it changes?**

## How the game plays

Time advances in **seasons**. Different parts of the household economy matter at different moments of the year: sowing, livestock work, construction, harvest, slaughter and preservation, winter consumption, and other campaign-specific activities.

At the start of a season the game presents the state of the household, its people, assets, stores, current work, relationships, and active projects. Routine labour is assigned automatically. The player intervenes where it matters: changing occupations, committing labour to a construction project, arranging a marriage, deciding who migrates, dividing property, founding a new household, or responding to an important historical event.

The season then resolves production, consumption, construction progress, demographic and social changes, and events. Four seasonal turns form a year, with an annual summary showing how the house has changed.

Over decades, children become workers and adults, people marry or leave, households split, new houses are founded, heads die, property is inherited, and the genealogy expands. Population growth is therefore **organic**, not an abstract settlement-growth statistic.

The player manages a house rather than micromanaging every person. Named household heads and other important adults are foregrounded, while children and ordinary members continue to live and work through the simulation unless the player needs to intervene.

## Core design pillars

### The house across generations

The persistent unit of play is the etxe. Its inhabitants change over time, but the house can accumulate land, buildings, rights, debts, livestock, tools, reputation, relationships, and history.

A social **household**, its physical **dwelling**, and its **productive assets** are separate things in the simulation. A household may move, a building may outlive its inhabitants, and an estate may contain fields, livestock, woodland rights, mines, workshops, or other resources.

### People and kinship

Family members are persistent individual people with age, roles, skills, relationships, and life histories. Marriage, descent, inheritance, alliances, migration, and branching households create a living kinship network.

Households have named adult heads. For the initial design, a household can be displayed using both heads' surnames, for example **Irizar Etxezarreta**, while historical naming rules remain configurable by period and campaign.

Children appear in the genealogy from birth but are not miniature adult workers. They gradually gain work capacity, become adults under period-appropriate rules, marry, migrate, inherit, or found new branches.

### Land and ecology

The game uses real geography. Rivers, valleys, forests, pastures, fields, routes, settlements, and access rights shape what a household can do. The landscape itself can change across generations.

### Seasonal life and labour

Food, livestock, planting, harvests, forestry, travel, construction, and household work follow a seasonal rhythm. Household labour is finite, so every choice has an opportunity cost.

People normally retain occupations over time. The game automatically assigns sensible work according to occupation, skill, season, household need, and available workplaces, while allowing the player to override important assignments.

### Production and construction

Productive assets require actual workers. Fields, herds, mines, forges, mills, woodland, and later port facilities do not generate output by themselves.

New farmland, dwellings, mines, workshops, and infrastructure are **projects** that consume labour and materials over seasons or years. Construction is never an instant purchase.

### Marriage, residence, and migration

Marriage is also a household decision. A spouse may join the husband's existing household, join the wife's household, or the couple may establish a new household depending on inheritance, resources, space, local practice, and opportunity.

Family members may also migrate temporarily or permanently for work, apprenticeship, marriage, service, trade, or lack of land. They remain part of the genealogy even after leaving the original household.

### Inheritance and succession

Property does not duplicate when someone dies or a household divides. Succession determines who receives land, rights, responsibilities, and the continuity of the house, while other relatives may marry out, migrate, enter institutions, or establish new branches.

### Historical change as pressure and opportunity

Political authority, religion, towns, trade, technologies, crops, institutions, wars, and social structures change around the player. They are not a linear upgrade path. The question is whether, when, and how a house adapts.

### Technology as adoption, not research

The household does not generate abstract research points. New tools, techniques, crops, institutions, and forms of knowledge spread through geography and social networks. Adoption depends on access, resources, relationships, and local usefulness.

### Culture as overlapping practice

There is no single Basque-versus-foreign culture slider. Language, religion, political allegiance, trade connections, clothing, architecture, customs, work, and social ties can change independently and coexist.

### Memory and legacy

The game should remember the history of people, places, and possessions: who acquired a field, who founded a branch, which marriage created an alliance, or why a household gained a particular right. The final result of a campaign is the history of the house rather than a single conventional victory score.

## What Etxeak is not

Etxeak is **not** a map-painting grand strategy game. Political borders matter because they affect households, but territorial conquest is not the main objective.

It is **not** primarily a warfare game. Feuds, raids, wars, and violence can matter, but people are family members, workers, heirs, and neighbours rather than disposable military units.

It does **not** use a conventional technology tree or a single modernization score. Historical change should create trade-offs rather than a simple progression from primitive to advanced.

It is **not** built around a single cultural binary. A household can remain deeply rooted in a Basque-speaking local community while also trading with outsiders, serving a king, adopting new techniques, or sending a child into a Latin-literate ecclesiastical network.

It is **not** a tile-placement city builder. The map represents real places, parcels, resources, routes, and institutions whose value can change over time.

## Campaign structure

Campaigns are grounded in real regions and historical periods. A campaign may span roughly **100–200 years**, using a mixed timescale: seasons and years for meaningful household decisions, with faster passage through quieter periods.

Different campaigns can explore different transformations of the historical Basque world while reusing the same generational simulation.

## MVP-0: One House

Before the full Urumea campaign, Etxeak starts with a deliberately smaller playable prototype: **MVP-0: One House**.

The map covers the chosen Urumea-region campaign area, but **only one family exists in the simulation at a time**. At the start of a game, the player chooses one of several predefined starting families. Each starting family has its own:

- name and household members;
- starting location;
- population and age structure;
- dwelling(s);
- fields, livestock, woodland, mines, workshops, or other starting assets;
- stored resources;
- occupations and available labour.

The unchosen families are alternative starting scenarios only. They do not appear as neighbours or AI-controlled households during MVP-0.

MVP-0 is about proving the household economy and expansion loop:

**choose family → assign/adjust work → advance seasons → produce/consume resources → build/develop assets → move family members → found additional etxeak → repeat**

Included in MVP-0:

1. **Seasonal turns** with different agricultural and productive activities.
2. **One simulated family/lineage** with persistent individual people.
3. **Organic aging and population change** within that family.
4. **Occupations and automatic labour assignment**, with player overrides.
5. **Resource production and consumption** from explicit assets.
6. **Construction and land-development projects** that take labour, materials, and time.
7. **Multiple player-controlled residences/etxeak** belonging to the same family.
8. **Moving family members between etxeak** and assigning them to work there.
9. **Real map locations** determining where buildings and productive assets exist.

Explicitly excluded from MVP-0:

- other simulated families;
- marriage with external families;
- diplomacy, reputation, favours, feuds, or social interaction;
- trade with neighbouring households;
- political or religious institutions;
- succession disputes and complex inheritance;
- autonomous cadet lineages;
- historical-event systems beyond what is required for the basic seasonal economy.

The purpose of MVP-0 is narrower than the eventual game: prove that **one family living, working, building, expanding, and redistributing its people across a real landscape is already a satisfying simulation**.

The fuller **Urumea MVP** comes later and adds other households, kinship between families, marriage, migration networks, inheritance, and social/historical interaction.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — simulation architecture and domain model
- [FEATURES.md](FEATURES.md) — first-MVP design baseline
- [FUTURE.md](FUTURE.md) — deliberately deferred ideas
- [AGENTS.md](AGENTS.md) — instructions for coding agents

## Long-term scope

Later systems can include social obligations, tithes and rents, reputation and status, churches and monasteries, towns, mills, ironworking, trade, powerful lineages, political change, new crops, education, migration, overseas networks, and other historical transformations.

Later campaigns can move to other Basque regions and periods while keeping the etxe, kinship, land, and generational legacy at the centre of play.
