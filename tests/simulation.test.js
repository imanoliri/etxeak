import test from "node:test";
import assert from "node:assert/strict";

import { STARTING_SCENARIOS } from "../src/scenarios.js";
import {
  advanceSeason,
  annualBirthChance,
  annualDeathChance,
  chooseAutomaticOccupation,
  createGame,
  ETXE_CAPACITY,
  ETXE_WORK_RADIUS_KM,
  getCurrentSeason,
  getResidencePopulation,
  hasResidenceCapacity,
  isBuildTerrainEligible,
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

test("new etxe project completes closed and cannot accept residents until opened", () => {
  const state = createGame(STARTING_SCENARIOS[1]);
  const result = startProject(state, "etxe", [43.301, -1.855]);
  assert.equal(result.ok, true);

  for (let i = 0; i < 4 && state.residences.length === 1; i += 1) {
    advanceSeason(state);
  }

  assert.equal(state.residences.length, 2);
  const destination = state.residences[1];
  const adult = state.people.find(
    (person) =>
      person.age >= 12 &&
      person.alive &&
      !person.headOfResidenceId
  );
  assert.equal(destination.opened, false);
  assert.equal(movePerson(state, adult.id, destination.id), false);
});

test("field placement must be near an existing etxe", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const result = startProject(state, "field", [42.9, -2.35]);
  assert.equal(result.ok, false);
});

test("mine projects require rocky terrain and charge 10 wood and 10 stone", () => {
  const state = createGame(STARTING_SCENARIOS[1]);
  state.stores.wood = 20;
  state.stores.stone = 20;

  const result = startProject(state, "mine", [43.3042, -1.8535]);

  assert.equal(result.ok, true);
  assert.equal(result.project.workRequired, 10);
  assert.equal(state.stores.wood, 10);
  assert.equal(state.stores.stone, 10);
  assert.equal(isBuildTerrainEligible("mine", result.project.coords), true);
});

test("mine projects are rejected outside rocky terrain without charging resources", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  state.stores.wood = 20;
  state.stores.stone = 20;

  const result = startProject(state, "mine", [43.2641, -1.9748]);

  assert.equal(result.ok, false);
  assert.match(result.message, /rocky terrain/i);
  assert.equal(state.stores.wood, 20);
  assert.equal(state.stores.stone, 20);
});

test("completed mine projects create productive mine assets", () => {
  const state = createGame(STARTING_SCENARIOS[1]);
  state.stores.wood = 20;
  state.stores.stone = 20;
  const builder = state.people.find((person) => person.alive && person.age >= 12);
  setOccupation(state, builder.id, "Builder");

  const result = startProject(state, "mine", [43.3042, -1.8535]);
  assert.equal(result.ok, true);
  result.project.workRequired = 1;
  advanceSeason(state);

  assert.ok(state.assets.some((asset) => asset.type === "mine" && asset.coords[0] === 43.3042));
  assert.equal(state.projects.length, 0);
});

test("the Hernani family must expand before reaching mine terrain", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  state.stores.wood = 20;
  state.stores.stone = 20;

  const result = startProject(state, "mine", [43.245, -1.94]);

  assert.equal(result.ok, false);
  assert.match(result.message, /within 1.5 km/i);
  assert.equal(state.stores.wood, 20);
  assert.equal(state.stores.stone, 20);
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


test("etxe capacity blocks additional residents", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  assert.equal(state.residences[0].capacity, ETXE_CAPACITY);

  while (getResidencePopulation(state, "etxe-1") < ETXE_CAPACITY) {
    const id = `extra-${state.people.length}`;
    state.people.push({
      id,
      givenName: "Extra",
      surname: "Irizar",
      sex: "M",
      age: 20,
      role: "family",
      occupation: "Unassigned",
      alive: true,
      residenceId: "etxe-1"
    });
  }

  state.residences.push({
    id: "etxe-2",
    name: "Etxe 2",
    coords: [43.27, -1.97],
    foundedYear: 1100,
    capacity: ETXE_CAPACITY
  });
  const mover = state.people.find((person) => person.alive && person.residenceId === "etxe-2");
  if (!mover) {
    state.people.push({
      id: "mover",
      givenName: "Mover",
      surname: "Irizar",
      sex: "F",
      age: 20,
      role: "family",
      occupation: "Unassigned",
      alive: true,
      residenceId: "etxe-2"
    });
  }

  assert.equal(hasResidenceCapacity(state, "etxe-1"), false);
  assert.equal(movePerson(state, "mover", "etxe-1"), false);
});

