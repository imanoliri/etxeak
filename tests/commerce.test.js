import test from "node:test";
import assert from "node:assert/strict";

import { STARTING_SCENARIOS } from "../src/scenarios.js";
import {
  getScenarioProducedResources,
  getTradeDistanceKm,
  getTransportFoodCost,
  tradeWithFamily
} from "../src/commerce.js";
import { createGame } from "../src/simulation.js";

test("trade partners only sell resources their assets produce", () => {
  const woodlandFamily = STARTING_SCENARIOS.find((scenario) => scenario.id === "oiarbide-aranburu");
  const produced = getScenarioProducedResources(woodlandFamily);
  assert.ok(produced.includes("wood"));
  assert.ok(produced.includes("livestock"));
  assert.ok(produced.includes("food"));
  assert.equal(produced.includes("stone"), false);
});

test("trade exchanges five resources for one and charges transport food", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const partner = STARTING_SCENARIOS[1];
  state.stores.stone = 20;
  state.stores.food = 20;
  const distanceKm = getTradeDistanceKm(state, partner);
  const transportCost = getTransportFoodCost(distanceKm);
  const beforeStone = state.stores.stone;
  const beforeWood = state.stores.wood;
  const beforeFood = state.stores.food;
  const result = tradeWithFamily(state, partner, "stone", "wood");
  assert.equal(result.ok, true);
  assert.equal(state.stores.stone, beforeStone - 5);
  assert.equal(state.stores.wood, beforeWood + 1);
  assert.equal(state.stores.food, beforeFood - transportCost);
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
  state.stores.food = 20;
  const surcharge = getTransportFoodCost(getTradeDistanceKm(state, partner));
  const result = tradeWithFamily(state, partner, "food", "wood");
  assert.equal(result.ok, true);
  assert.equal(state.stores.food, 20 - 5 - surcharge);
});
