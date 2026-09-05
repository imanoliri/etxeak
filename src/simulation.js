import { OCCUPATIONS } from "./scenarios.js";
import { evaluateBuildSite } from "./geography.js";
import {
  addNewbornLivestock,
  ageLivestockOneYear,
  ensureLivestockState,
  getLivestockLifeStage,
  getLivestockSummary,
  getSlaughterFoodYield,
  hasBreedingPair,
  removeLivestock
} from "./livestock.js";

export const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];
export const WORK_AGE = 12;
export const ETXE_CAPACITY = 8;
export const ETXE_WORK_RADIUS_KM = 1.5;

export const BUILD_TYPES = {
  etxe: {
    label: "New etxe",
    cost: { wood: 8, stone: 4 },
    workRequired: 4,
    placement: "near-etxe",
    maxDistanceKm: ETXE_WORK_RADIUS_KM,
    resultType: "etxe"
  },
  field: {
    label: "Clear field",
    cost: { wood: 3 },
    workRequired: 3,
    placement: "near-etxe",
    maxDistanceKm: ETXE_WORK_RADIUS_KM,
    resultType: "field"
  },
  mine: {
    label: "Establish mine",
    cost: { wood: 10, stone: 10 },
    workRequired: 10,
    placement: "near-etxe",
    maxDistanceKm: ETXE_WORK_RADIUS_KM,
    resultType: "mine"
  }
};

const BABY_NAMES = ["Eneko", "Toda", "Gartzea", "Oneka", "Lope", "Maria", "Martin", "Sancha"];

const clone = (value) => JSON.parse(JSON.stringify(value));

export function createGame(scenario) {
  const state = {
    version: 4,
    scenarioId: scenario.id,
    familyName: scenario.familyName,
    placeName: scenario.placeName,
    date: { year: 1100, seasonIndex: 0 },
    rngState: scenario.seed >>> 0,
    stores: clone(scenario.stores),
    commerce: { tradeYearsByPartner: {} },
    foodSecurity: { shortageSeasonsThisYear: 0, shortageFoodThisYear: 0 },
    people: clone(scenario.people),
    residences: [
      {
        id: "etxe-1",
        name: scenario.familyName,
        coords: clone(scenario.center),
        foundedYear: 1100,
        opened: true,
        openedYear: 1100,
        headPersonIds: scenario.people.filter((person) => person.role === "head").map((person) => person.id),
        capacity: scenario.etxeCapacity ?? ETXE_CAPACITY
      }
    ],
    assets: clone(scenario.assets),
    projects: [],
    history: [],
    counters: {
      person: scenario.people.length + 1,
      residence: 2,
      asset: scenario.assets.length + 1,
      project: 1
    }
  };

  ensureLivestockState(state);

  state.people
    .filter((person) => person.role === "head")
    .forEach((person) => {
      person.headOfResidenceId = "etxe-1";
    });

  state.assets.forEach((asset) => {
    if (asset.type === "field") {
      asset.state = { sown: false, tended: false, sowingFailed: false, sowingFailureReason: null };
    }
  });

  state.people.forEach((person) => {
    if (canWork(person) && person.occupation === "Unassigned") {
      person.occupation = chooseAutomaticOccupation(state, person);
    }
    if (
      canWork(person) &&
      person.occupation !== "Builder" &&
      person.occupation !== "Unassigned"
    ) {
      person.lastNonBuilderOccupation = person.occupation;
    }
  });

  return state;
}

export function getLivingPeople(state) {
  return state.people.filter((person) => person.alive);
}

export function getPopulation(state) {
  return getLivingPeople(state).length;
}

export function getResidencePopulation(state, residenceId) {
  return getLivingPeople(state).filter((person) => person.residenceId === residenceId).length;
}

export function getResidenceCapacity(residence) {
  return residence?.capacity ?? ETXE_CAPACITY;
}

export function hasResidenceCapacity(state, residenceId) {
  const residence = state.residences.find((entry) => entry.id === residenceId);
  if (!residence) return false;
  return getResidencePopulation(state, residenceId) < getResidenceCapacity(residence);
}

export function getCurrentSeason(state) {
  return SEASONS[state.date.seasonIndex];
}

