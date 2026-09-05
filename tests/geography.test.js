import test from "node:test";
import assert from "node:assert/strict";

import { evaluateBuildSite, getGeographyAt } from "../src/geography.js";

test("campaign geography resolves the same coordinate deterministically", () => {
  const coords = [43.2641, -1.9748];
  assert.deepEqual(getGeographyAt(coords), getGeographyAt(coords));
});

test("campaign geography exposes terrain, elevation, slope, and drainage", () => {
  const land = getGeographyAt([43.2641, -1.9748]);
  assert.equal(land.insideCampaign, true);
  assert.equal(typeof land.terrain, "string");
  assert.equal(Number.isFinite(land.elevationM), true);
  assert.equal(Number.isFinite(land.slopePercent), true);
  assert.ok(["wet", "drained"].includes(land.drainage));
});

test("a mine requires an explicit mineral deposit", () => {
  const deposit = evaluateBuildSite("mine", [43.2788083, -1.8077961]);
  const ordinaryLand = evaluateBuildSite("mine", [43.2641, -1.9748]);
  assert.equal(deposit.valid, true);
  assert.ok(deposit.geography.mineralDeposit);
  assert.equal(ordinaryLand.valid, false);
  assert.match(ordinaryLand.reason, /mineral deposit/i);
});

test("field and dwelling rules return explainable suitability", () => {
  const field = evaluateBuildSite("field", [43.265, -1.973]);
  const dwellingOnDeposit = evaluateBuildSite("etxe", [43.2788083, -1.8077961]);
  assert.equal(field.valid, true);
  assert.match(field.reason, /suitable/i);
  assert.equal(dwellingOnDeposit.valid, false);
  assert.match(dwellingOnDeposit.reason, /dwelling/i);
});

test("historical deposits are enabled only during their evidenced campaign period", () => {
  const coords = [43.2788083, -1.8077961];
  assert.equal(evaluateBuildSite("mine", coords, 1100).valid, true);
  assert.equal(evaluateBuildSite("mine", coords, 1700).valid, false);
});

test("coordinates outside the campaign are rejected explicitly", () => {
  const result = evaluateBuildSite("field", [42.5, -2.8]);
  assert.equal(result.valid, false);
  assert.match(result.reason, /outside the campaign/i);
});