test("a productive asset needs a worker living within the etxe work radius", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  state.residences.push({
    id: "etxe-far",
    name: "Far Etxe",
    coords: [43.40, -2.20],
    foundedYear: 1100,
    capacity: ETXE_CAPACITY
  });

  state.people
    .filter((person) => person.alive && person.age >= 12 && person.occupation === "Farmer")
    .forEach((person) => {
      person.residenceId = "etxe-far";
    });

  const field = state.assets.find((asset) => asset.type === "field");
  advanceSeason(state);

  assert.equal(field.state.sown, false);
  assert.equal(ETXE_WORK_RADIUS_KM, 1.5);
});

test("new etxe placement is limited to the work radius of an existing etxe", () => {
  const state = createGame(STARTING_SCENARIOS[1]);
  const result = startProject(state, "etxe", [42.9, -2.35]);
  assert.equal(result.ok, false);
});


test("builders return to their previous occupation when the last project finishes", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const worker = state.people.find(
    (person) => person.alive && person.age >= 12 && person.occupation === "Farmer" && !person.headOfResidenceId
  );
  assert.ok(worker);

  assert.equal(setOccupation(state, worker.id, "Builder"), true);
  assert.equal(worker.lastNonBuilderOccupation, "Farmer");

  const result = startProject(state, "field", [43.265, -1.973]);
  assert.equal(result.ok, true);
  result.project.workRequired = 1;

  advanceSeason(state);

  assert.equal(state.projects.length, 0);
  assert.equal(worker.occupation, "Farmer");
});

test("only seed shortages mark fields for the red sowing warning ring", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  state.stores.food = 0;

  advanceSeason(state);
  const failedFields = state.assets.filter(
    (asset) => asset.type === "field" && asset.state.sowingFailed
  );

  assert.ok(failedFields.length >= 1);
  assert.ok(
    failedFields.every((asset) => asset.state.sowingFailureReason === "no-seed")
  );
});

test("missing farmers do not produce field failure messages", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  state.people
    .filter((person) => person.alive && person.age >= 12 && person.occupation === "Farmer")
    .forEach((person) => {
      person.occupation = "Forestry";
    });

  const springSummary = advanceSeason(state);
  const fields = state.assets.filter((asset) => asset.type === "field");

  assert.ok(fields.every((asset) => asset.state.sowingFailed === false));
  assert.equal(
    springSummary.messages.some((message) => message.toLowerCase().includes("farmer")),
    false
  );
});

test("a sown field with no farmer in autumn fails silently", () => {
  const state = createGame(STARTING_SCENARIOS[0]);

  advanceSeason(state);
  state.people
    .filter((person) => person.alive && person.age >= 12 && person.occupation === "Farmer")
    .forEach((person) => {
      person.occupation = "Forestry";
    });

  advanceSeason(state);
  const autumnSummary = advanceSeason(state);

  assert.equal(
    autumnSummary.messages.some((message) => message.includes("harvest was lost")),
    false
  );
});

test("food shortages accumulate yearly hunger pressure", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  state.stores.food = 0;

  const summary = advanceSeason(state);

  assert.equal(state.foodSecurity.shortageSeasonsThisYear, 1);
  assert.ok(state.foodSecurity.shortageFoodThisYear > 0);
  assert.ok(summary.messages.some((message) => message.includes("mortality risk is higher")));
});

test("food shortages raise mortality risk and reduce birth chance", () => {
  assert.ok(annualDeathChance(30, 2) > annualDeathChance(30, 0));
  assert.ok(annualDeathChance(70, 2) > annualDeathChance(70, 0));
  assert.ok(annualBirthChance(2) < annualBirthChance(0));
  assert.equal(annualBirthChance(4), 0);
});