export function canWork(person) {
  return person.alive && person.age >= WORK_AGE;
}

export function chooseAutomaticOccupation(state, person, options = {}) {
  if (!person || !canWork(person)) return "Unassigned";

  const allowBuilder = options.allowBuilder !== false;
  const residenceId = person.residenceId;
  const residence = state.residences.find((entry) => entry.id === residenceId);
  const nearbyAssets = residence
    ? state.assets.filter((asset) => haversineKm(residence.coords, asset.coords) <= ETXE_WORK_RADIUS_KM)
    : [];
  const nearbyProjects = residence
    ? state.projects.filter((project) => haversineKm(residence.coords, project.coords) <= ETXE_WORK_RADIUS_KM)
    : [];

  const demand = new Map([
    ["Farmer", nearbyAssets.filter((asset) => asset.type === "field").length],
    ["Herder", nearbyAssets.filter((asset) => asset.type === "pasture").length],
    ["Forestry", nearbyAssets.filter((asset) => asset.type === "forest").length],
    ["Miner", nearbyAssets.filter((asset) => asset.type === "mine").length],
    ["Builder", allowBuilder && nearbyProjects.length > 0 ? 1 : 0]
  ]);

  const occupied = new Map();
  for (const other of getLivingPeople(state)) {
    if (other.id === person.id || !canWork(other) || other.residenceId !== residenceId) continue;
    occupied.set(other.occupation, (occupied.get(other.occupation) ?? 0) + 1);
  }

  const priority = allowBuilder
    ? ["Farmer", "Herder", "Forestry", "Miner", "Builder"]
    : ["Farmer", "Herder", "Forestry", "Miner"];
  let best = "Unassigned";
  let bestGap = 0;

  for (const occupation of priority) {
    const gap = (demand.get(occupation) ?? 0) - (occupied.get(occupation) ?? 0);
    if (gap > bestGap) {
      best = occupation;
      bestGap = gap;
    }
  }

  if (best !== "Unassigned") return best;

  if (
    person.lastNonBuilderOccupation &&
    person.lastNonBuilderOccupation !== "Builder" &&
    person.lastNonBuilderOccupation !== "Unassigned"
  ) {
    return person.lastNonBuilderOccupation;
  }

  const nearbyFallback = ["Farmer", "Herder", "Forestry", "Miner"].find(
    (occupation) => (demand.get(occupation) ?? 0) > 0
  );
  if (nearbyFallback) return nearbyFallback;
  if (allowBuilder && nearbyProjects.length > 0) return "Builder";
  return "Farmer";
}

export function setOccupation(state, personId, occupation) {
  if (!OCCUPATIONS.includes(occupation)) return false;
  const person = state.people.find((entry) => entry.id === personId && entry.alive);
  if (!person || !canWork(person)) return false;

  if (
    occupation === "Builder" &&
    person.occupation !== "Builder" &&
    person.occupation !== "Unassigned"
  ) {
    person.lastNonBuilderOccupation = person.occupation;
  } else if (occupation !== "Builder" && occupation !== "Unassigned") {
    person.lastNonBuilderOccupation = occupation;
  }

  person.occupation = occupation;
  return true;
}

export function movePerson(state, personId, residenceId) {
  const person = state.people.find((entry) => entry.id === personId && entry.alive);
  const residence = state.residences.find((entry) => entry.id === residenceId);
  if (!person || !residence) return false;
  if (person.residenceId === residenceId) return true;
  if (person.headOfResidenceId && person.headOfResidenceId !== residenceId) return false;
  if (!residence.opened) return false;
  if (!hasResidenceCapacity(state, residenceId)) return false;
  person.residenceId = residenceId;
  return true;
}

export function getAnimalAgeSummary(state) {
  return getLivestockSummary(state);
}

