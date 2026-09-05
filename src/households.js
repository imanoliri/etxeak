import {
  WORK_AGE,
  canWork,
  chooseAutomaticOccupation,
  getLivingPeople
} from "./simulation.js";
import {
  RESOURCE_VALUES,
  TRADEABLE_RESOURCES,
  getResourceLabel,
  getResourceValue,
  getTradeYearsWithFamily
} from "./commerce.js";
import { ensureLivestockState, removeLivestock } from "./livestock.js";

export const BASE_BRIDE_VALUE = 10;
export const MIN_BRIDE_VALUE = 3;

const DEFAULT_BRIDE_NAMES = ["Toda", "Oneka", "Maria", "Sancha", "Urraka", "Elbira"];

export function getEligibleEtxeFounders(state) {
  return getLivingPeople(state).filter((person) => {
    return (
      person.sex === "M" &&
      person.age >= WORK_AGE &&
      canWork(person) &&
      !person.headOfResidenceId &&
      !person.spouseId
    );
  });
}

export function getBrideRequiredValue(state, partnerScenarioId) {
  const tradeYears = getTradeYearsWithFamily(state, partnerScenarioId);
  return Math.max(MIN_BRIDE_VALUE, BASE_BRIDE_VALUE - tradeYears);
}

export function getBridePaymentQuote(state, partnerScenarioId, paymentResource) {
  ensureLivestockState(state);
  const resourceValue = getResourceValue(paymentResource);
  if (!resourceValue) {
    return { ok: false, message: "That resource has no household value." };
  }

  const requiredValue = getBrideRequiredValue(state, partnerScenarioId);
  const amount = Math.ceil(requiredValue / resourceValue);
  const paidValue = amount * resourceValue;

  return {
    ok: true,
    requiredValue,
    paymentResource,
    resourceValue,
    amount,
    paidValue,
    overpayValue: paidValue - requiredValue,
    affordable: (state.stores[paymentResource] ?? 0) >= amount
  };
}

export function getMarriageCandidate(state, partnerScenario) {
  if (!partnerScenario) return null;

  const existingFromFamily = getLivingPeople(state).filter(
    (person) => person.originScenarioId === partnerScenario.id
  ).length;
  const names =
    Array.isArray(partnerScenario.marriageNames) && partnerScenario.marriageNames.length
      ? partnerScenario.marriageNames
      : DEFAULT_BRIDE_NAMES;
  const givenName = names[existingFromFamily % names.length];

  const surname =
    partnerScenario.people.find((person) => person.sex === "M" && person.role === "head")?.surname ??
    partnerScenario.people[0]?.surname ??
    partnerScenario.familyName.split(" ")[0];

  return {
    givenName,
    surname,
    age: 18 + (existingFromFamily % 4),
    originScenarioId: partnerScenario.id
  };
}

export function establishEtxeWithMarriage(
  state,
  residenceId,
  manId,
  partnerScenario,
  paymentResource
) {
  const residence = state.residences.find((entry) => entry.id === residenceId);
  if (!residence) return { ok: false, message: "Etxe not found." };
  if (residence.opened) return { ok: false, message: "That etxe is already open." };

  const man = getLivingPeople(state).find((person) => person.id === manId);
  if (!man) return { ok: false, message: "Selected man not found." };
  if (
    man.sex !== "M" ||
    !canWork(man) ||
    man.headOfResidenceId ||
    man.spouseId
  ) {
    return {
      ok: false,
      message: "Choose a working-age unmarried man who is not already head of an etxe."
    };
  }

  if (!partnerScenario || partnerScenario.id === state.scenarioId) {
    return { ok: false, message: "Choose another family for the marriage." };
  }

  const quote = getBridePaymentQuote(state, partnerScenario.id, paymentResource);
  if (!quote.ok) return quote;
  if (!quote.affordable) {
    return {
      ok: false,
      message:
        "Need " +
        quote.amount +
        " " +
        getResourceLabel(paymentResource).toLowerCase() +
        " to meet the required value of " +
        quote.requiredValue +
        "."
    };
  }

  const bride = getMarriageCandidate(state, partnerScenario);
  if (!bride) return { ok: false, message: "No marriage candidate available." };

  if (paymentResource === "livestock") {
    const removed = removeLivestock(state, quote.amount);
    if (removed.length !== quote.amount) {
      return { ok: false, message: "Not enough livestock to make the marriage payment." };
    }
  } else {
    state.stores[paymentResource] -= quote.amount;
  }

  man.residenceId = residence.id;
  man.headOfResidenceId = residence.id;

  const woman = {
    id: "p" + state.counters.person++,
    givenName: bride.givenName,
    surname: bride.surname,
    sex: "F",
    age: bride.age,
    role: "family",
    occupation: "Unassigned",
    alive: true,
    residenceId: residence.id,
    headOfResidenceId: residence.id,
    spouseId: man.id,
    originScenarioId: partnerScenario.id
  };

  man.spouseId = woman.id;
  state.people.push(woman);
  woman.occupation = chooseAutomaticOccupation(state, woman);

  residence.opened = true;
  residence.openedYear = state.date.year;
  residence.headPersonIds = [man.id, woman.id];
  residence.originMarriageScenarioId = partnerScenario.id;
  residence.name = man.surname + " " + woman.surname;

  const overpayText =
    quote.overpayValue > 0
      ? " " + quote.paidValue + " value was paid because the exact value could not be matched."
      : "";

  const message =
    residence.name +
    " opened with " +
    man.givenName +
    " " +
    man.surname +
    " and " +
    woman.givenName +
    " " +
    woman.surname +
    ". Paid " +
    quote.amount +
    " " +
    getResourceLabel(paymentResource).toLowerCase() +
    " for a required marriage value of " +
    quote.requiredValue +
    "." +
    overpayText;

  state.history.push({
    year: state.date.year,
    season: state.date.seasonIndex,
    text: message
  });

  return {
    ok: true,
    message,
    residence,
    man,
    woman,
    quote
  };
}

export function getMarriagePaymentResources() {
  return TRADEABLE_RESOURCES.filter((resource) => RESOURCE_VALUES[resource]);
}
