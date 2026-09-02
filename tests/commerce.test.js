import test from "node:test";
import assert from "node:assert/strict";

import { STARTING_SCENARIOS } from "../src/scenarios.js";
import {
  RESOURCE_VALUES,
  getScenarioProducedResources,
  getTradeDistanceKm,
  getTradeQuote,
  getTradeYearsWithFamily,
  getTransportFoodCost,
  tradeWithFamily
} from "../src/commerce.js";
import { advanceSeason, createGame } from "../src/simulation.js";

test("commerce uses the configured resource values", () => {
  assert.deepEqual(RESOURCE_VALUES, { food: 1, wood: 2, stone: 3 });
});

test("trade partners only sell valued resources their assets produce", () => {
  const woodlandFamily = STARTING_SCENARIOS.find(
    (scenario) => scenario.id === "oiarbide-aranburu"
  );
  const produced = getScenarioProducedResources(woodlandFamily);

  assert.ok(produced.includes("wood"));
  assert.ok(produced.includes("food"));
  assert.equal(produced.includes("stone"), false);
  assert.equal(produced.includes("livestock"), false);
});

test("5:1 commerce applies to value and rounds payment upward", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const partner = STARTING_SCENARIOS[1];
  state.stores.stone = 20;
  state.stores.food = 20;

  const quote = getTradeQuote(state, partner, "stone", "wood");
  assert.equal(quote.ok, true);
  assert.equal(quote.targetValue, 10);
  assert.equal(quote.giveAmount, 4);
  assert.equal(quote.giveValuePaid, 12);
  assert.equal(quote.overpayValue, 2);

  const beforeStone = state.stores.stone;
  const beforeWood = state.stores.wood;
  const beforeFood = state.stores.food;
  const result = tradeWithFamily(state, partner, "stone", "wood");

  assert.equal(result.ok, true);
  assert.equal(state.stores.stone, beforeStone - 4);
  assert.equal(state.stores.wood, beforeWood + 1);
  assert.equal(
    state.stores.food,
    beforeFood - getTransportFoodCost(getTradeDistanceKm(state, partner))
  );
});

test("transport costs one food per started 50 km", () => {
  assert.equal(getTransportFoodCost(0), 0);
  assert.equal(getTransportFoodCost(0.1), 1);
  assert.equal(getTransportFoodCost(50), 1);
  assert.equal(getTransportFoodCost(50.1), 2);
  assert.equal(getTransportFoodCost(100), 2);
});

test("trade fails when the partner does not produce the requested resource", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const partner = STARTING_SCENARIOS[1];
  state.stores.food = 100;
  state.stores.wood = 100;

  const before = structuredClone(state.stores);
  const result = tradeWithFamily(state, partner, "wood", "stone");

  assert.equal(result.ok, false);
  assert.deepEqual(state.stores, before);
});

test("food offered in trade also pays the distance surcharge", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const partner = STARTING_SCENARIOS[1];
  state.stores.food = 30;

  const surcharge = getTransportFoodCost(getTradeDistanceKm(state, partner));
  const result = tradeWithFamily(state, partner, "food", "wood");

  assert.equal(result.ok, true);
  assert.equal(state.stores.food, 30 - 10 - surcharge);
});

test("trade relationship counts distinct years, not number of trades", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const partner = STARTING_SCENARIOS[1];
  state.stores.food = 200;
  state.stores.stone = 200;

  assert.equal(tradeWithFamily(state, partner, "stone", "wood").ok, true);
  assert.equal(tradeWithFamily(state, partner, "stone", "wood").ok, true);
  assert.equal(getTradeYearsWithFamily(state, partner.id), 1);

  for (let i = 0; i < 4; i += 1) advanceSeason(state);
  state.stores.food = 200;
  state.stores.stone = 200;

  assert.equal(tradeWithFamily(state, partner, "stone", "wood").ok, true);
  assert.equal(getTradeYearsWithFamily(state, partner.id), 2);
});