export function slaughterAnimal(state) {
  if (getCurrentSeason(state) !== "Autumn") {
    return { ok: false, message: "Animals are only slaughtered through this action in autumn." };
  }

  const removed = removeLivestock(state, 1, { protectBreedingPair: true });
  if (removed.length !== 1) {
    return { ok: false, message: "No slaughterable animal is available without losing the breeding pair." };
  }

  const animal = removed[0];
  const stage = getLivestockLifeStage(animal);
  const food = getSlaughterFoodYield(animal);
  if (food <= 0) {
    animal.alive = true;
    ensureLivestockState(state);
    return { ok: false, message: "Newborn animals are too young to slaughter." };
  }

  state.stores.food += food;
  const message = `1 ${stage} sheep slaughtered: +${food} food.`;
  state.history.push({
    year: state.date.year,
    season: "Autumn",
    text: message
  });

  return { ok: true, message, animal, food };
}

export function canAfford(state, cost) {
  return Object.entries(cost).every(([resource, amount]) => (state.stores[resource] ?? 0) >= amount);
}

export function startProject(state, type, coords) {
  const definition = BUILD_TYPES[type];
  if (!definition) return { ok: false, message: "Unknown project type." };
  if (!canAfford(state, definition.cost)) {
    return { ok: false, message: formatMissingResources(state, definition.cost) };
  }

  const site = evaluateBuildSite(type, coords, state.date.year);
  if (!site.valid) {
    return {
      ok: false,
      message: `${site.reason} Choose a green highlighted area.`
    };
  }

  let residenceId = null;
  if (definition.placement === "near-etxe") {
    const nearest = findNearestResidence(state, coords);
    if (!nearest || nearest.distanceKm > definition.maxDistanceKm) {
      return {
        ok: false,
        message:
          type === "field"
            ? `A field must be within ${definition.maxDistanceKm} km of one of your etxeak.`
            : `${definition.label} must be within ${definition.maxDistanceKm} km of an existing etxe so builders can reach it.`
      };
    }
    residenceId = nearest.residence.id;
  }

  Object.entries(definition.cost).forEach(([resource, amount]) => {
    state.stores[resource] -= amount;
  });

  const project = {
    id: `project-${state.counters.project++}`,
    type,
    name: definition.label,
    coords: [...coords],
    residenceId,
    progress: 0,
    workRequired: definition.workRequired,
    startedYear: state.date.year,
    startedSeason: getCurrentSeason(state)
  };

  state.projects.push(project);
  return { ok: true, project };
}

export function isBuildTerrainEligible(type, coords) {
  return evaluateBuildSite(type, coords).valid;
}

export function advanceSeason(state) {
  const completedSeason = getCurrentSeason(state);
  const completedYear = state.date.year;
  const messages = [];
  const activities = [];
  const before = captureHudResources(state);

  resolveProduction(state, messages, activities);
  resolveProjects(state, messages, activities);
  resolveConsumption(state, messages);

  if (completedSeason === "Winter") {
    resolveAnnualLivestockAging(state, messages);
    state.date.year += 1;
    state.date.seasonIndex = 0;
    resolveAnnualDemography(state, messages);
  } else {
    state.date.seasonIndex += 1;
  }

  const after = captureHudResources(state);
  const resourceDeltas = Object.fromEntries(
    Object.keys(after).map((key) => [key, after[key] - before[key]])
  );

  const summary = {
    season: completedSeason,
    year: completedYear,
    messages,
    resourceDeltas,
    activities
  };

  state.history.push(
    ...messages.map((text) => ({ year: completedYear, season: completedSeason, text }))
  );

  return summary;
}

function captureHudResources(state) {
  ensureLivestockState(state);
  return {
    food: state.stores.food,
    wood: state.stores.wood,
    stone: state.stores.stone,
    livestock: state.stores.livestock,
    people: getPopulation(state),
    etxeak: state.residences.length
  };
}

function resolveProduction(state, messages, activities) {
  const season = getCurrentSeason(state);
  const pools = createWorkerPools(state);
  let workedPastures = 0;

  for (const asset of state.assets) {
    if (asset.type === "field") {
      resolveField(state, asset, season, pools, messages, activities);
    } else if (asset.type === "forest") {
      const worker = takeWorkerNear(state, pools, asset.coords, "Forestry");
      if (worker) {
        recordActivity(activities, asset, worker);
        const amount = season === "Winter" ? 3 : 2;
        state.stores.wood += amount;
        messages.push(`${asset.name}: +${amount} wood.`);
      }
    } else if (asset.type === "pasture") {
      const worker = takeWorkerNear(state, pools, asset.coords, "Herder");
      if (worker) {
        recordActivity(activities, asset, worker);
        workedPastures += 1;
        if (season === "Summer") {
          state.stores.food += 1;
          messages.push(`${asset.name}: +1 food from animal products.`);
        }
      }
    } else if (asset.type === "mine") {
      const worker = takeWorkerNear(state, pools, asset.coords, "Miner");
      if (worker) {
        recordActivity(activities, asset, worker);
        state.stores.stone += 2;
        messages.push(`${asset.name}: +2 stone.`);
      }
    }
  }

  if (season === "Spring" && workedPastures > 0) {
    resolveLivestockBirths(state, workedPastures, messages);
  }
}

