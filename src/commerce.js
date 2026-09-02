import { findNearestResidence, haversineKm } from "./simulation.js";

export const TRADE_RATIO = 5;
export const TRADE_DISTANCE_STEP_KM = 50;
export const TRADEABLE_RESOURCES = ["food", "wood", "stone", "livestock"];

const RESOURCE_LABELS = {
  food: "Food",
  wood: "Wood",
  stone: "Stone",
  livestock: "Animals"
};

const PRODUCED_BY_ASSET = {
  field: ["food"],
  forest: ["wood"],
  pasture: ["livestock", "food"],
  mine: ["stone"]
};

export function getResourceLabel(resource) {
  return RESOURCE_LABELS[resource] ?? resource;
}

export function getScenarioProducedResources(scenario) {
  const produced = new Set();
  for (const asset of scenario?.assets ?? []) {
    for (const resource of PRODUCED_BY_ASSET[asset.type] ?? []) produced.add(resource);
  }
  return TRADEABLE_RESOURCES.filter((resource) => produced.has(resource));
}

export function getTradeDistanceKm(state, partnerScenario) {
  if (!state || !partnerScenario?.center) return Infinity;
  const nearest = findNearestResidence(state, partnerScenario.center);
  return nearest
    ? nearest.distanceKm
    : haversineKm(state.residences?.[0]?.coords ?? partnerScenario.center, partnerScenario.center);
}

export function getTransportFoodCost(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return Infinity;
  return Math.ceil(distanceKm / TRADE_DISTANCE_STEP_KM);
}

export function tradeWithFamily(state, partnerScenario, giveResource, receiveResource) {
  if (!state || !partnerScenario) return { ok: false, message: "Trade partner unavailable." };
  if (partnerScenario.id === state.scenarioId) return { ok: false, message: "You cannot trade with your own family." };
  if (!TRADEABLE_RESOURCES.includes(giveResource) || !TRADEABLE_RESOURCES.includes(receiveResource)) {
    return { ok: false, message: "Unknown trade resource." };
  }
  if (giveResource === receiveResource) return { ok: false, message: "Choose two different resources." };

  const produced = getScenarioProducedResources(partnerScenario);
  if (!produced.includes(receiveResource)) {
    return {
      ok: false,
      message: partnerScenario.familyName + " does not produce " + getResourceLabel(receiveResource).toLowerCase() + "."
    };
  }

  const distanceKm = getTradeDistanceKm(state, partnerScenario);
  const transportFoodCost = getTransportFoodCost(distanceKm);
  const requiredGive = TRADE_RATIO;
  const giveAvailable = state.stores[giveResource] ?? 0;
  const foodAvailable = state.stores.food ?? 0;
  const requiredFood = transportFoodCost + (giveResource === "food" ? requiredGive : 0);

  if (giveResource === "food") {
    if (foodAvailable < requiredFood) {
      return {
        ok: false,
        message: "Need " + requiredFood + " food: " + requiredGive + " for the exchange and " + transportFoodCost + " for transport."
      };
    }
  } else {
    if (giveAvailable < requiredGive) {
      return {
        ok: false,
        message: "Need " + requiredGive + " " + getResourceLabel(giveResource).toLowerCase() + " for this trade."
      };
    }
    if (foodAvailable < transportFoodCost) {
      return { ok: false, message: "Need " + transportFoodCost + " food for transport." };
    }
  }

  state.stores[giveResource] -= requiredGive;
  state.stores.food -= transportFoodCost;
  state.stores[receiveResource] = (state.stores[receiveResource] ?? 0) + 1;

  const roundedDistance = Math.round(distanceKm * 10) / 10;
  const message =
    "Traded " + requiredGive + " " + getResourceLabel(giveResource).toLowerCase() +
    " for 1 " + getResourceLabel(receiveResource).toLowerCase() + " with " + partnerScenario.familyName +
    "; " + transportFoodCost + " food spent on " + roundedDistance + " km of transport.";

  state.history.push({ year: state.date.year, season: state.date.seasonIndex, text: message });

  return {
    ok: true,
    message,
    distanceKm,
    transportFoodCost,
    giveResource,
    receiveResource,
    giveAmount: requiredGive,
    receiveAmount: 1
  };
}
