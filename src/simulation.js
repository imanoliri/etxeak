import { OCCUPATIONS } from "./scenarios.js";

export const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];
export const WORK_AGE = 12;

export const BUILD_TYPES = {
  etxe: {
    label: "New etxe",
    cost: { wood: 8, stone: 4 },
    workRequired: 4,
    placement: "anywhere",
    resultType: "etxe"
  },
  field: {
    label: "Clear field",
    cost: { wood: 3 },
    workRequired: 3,
    placement: "near-etxe",
    maxDistanceKm: 5,
    resultType: "field"
  }
};

const BABY_NAMES = ["Eneko", "Toda", "Gartzea", "Oneka", "Lope", "Maria", "Martin", "Sancha"];

const clone = (value) => JSON.parse(JSON.stringify(value));

export function createGame(scenario) {
  const state = {
    version: 1,
    scenarioId: scenario.id,
    familyName: scenario.familyName,
    placeName: scenario.placeName,
    date: { year: 1100, seasonIndex: 0 },
    rngState: scenario.seed >>> 0,
    stores: clone(scenario.stores),
    people: clone(scenario.people),
    residences: [
      {
        id: "etxe-1",
        name: scenario.familyName,
        coords: clone(scenario.center),
        foundedYear: 1100
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

  state.assets.forEach((asset) => {
    if (asset.type === "field") {
      asset.state = { sown: false, tended: false };
    }
  });

  state.people.forEach((person) => {
    if (canWork(person) && person.occupation === "Unassigned") {
      person.occupation = chooseAutomaticOccupation(state, person);
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

export function getCurrentSeason(state) {
  return SEASONS[state.date.seasonIndex];
}

export function canWork(person) {
  return person.alive && person.age >= WORK_AGE;
}

export function chooseAutomaticOccupation(state, person) {
  if (!person || !canWork(person)) return "Unassigned";

  const residenceId = person.residenceId;
  const demand = new Map([
    ["Farmer", state.assets.filter((asset) => asset.residenceId === residenceId && asset.type === "field").length],
    ["Herder", state.assets.filter((asset) => asset.residenceId === residenceId && asset.type === "pasture").length],
    ["Forestry", state.assets.filter((asset) => asset.residenceId === residenceId && asset.type === "forest").length],
    ["Miner", state.assets.filter((asset) => asset.residenceId === residenceId && asset.type === "mine").length],
    ["Builder", state.projects.length > 0 ? 1 : 0]
  ]);

  const occupied = new Map();
  for (const other of getLivingPeople(state)) {
    if (other.id === person.id || !canWork(other) || other.residenceId !== residenceId) continue;
    occupied.set(other.occupation, (occupied.get(other.occupation) ?? 0) + 1);
  }

  const priority = ["Farmer", "Herder", "Forestry", "Miner", "Builder"];
  let best = "Builder";
  let bestGap = 0;

  for (const occupation of priority) {
    const gap = (demand.get(occupation) ?? 0) - (occupied.get(occupation) ?? 0);
    if (gap > bestGap) {
      best = occupation;
      bestGap = gap;
    }
  }

  return best;
}

export function setOccupation(state, personId, occupation) {
  if (!OCCUPATIONS.includes(occupation)) return false;
  const person = state.people.find((entry) => entry.id === personId && entry.alive);
  if (!person || !canWork(person)) return false;
  person.occupation = occupation;
  return true;
}

export function movePerson(state, personId, residenceId) {
  const person = state.people.find((entry) => entry.id === personId && entry.alive);
  const residence = state.residences.find((entry) => entry.id === residenceId);
  if (!person || !residence) return false;
  person.residenceId = residenceId;
  return true;
}

export function slaughterAnimal(state) {
  if (getCurrentSeason(state) !== "Autumn") {
    return { ok: false, message: "Animals are only slaughtered through this action in autumn." };
  }
  if (state.stores.livestock <= 1) {
    return { ok: false, message: "Keep at least one animal as breeding stock." };
  }

  state.stores.livestock -= 1;
  state.stores.food += 5;
  state.history.push({
    year: state.date.year,
    season: "Autumn",
    text: "One animal was slaughtered, adding 5 food."
  });

  return { ok: true, message: "1 animal slaughtered: +5 food." };
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

  let residenceId = null;
  if (definition.placement === "near-etxe") {
    const nearest = findNearestResidence(state, coords);
    if (!nearest || nearest.distanceKm > definition.maxDistanceKm) {
      return {
        ok: false,
        message: `A field must be within ${definition.maxDistanceKm} km of one of your etxeak.`
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

export function advanceSeason(state) {
  const completedSeason = getCurrentSeason(state);
  const completedYear = state.date.year;
  const messages = [];

  resolveProduction(state, messages);
  resolveProjects(state, messages);
  resolveConsumption(state, messages);

  if (completedSeason === "Winter") {
    state.date.year += 1;
    state.date.seasonIndex = 0;
    resolveAnnualDemography(state, messages);
  } else {
    state.date.seasonIndex += 1;
  }

  const summary = {
    season: completedSeason,
    year: completedYear,
    messages
  };

  state.history.push(
    ...messages.map((text) => ({ year: completedYear, season: completedSeason, text }))
  );

  return summary;
}

function resolveProduction(state, messages) {
  const season = getCurrentSeason(state);
  const pools = createWorkerPools(state);

  for (const asset of state.assets) {
    if (asset.type === "field") {
      resolveField(state, asset, season, pools, messages);
    } else if (asset.type === "forest") {
      if (takeWorker(pools, asset.residenceId, "Forestry")) {
        const amount = season === "Winter" ? 3 : 2;
        state.stores.wood += amount;
        messages.push(`${asset.name}: +${amount} wood.`);
      }
    } else if (asset.type === "pasture") {
      if (takeWorker(pools, asset.residenceId, "Herder")) {
        if (season === "Spring") {
          state.stores.livestock += 1;
          messages.push(`${asset.name}: livestock increased by 1.`);
        } else if (season === "Summer") {
          state.stores.food += 1;
          messages.push(`${asset.name}: +1 food from animal products.`);
        }
      }
    } else if (asset.type === "mine") {
      if (takeWorker(pools, asset.residenceId, "Miner")) {
        state.stores.stone += 2;
        messages.push(`${asset.name}: +2 stone.`);
      }
    }
  }
}

function resolveField(state, asset, season, pools, messages) {
  const worked = takeWorker(pools, asset.residenceId, "Farmer");

  if (season === "Spring") {
    asset.state.sown = false;
    asset.state.tended = false;

    if (!worked) return;
    if (state.stores.food < 1) {
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
    } else if (asset.state.sown) {
      messages.push(`${asset.name}: harvest was lost because no farmer worked it.`);
    }

    asset.state.sown = false;
    asset.state.tended = false;
  }
}

function createWorkerPools(state) {
  const pools = new Map();

  for (const person of getLivingPeople(state)) {
    if (!canWork(person) || person.occupation === "Unassigned") continue;

    const key = `${person.residenceId}::${person.occupation}`;
    pools.set(key, (pools.get(key) ?? 0) + 1);
  }

  return pools;
}

function takeWorker(pools, residenceId, occupation) {
  const key = `${residenceId}::${occupation}`;
  const available = pools.get(key) ?? 0;
  if (available <= 0) return false;
  pools.set(key, available - 1);
  return true;
}

function resolveProjects(state, messages) {
  let builderWork = getLivingPeople(state).filter(
    (person) => canWork(person) && person.occupation === "Builder"
  ).length;

  if (builderWork <= 0 || state.projects.length === 0) return;

  for (const project of [...state.projects]) {
    if (builderWork <= 0) break;

    const remaining = project.workRequired - project.progress;
    const applied = Math.min(builderWork, remaining);
    project.progress += applied;
    builderWork -= applied;
    messages.push(`${project.name}: +${applied} construction work.`);

    if (project.progress >= project.workRequired) {
      completeProject(state, project, messages);
    }
  }
}

function completeProject(state, project, messages) {
  if (project.type === "etxe") {
    const residence = {
      id: `etxe-${state.counters.residence++}`,
      name: `Etxe ${state.counters.residence - 1}`,
      coords: [...project.coords],
      foundedYear: state.date.year
    };
    state.residences.push(residence);
    messages.push(`${residence.name} was completed. Family members can now move there.`);
  }

  if (project.type === "field") {
    const asset = {
      id: `a${state.counters.asset++}`,
      type: "field",
      name: `Field ${state.counters.asset - 1}`,
      coords: [...project.coords],
      residenceId: project.residenceId,
      state: { sown: false, tended: false }
    };
    state.assets.push(asset);
    messages.push(`${asset.name} was cleared and is ready for the next sowing season.`);
  }

  state.projects = state.projects.filter((entry) => entry.id !== project.id);
}

function resolveConsumption(state, messages) {
  const population = getPopulation(state);
  const requiredFood = Math.max(1, Math.ceil(population * 0.65));

  if (state.stores.food >= requiredFood) {
    state.stores.food -= requiredFood;
    messages.push(`Household consumption: -${requiredFood} food for ${population} people.`);
  } else {
    const shortage = requiredFood - state.stores.food;
    state.stores.food = 0;
    messages.push(`Food shortage: ${shortage} food missing this season.`);
  }
}

function resolveAnnualDemography(state, messages) {
  const livingBefore = getLivingPeople(state);

  livingBefore.forEach((person) => {
    person.age += 1;
    if (person.age === WORK_AGE && person.occupation === "Unassigned") {
      person.occupation = chooseAutomaticOccupation(state, person);
      messages.push(`${person.givenName} reached working age and became a ${person.occupation}.`);
    }
  });

  for (const person of [...getLivingPeople(state)]) {
    const deathChance = annualDeathChance(person.age);
    if (random(state) < deathChance) {
      person.alive = false;
      messages.push(`${person.givenName} died at age ${person.age}.`);
    }
  }

  const headMother = getLivingPeople(state).find(
    (person) => person.role === "head" && person.sex === "F" && person.age >= 18 && person.age <= 42
  );
  const headFather = getLivingPeople(state).find(
    (person) => person.role === "head" && person.sex === "M"
  );

  if (headMother && headFather && random(state) < 0.2) {
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
      residenceId: headMother.residenceId,
      parentIds: [headFather.id, headMother.id]
    };
    state.people.push(baby);
    messages.push(`${givenName} was born into the family.`);
  }
}

function annualDeathChance(age) {
  if (age < 1) return 0.05;
  if (age < 12) return 0.015;
  if (age < 45) return 0.006;
  if (age < 60) return 0.02;
  if (age < 70) return 0.05;
  return 0.1;
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
