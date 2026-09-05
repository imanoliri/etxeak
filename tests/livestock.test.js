import test from "node:test";
import assert from "node:assert/strict";

import { STARTING_SCENARIOS } from "../src/scenarios.js";
import {
  advanceSeason,
  createGame,
  getAnimalAgeSummary,
  setOccupation,
  slaughterAnimal
} from "../src/simulation.js";
import { getLivingLivestock, getLivestockLifeStage } from "../src/livestock.js";
import { tradeWithFamily } from "../src/commerce.js";

test("starting livestock becomes explicit age-and-sex animal records", () => {
  const scenario = STARTING_SCENARIOS[0];
  const state = createGame(scenario);

  assert.equal(getLivingLivestock(state).length, scenario.stores.livestock);
  assert.equal(state.stores.livestock, scenario.stores.livestock);
  assert.ok(getLivingLivestock(state).every((animal) => Number.isInteger(animal.age)));
  assert.ok(getLivingLivestock(state).every((animal) => ["F", "M"].includes(animal.sex)));

  const summary = getAnimalAgeSummary(state);
  assert.equal(summary.total, scenario.stores.livestock);
  assert.ok(summary.adult > 0);
});

test("worked pasture with a breeding pair produces lambs in spring", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const before = state.stores.livestock;

  const summary = advanceSeason(state);

  assert.equal(state.stores.livestock, before + 1);
  assert.equal(getAnimalAgeSummary(state).newborn, 1);
  assert.ok(summary.messages.some((message) => message.includes("born in spring")));
});

test("spring reproduction requires active herding", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  state.people
    .filter((person) => person.alive && person.occupation === "Herder")
    .forEach((person) => setOccupation(state, person.id, "Forestry"));
  const before = state.stores.livestock;

  advanceSeason(state);

  assert.equal(state.stores.livestock, before);
  assert.equal(getAnimalAgeSummary(state).newborn, 0);
});

test("livestock ages once at the end of each year", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const animal = getLivingLivestock(state)[0];
  const beforeAge = animal.age;

  advanceSeason(state);
  advanceSeason(state);
  advanceSeason(state);
  const winterSummary = advanceSeason(state);

  assert.equal(animal.age, beforeAge + 1);
  assert.equal(state.date.year, 1101);
  assert.ok(
    winterSummary.messages.some(
      (message) => message.includes("matured into breeding-age adults") || message.includes("entered old age")
    )
  );
});

test("autumn slaughter removes a real animal and uses age-dependent yield", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  advanceSeason(state);
  advanceSeason(state);
  assert.equal(state.date.seasonIndex, 2);

  const beforeAnimals = state.stores.livestock;
  const beforeFood = state.stores.food;
  const result = slaughterAnimal(state);

  assert.equal(result.ok, true);
  assert.equal(state.stores.livestock, beforeAnimals - 1);
  assert.equal(state.stores.food, beforeFood + result.food);
  assert.ok(["juvenile", "adult", "old"].includes(getLivestockLifeStage(result.animal)));
  assert.ok(result.food >= 3 && result.food <= 5);
});

test("livestock trade removes and receives explicit animals", () => {
  const giver = createGame(STARTING_SCENARIOS[2]);
  giver.stores.food = 100;
  const partner = STARTING_SCENARIOS[0];
  const beforeGive = giver.stores.livestock;

  const sold = tradeWithFamily(giver, partner, "livestock", "food", 3);
  assert.equal(sold.ok, true);
  assert.equal(giver.stores.livestock, beforeGive - sold.giveAmount);
  assert.equal(getLivingLivestock(giver).length, giver.stores.livestock);

  const buyer = createGame(STARTING_SCENARIOS[0]);
  buyer.stores.food = 100;
  const beforeReceive = buyer.stores.livestock;
  const bought = tradeWithFamily(buyer, STARTING_SCENARIOS[2], "food", "livestock", 2);
  assert.equal(bought.ok, true);
  assert.equal(buyer.stores.livestock, beforeReceive + 2);
  assert.equal(getLivingLivestock(buyer).length, buyer.stores.livestock);
});
