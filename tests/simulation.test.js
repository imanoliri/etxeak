import test from "node:test";
import assert from "node:assert/strict";

import { STARTING_SCENARIOS } from "../src/scenarios.js";
import {
  advanceSeason,
  chooseAutomaticOccupation,
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


test("starting family records genealogy links", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const heads = state.people.filter((person) => person.role === "head");
  const children = state.people.filter((person) => person.role === "child");

  assert.equal(heads.length, 2);
  assert.equal(heads[0].spouseId, heads[1].id);
  assert.equal(heads[1].spouseId, heads[0].id);
  assert.ok(children.every((child) => child.parentIds?.length === 2));
});

test("working-age unassigned people receive a sensible automatic occupation", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const child = state.people.find((person) => person.age < 12 && person.occupation === "Unassigned");
  child.age = 12;

  const occupation = chooseAutomaticOccupation(state, child);
  assert.notEqual(occupation, "Unassigned");
  assert.ok(["Farmer", "Herder", "Forestry", "Miner", "Builder"].includes(occupation));
});


test("season summary exposes resource deltas for the HUD", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const before = state.stores.food;

  const summary = advanceSeason(state);

  assert.equal(summary.season, "Spring");
  assert.equal(summary.resourceDeltas.food, state.stores.food - before);
  assert.equal(summary.resourceDeltas.people, 0);
  assert.equal(summary.resourceDeltas.etxeak, 0);
});

test("season summary records worked map locations", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const summary = advanceSeason(state);

  assert.ok(summary.activities.length > 0);
  assert.ok(summary.activities.every((activity) => Array.isArray(activity.coords)));
  assert.ok(summary.activities.every((activity) => activity.workers >= 1));
  assert.ok(summary.activities.some((activity) => activity.targetType === "asset"));
});
