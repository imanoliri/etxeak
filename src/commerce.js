import { findNearestResidence, haversineKm } from "./simulation.js";

export const TRADE_DISTANCE_STEP_KM = 50;
export const TRADE_BATCH_MAX = 8;
export const RESOURCE_VALUES = Object.freeze({
  food: 1,
  wood: 2,
  stone: 3,
  livestock: 3
});
export const TRADEABLE_RESOURCES = Object.keys(RESOURCE_VALUES);

const RESOURCE_LABELS = {
  food: "Food",
  wood: "Wood",
  stone: "Stone",
  livestock: "Livestock"
};

const PRODUCED_BY_ASSET = {
  field: ["food"],
  forest: ["wood"],
  pasture: ["food", "livestock"],
  mine: ["stone"]
};

export function getResourceLabel(resource) {
  return RESOURCE_LABELS[resource] ?? resource;
}

export function getResourceValue(resource) {
  return RESOURCE_VALUES[resource] ?? null;
}

export function getScenarioProducedResources(scenario) {
  const produced = new Set();

  for (const asset of scenario?.assets ?? []) {
    for (const resource of PRODUCED_BY_ASSET[asset.type] ?? []) {
      if (RESOURCE_VALUES[resource]) produced.add(resource);
    }
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

export function getTradeYearsWithFamily(state, partnerScenarioId) {
  const years = state?.commerce?.tradeYearsByPartner?.[partnerScenarioId] ?? [];
  return new Set(years).size;
}

export function getTradeQuote(
  state,
  partnerScenario,
  giveResource,
  receiveResource,
  batchCount = 1
) {
  if (!state || !partnerScenario) {
    return { ok: false, message: "Trade partner unavailable." };
  }

  if (partnerScenario.id === state.scenarioId) {
    return { ok: false, message: "You cannot trade with your own family." };
  }

  const giveValue = getResourceValue(giveResource);
  const receiveValue = getResourceValue(receiveResource);
  if (!giveValue || !receiveValue) {
    return { ok: false, message: "That resource has no commerce value." };
  }

  if (giveResource === receiveResource) {
    return { ok: false, message: "Choose two different resources." };
  }

  const produced = getScenarioProducedResources(partnerScenario);
  if (!produced.includes(receiveResource)) {
    return {
      ok: false,
      message:
        partnerScenario.familyName +
        " does not produce " +
        getResourceLabel(receiveResource).toLowerCase() +
        "."
    };
  }

  const normalizedBatchCount = Number(batchCount);
  if (!Number.isInteger(normalizedBatchCount) || normalizedBatchCount < 1) {
    return { ok: false, message: "Choose a valid trade amount." };
  }

  const targetValue = receiveValue * normalizedBatchCount;
  const giveAmount = Math.ceil(targetValue / giveValue);
  const giveValuePaid = giveAmount * giveValue;
  const distanceKm = getTradeDistanceKm(state, partnerScenario);
  const transportFoodCost = getTransportFoodCost(distanceKm);
  const requiredFood = transportFoodCost + (giveResource === "food" ? giveAmount : 0);

  return {
    ok: true,
    targetValue,
    giveAmount,
    giveValue,
    giveValuePaid,
    receiveAmount: normalizedBatchCount,
    batchCount: normalizedBatchCount,
    receiveValue,
    distanceKm,
    transportFoodCost,
    requiredFood,
    overpayValue: giveValuePaid - targetValue
  };
}

export function tradeWithFamily(
  state,
  partnerScenario,
  giveResource,
  receiveResource,
  batchCount = 1
) {
  const quote = getTradeQuote(
    state,
    partnerScenario,
    giveResource,
    receiveResource,
    batchCount
  );
  if (!quote.ok) return quote;

  const giveAvailable = state.stores[giveResource] ?? 0;
  const foodAvailable = state.stores.food ?? 0;

  if (giveResource === "food") {
    if (foodAvailable < quote.requiredFood) {
      return {
        ok: false,
        message:
          "Need " +
          quote.requiredFood +
          " food: " +
          quote.giveAmount +
          " for the exchange and " +
          quote.transportFoodCost +
          " for transport."
      };
    }
  } else {
    if (giveAvailable < quote.giveAmount) {
      return {
        ok: false,
        message:
          "Need " +
          quote.giveAmount +
          " " +
          getResourceLabel(giveResource).toLowerCase() +
          " for this trade."
      };
    }
    if (foodAvailable < quote.transportFoodCost) {
      return {
        ok: false,
        message: "Need " + quote.transportFoodCost + " food for transport."
      };
    }
  }

  state.stores[giveResource] -= quote.giveAmount;
  state.stores.food -= quote.transportFoodCost;
  state.stores[receiveResource] =
    (state.stores[receiveResource] ?? 0) + quote.receiveAmount;

  recordTradeYear(state, partnerScenario.id);

  const roundedDistance = Math.round(quote.distanceKm * 10) / 10;
  const overpayText =
    quote.overpayValue > 0 ? " (" + quote.giveValuePaid + " value paid)" : "";

  const message =
    "Traded " +
    quote.giveAmount +
    " " +
    getResourceLabel(giveResource).toLowerCase() +
    overpayText +
    " for " +
    quote.receiveAmount +
    " " +
    getResourceLabel(receiveResource).toLowerCase() +
    " with " +
    partnerScenario.familyName +
    "; " +
    quote.transportFoodCost +
    " food spent on " +
    roundedDistance +
    " km of transport.";

  state.history.push({
    year: state.date.year,
    season: state.date.seasonIndex,
    text: message
  });

  return {
    ...quote,
    ok: true,
    message,
    giveResource,
    receiveResource
  };
}

function recordTradeYear(state, partnerScenarioId) {
  state.commerce ??= { tradeYearsByPartner: {} };
  state.commerce.tradeYearsByPartner ??= {};

  const years = state.commerce.tradeYearsByPartner[partnerScenarioId] ?? [];
  if (!years.includes(state.date.year)) years.push(state.date.year);
  state.commerce.tradeYearsByPartner[partnerScenarioId] = years;
}