function resolveLivestockBirths(state, workedPastures, messages) {
  ensureLivestockState(state);
  const adults = state.animals.filter(
    (animal) => animal.alive && getLivestockLifeStage(animal) === "adult"
  );
  const adultFemales = adults.filter((animal) => animal.sex === "F").length;
  if (!hasBreedingPair(state) || adultFemales === 0) return;

  const births = Math.min(workedPastures, adultFemales);
  for (let index = 0; index < births; index += 1) {
    addNewbornLivestock(state, random(state) < 0.5 ? "F" : "M");
  }
  if (births > 0) {
    messages.push(`${births} lamb${births === 1 ? " was" : "s were"} born in spring.`);
  }
}

function resolveAnnualLivestockAging(state, messages) {
  const result = ageLivestockOneYear(state);
  if (result.matured > 0) {
    messages.push(`${result.matured} sheep matured into breeding-age adults.`);
  }
  if (result.becameOld > 0) {
    messages.push(`${result.becameOld} sheep entered old age.`);
  }
}

function resolveField(state, asset, season, pools, messages, activities) {
  const worker = takeWorkerNear(state, pools, asset.coords, "Farmer");
  const worked = Boolean(worker);
  if (worker) recordActivity(activities, asset, worker);

  if (season === "Spring") {
    asset.state.sown = false;
    asset.state.tended = false;
    asset.state.sowingFailed = false;
    asset.state.sowingFailureReason = null;

    if (!worked) {
      return;
    }
    if (state.stores.food < 1) {
      asset.state.sowingFailed = true;
      asset.state.sowingFailureReason = "no-seed";
      messages.push(`${asset.name}: could not be sown because no seed reserve was available.`);
      return;
    }

    state.stores.food -= 1;
    asset.state.sown = true;
    messages.push(`${asset.name}: sown (-1 food as seed).`);
    return;
  }

  if (season === "Summer") {
    if (worked && asset.state.sown) {
      asset.state.tended = true;
      messages.push(`${asset.name}: crop tended.`);
    }
    return;
  }

  if (season === "Autumn") {
    if (worked && asset.state.sown) {
      const yieldAmount = asset.state.tended ? 9 : 6;
      state.stores.food += yieldAmount;
      messages.push(`${asset.name}: harvested +${yieldAmount} food.`);
    }

    asset.state.sown = false;
    asset.state.tended = false;
  }
}

function createWorkerPools(state) {
  const pools = new Map();

  for (const person of getLivingPeople(state)) {
    if (!canWork(person) || person.occupation === "Unassigned") continue;
    if (!pools.has(person.occupation)) pools.set(person.occupation, []);
    pools.get(person.occupation).push(person);
  }

  return pools;
}

