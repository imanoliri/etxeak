import test from "node:test";
import assert from "node:assert/strict";

import { STARTING_SCENARIOS } from "../src/scenarios.js";
import {
  advanceSeason,
  createGame,
  getCurrentSeason,
  movePerson,
  setOccupation,
  startProject
} from "../src/simulation.js";

test("same scenario and decisions resolve deterministically", () => {
  const a = createGame(STARTING_SCENARIOS[0]);
  const b = createGame(STARTING_SCENARIOS[0]);

  for (let i = 0; i < 8; i += 1) {
    advanceSeason(a);
    advanceSeason(b);
  }

  assert.deepEqual(a, b);
});

test("spring farmers sow fields and consume seed", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const beforeFood = state.stores.food;

  advanceSeason(state);

  const sownFields = state.assets.filter(
    (asset) => asset.type === "field" && asset.state.sown
  );
  assert.ok(sownFields.length >= 1);
  assert.ok(state.stores.food < beforeFood);
  assert.equal(getCurrentSeason(state), "Summer");
});

test("occupation changes are rejected for children below work age", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const child = state.people.find((person) => person.age < 12);
  assert.equal(setOccupation(state, child.id, "Builder"), false);
});

test("new etxe project completes with builder work and accepts residents", () => {
  const state = createGame(STARTING_SCENARIOS[1]);
  const result = startProject(state, "etxe", [43.27, -1.89]);
  assert.equal(result.ok, true);

  for (let i = 0; i < 4 && state.residences.length === 1; i += 1) {
    advanceSeason(state);
  }

  assert.equal(state.residences.length, 2);
  const destination = state.residences[1];
  const adult = state.people.find((person) => person.age >= 12 && person.alive);
  assert.equal(movePerson(state, adult.id, destination.id), true);
  assert.equal(adult.residenceId, destination.id);
});

test("field placement must be near an existing etxe", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const result = startProject(state, "field", [42.9, -2.35]);
  assert.equal(result.ok, false);
});
