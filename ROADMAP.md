# Roadmap

This document describes the intended development sequence for Etxeak. It is directional rather than a promise of dates or exact scope. Current implemented behavior remains authoritative in [FEATURES.md](FEATURES.md), while deferred ideas and alternatives live in [FUTURE.md](FUTURE.md).

## 1. MVP-0: One House

Complete and balance the playable household loop:

**family → people → occupations → seasonal work → production and consumption → construction → additional family etxeak → movement of family members**

The immediate goal is a coherent single-family simulation with deterministic tests, clear seasonal feedback, and explicit people, livestock, residences, productive assets, and projects.

## 2. Geographic land and construction layer

Replace provisional manually defined build zones with a deterministic campaign geography layer that can evaluate locations independently of the visual basemap.

This layer should progressively incorporate:

- elevation and slope;
- terrain and land-cover types;
- geology, mineral deposits, and quarryable stone;
- soils, fertility, and drainage;
- rivers, flood risk, coastline, routes, and settlement access;
- historical land use, ownership, customary rights, and other access restrictions.

Building and development rules should query these properties to decide what can be placed, how difficult construction is, and how productive the finished asset can be. Mines, quarries, fields, pastures, mills, ports, dwellings, roads, bridges, forests, and workshops should therefore have distinct geographic requirements rather than relying on one generic placement radius.

The UI should preview suitability with transparent map overlays and explain why a location is valid, invalid, expensive, or inefficient. Campaign geography and simulation rules remain authoritative; OpenStreetMap and OpenTopoMap tiles remain presentation only.

## 3. Fuller Urumea family world

Populate the region with independently simulated households and introduce kinship, marriage networks, migration, succession, inheritance, reciprocal labour, obligations, reputation, and a dynamic local economy.

## 4. Historical institutions and change

Add historically timed institutions, technologies, markets, obligations, conflicts, environmental pressures, and opportunities. These systems should change household choices rather than form a linear upgrade tree.

## 5. Additional regions and periods

Generalize campaign data and tools so the same simulation engine can support other Basque regions, historical periods, economic landscapes, and household structures without hard-coding Urumea-specific assumptions into the core.