function takeWorkerNear(state, pools, coords, occupation) {
  const available = pools.get(occupation) ?? [];
  let bestIndex = -1;
  let bestDistance = Infinity;

  for (let index = 0; index < available.length; index += 1) {
    const person = available[index];
    const residence = state.residences.find((entry) => entry.id === person.residenceId);
    if (!residence) continue;
    const distance = haversineKm(residence.coords, coords);
    if (distance <= ETXE_WORK_RADIUS_KM && distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  }

  if (bestIndex < 0) return null;
  return available.splice(bestIndex, 1)[0];
}

function recordActivity(activities, target, worker) {
  activities.push({
    targetType: "asset",
    targetId: target.id,
    label: target.name,
    coords: [...target.coords],
    workers: 1,
    workerIds: [worker.id]
  });
}

function resolveProjects(state, messages, activities) {
  if (state.projects.length === 0) {
    restoreIdleBuilders(state, messages);
    return;
  }

  const builderPools = createWorkerPools(state);
  if ((builderPools.get("Builder")?.length ?? 0) <= 0) return;

  for (const project of [...state.projects]) {
    const remaining = project.workRequired - project.progress;
    const appliedBuilders = [];

    while (appliedBuilders.length < remaining) {
      const builder = takeWorkerNear(state, builderPools, project.coords, "Builder");
      if (!builder) break;
      appliedBuilders.push(builder);
    }

    if (appliedBuilders.length === 0) continue;

    const applied = appliedBuilders.length;
    project.progress += applied;

    activities.push({
      targetType: "project",
      targetId: project.id,
      label: project.name,
      coords: [...project.coords],
      workers: applied,
      workerIds: appliedBuilders.map((person) => person.id)
    });
    messages.push(`${project.name}: +${applied} construction work.`);

    if (project.progress >= project.workRequired) {
      completeProject(state, project, messages);
    }
  }

  if (state.projects.length === 0) {
    restoreIdleBuilders(state, messages);
  }
}

function restoreIdleBuilders(state, messages) {
  if (state.projects.length > 0) return;

  for (const person of getLivingPeople(state)) {
    if (!canWork(person) || person.occupation !== "Builder") continue;

    const remembered =
      person.lastNonBuilderOccupation &&
      person.lastNonBuilderOccupation !== "Builder" &&
      person.lastNonBuilderOccupation !== "Unassigned"
        ? person.lastNonBuilderOccupation
        : null;
    const nextOccupation =
      remembered ?? chooseAutomaticOccupation(state, person, { allowBuilder: false });

    if (!nextOccupation || nextOccupation === "Builder") continue;

    person.occupation = nextOccupation;
    if (nextOccupation !== "Unassigned") {
      person.lastNonBuilderOccupation = nextOccupation;
    }
    messages.push(
      `${person.givenName} finished construction and returned to work as a ${nextOccupation}.`
    );
  }
}

function completeProject(state, project, messages) {
  if (project.type === "etxe") {
    const residence = {
      id: `etxe-${state.counters.residence++}`,
      name: `Etxe ${state.counters.residence - 1}`,
      coords: [...project.coords],
      foundedYear: state.date.year,
      opened: false,
      openedYear: null,
      headPersonIds: [],
      capacity: ETXE_CAPACITY
    };
    state.residences.push(residence);
    messages.push(`${residence.name} was completed. Choose a working-age man and a wife family to open it.`);
  }

  if (project.type === "field") {
    const asset = {
      id: `a${state.counters.asset++}`,
      type: "field",
      name: `Field ${state.counters.asset - 1}`,
      coords: [...project.coords],
      residenceId: project.residenceId,
      state: { sown: false, tended: false, sowingFailed: false, sowingFailureReason: null }
    };
    state.assets.push(asset);
    messages.push(`${asset.name} was cleared and is ready for the next sowing season.`);
  }

  if (project.type === "mine") {
    const asset = {
      id: `a${state.counters.asset++}`,
      type: "mine",
      name: `Mine ${state.counters.asset - 1}`,
      coords: [...project.coords],
      residenceId: project.residenceId,
      state: {}
    };
    state.assets.push(asset);
    messages.push(`${asset.name} was established and is ready for miners.`);
  }

  state.projects = state.projects.filter((entry) => entry.id !== project.id);
}

function resolveConsumption(state, messages) {
  const population = getPopulation(state);
  const requiredFood = Math.max(1, Math.ceil(population * 0.65));
  state.foodSecurity ??= { shortageSeasonsThisYear: 0, shortageFoodThisYear: 0 };

  if (state.stores.food >= requiredFood) {
    state.stores.food -= requiredFood;
    messages.push(`Household consumption: -${requiredFood} food for ${population} people.`);
  } else {
    const shortage = requiredFood - state.stores.food;
    state.stores.food = 0;
    state.foodSecurity.shortageSeasonsThisYear += 1;
    state.foodSecurity.shortageFoodThisYear += shortage;
    const seasons = state.foodSecurity.shortageSeasonsThisYear;
    messages.push(
      `Food shortage: ${shortage} food missing this season. Hunger has affected ${seasons} season${seasons === 1 ? "" : "s"} this year; mortality risk is higher and births are less likely at year end.`
    );
  }
}

function resolveAnnualDemography(state, messages) {
  const livingBefore = getLivingPeople(state);
  const shortageSeasons = state.foodSecurity?.shortageSeasonsThisYear ?? 0;

  if (shortageSeasons > 0) {
    messages.push(
      `Year-end hunger: ${shortageSeasons} shortage season${shortageSeasons === 1 ? "" : "s"} increased mortality risk and reduced the household birth chance.`
    );
  }

  livingBefore.forEach((person) => {
    person.age += 1;
    if (person.age === WORK_AGE && person.occupation === "Unassigned") {
      person.occupation = chooseAutomaticOccupation(state, person);
      messages.push(`${person.givenName} reached working age and became a ${person.occupation}.`);
    }
  });

  for (const person of [...getLivingPeople(state)]) {
    const deathChance = annualDeathChance(person.age, shortageSeasons);
    if (random(state) < deathChance) {
      person.alive = false;
      messages.push(`${person.givenName} died at age ${person.age}.`);
    }
  }

  const livingNow = getLivingPeople(state);

  for (const residence of state.residences.filter((entry) => entry.opened)) {
    const heads = (residence.headPersonIds ?? [])
      .map((personId) => livingNow.find((person) => person.id === personId))
      .filter(Boolean);

    const headMother = heads.find(
      (person) => person.sex === "F" && person.age >= 18 && person.age <= 42
    );
    const headFather = heads.find((person) => person.sex === "M");

    if (!headMother || !headFather) continue;
    if (headMother.residenceId !== residence.id || headFather.residenceId !== residence.id) continue;
    if (!hasResidenceCapacity(state, residence.id)) continue;
    if (random(state) >= annualBirthChance(shortageSeasons)) continue;

    const givenName = BABY_NAMES[Math.floor(random(state) * BABY_NAMES.length)];
    const baby = {
      id: `p${state.counters.person++}`,
      givenName,
      surname: headFather.surname,
      sex: random(state) < 0.5 ? "F" : "M",
      age: 0,
      role: "child",
      occupation: "Unassigned",
      alive: true,
      residenceId: residence.id,
      parentIds: [headFather.id, headMother.id]
    };
    state.people.push(baby);
    messages.push(`${givenName} was born in ${residence.name}.`);
  }

  if (state.foodSecurity) {
    state.foodSecurity.shortageSeasonsThisYear = 0;
    state.foodSecurity.shortageFoodThisYear = 0;
  }
}

export function annualBirthChance(shortageSeasons = 0) {
  return Math.max(0, 0.2 - 0.05 * Math.max(0, shortageSeasons));
}

export function annualDeathChance(age, shortageSeasons = 0) {
  let baseChance;
  if (age < 1) baseChance = 0.05;
  else if (age < 12) baseChance = 0.015;
  else if (age < 45) baseChance = 0.006;
  else if (age < 60) baseChance = 0.02;
  else if (age < 70) baseChance = 0.05;
  else baseChance = 0.1;

  const shortageCount = Math.max(0, shortageSeasons);
  let hungerPerSeason = 0.006;
  if (age < 5 || age >= 60) hungerPerSeason = 0.02;
  else if (age < 12 || age >= 45) hungerPerSeason = 0.012;

  return Math.min(0.95, baseChance + hungerPerSeason * shortageCount);
}

function random(state) {
  state.rngState = (1664525 * state.rngState + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

function formatMissingResources(state, cost) {
  const missing = Object.entries(cost)
    .filter(([resource, amount]) => (state.stores[resource] ?? 0) < amount)
    .map(([resource, amount]) => `${amount - (state.stores[resource] ?? 0)} ${resource}`);
  return `Missing ${missing.join(" and ")}.`;
}

export function findNearestResidence(state, coords) {
  let best = null;

  for (const residence of state.residences) {
    const distanceKm = haversineKm(coords, residence.coords);
    if (!best || distanceKm < best.distanceKm) {
      best = { residence, distanceKm };
    }
  }

  return best;
}

export function haversineKm(a, b) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}
