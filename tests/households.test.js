import test from "node:test";
import assert from "node:assert/strict";

import { STARTING_SCENARIOS } from "../src/scenarios.js";
import {
  BASE_BRIDE_VALUE,
  MIN_BRIDE_VALUE,
  establishEtxeWithMarriage,
  getBridePaymentQuote,
  getBrideRequiredValue,
  getEligibleEtxeFounders
} from "../src/households.js";
import { createGame, ETXE_CAPACITY } from "../src/simulation.js";

function addClosedEtxe(state) {
  const residence = {
    id: "etxe-2",
    name: "Etxe 2",
    coords: [43.3, -1.855],
    foundedYear: state.date.year,
    opened: false,
    openedYear: null,
    headPersonIds: [],
    capacity: ETXE_CAPACITY
  };
  state.residences.push(residence);
  return residence;
}

test("eligible etxe founders are working-age unmarried men who are not already heads", () => {
  const state = createGame(STARTING_SCENARIOS[1]);
  const eligible = getEligibleEtxeFounders(state);

  assert.ok(eligible.length >= 1);
  assert.ok(
    eligible.every(
      (person) =>
        person.sex === "M" &&
        person.age >= 12 &&
        !person.spouseId &&
        !person.headOfResidenceId
    )
  );
  assert.equal(
    eligible.some((person) => person.role === "head"),
    false
  );
});

test("bride value starts at 10 and falls by one per distinct trade year to a minimum of 3", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const partnerId = STARTING_SCENARIOS[1].id;

  assert.equal(BASE_BRIDE_VALUE, 10);
  assert.equal(MIN_BRIDE_VALUE, 3);
  assert.equal(getBrideRequiredValue(state, partnerId), 10);

  state.commerce.tradeYearsByPartner[partnerId] = [1100, 1101, 1102];
  assert.equal(getBrideRequiredValue(state, partnerId), 7);

  state.commerce.tradeYearsByPartner[partnerId] = [
    1100, 1101, 1102, 1103, 1104, 1105, 1106, 1107, 1108, 1109
  ];
  assert.equal(getBrideRequiredValue(state, partnerId), 3);
});

test("marriage payment rounds up when a resource cannot match the exact value", () => {
  const state = createGame(STARTING_SCENARIOS[0]);
  const partnerId = STARTING_SCENARIOS[1].id;

  const quote = getBridePaymentQuote(state, partnerId, "stone");
  assert.equal(quote.requiredValue, 10);
  assert.equal(quote.amount, 4);
  assert.equal(quote.paidValue, 12);
  assert.equal(quote.overpayValue, 2);
});

test("opening a new etxe marries an eligible man to a woman from the selected family", () => {
  const state = createGame(STARTING_SCENARIOS[1]);
  const residence = addClosedEtxe(state);
  const founder = getEligibleEtxeFounders(state)[0];
  const partner = STARTING_SCENARIOS[0];
  state.stores.stone = 20;

  const beforeStone = state.stores.stone;
  const result = establishEtxeWithMarriage(
    state,
    residence.id,
    founder.id,
    partner,
    "stone"
  );

  assert.equal(result.ok, true);
  assert.equal(residence.opened, true);
  assert.deepEqual(residence.headPersonIds, [founder.id, result.woman.id]);
  assert.equal(founder.residenceId, residence.id);
  assert.equal(founder.headOfResidenceId, residence.id);
  assert.equal(founder.spouseId, result.woman.id);
  assert.equal(result.woman.spouseId, founder.id);
  assert.equal(result.woman.residenceId, residence.id);
  assert.equal(result.woman.originScenarioId, partner.id);
  assert.equal(state.stores.stone, beforeStone - 4);
  assert.equal(residence.name, founder.surname + " " + result.woman.surname);
});

test("an etxe head cannot be used to found another etxe", () => {
  const state = createGame(STARTING_SCENARIOS[1]);
  const first = addClosedEtxe(state);
  const founder = getEligibleEtxeFounders(state)[0];
  const partner = STARTING_SCENARIOS[0];
  state.stores.food = 100;

  assert.equal(
    establishEtxeWithMarriage(state, first.id, founder.id, partner, "food").ok,
    true
  );

  const second = {
    id: "etxe-3",
    name: "Etxe 3",
    coords: [43.302, -1.857],
    foundedYear: state.date.year,
    opened: false,
    openedYear: null,
    headPersonIds: [],
    capacity: ETXE_CAPACITY
  };
  state.residences.push(second);

  const result = establishEtxeWithMarriage(
    state,
    second.id,
    founder.id,
    STARTING_SCENARIOS[2],
    "food"
  );
  assert.equal(result.ok, false);
});
