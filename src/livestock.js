export const LIVESTOCK_KIND = "sheep";

const STARTING_AGES = [4, 3, 2, 1, 5, 2, 6, 3, 1, 4];
const STARTING_SEXES = ["F", "M", "F", "F", "M", "F", "F", "M", "F", "F"];

export function getLivestockLifeStage(animal) {
  if (animal.age < 1) return "newborn";
  if (animal.age < 2) return "juvenile";
  if (animal.age < 8) return "adult";
  return "old";
}

export function ensureLivestockState(state) {
  if (!Array.isArray(state.animals)) {
    const count = Math.max(0, state.stores?.livestock ?? 0);
    state.animals = Array.from({ length: count }, (_, index) => ({
      id: `animal-${index + 1}`,
      kind: LIVESTOCK_KIND,
      sex: STARTING_SEXES[index % STARTING_SEXES.length],
      age: STARTING_AGES[index % STARTING_AGES.length],
      alive: true
    }));
    state.counters ??= {};
    state.counters.animal = count + 1;
  }
  state.counters ??= {};
  state.counters.animal ??= state.animals.length + 1;
  syncLivestockTotal(state);
  return state.animals;
}

export function getLivingLivestock(state) {
  return ensureLivestockState(state).filter((animal) => animal.alive);
}

export function getLivestockSummary(state) {
  const summary = { newborn: 0, juvenile: 0, adult: 0, old: 0, total: 0 };
  for (const animal of getLivingLivestock(state)) {
    summary[getLivestockLifeStage(animal)] += 1;
    summary.total += 1;
  }
  return summary;
}

export function hasBreedingPair(state) {
  const adults = getLivingLivestock(state).filter(
    (animal) => getLivestockLifeStage(animal) === "adult"
  );
  return adults.some((animal) => animal.sex === "F") && adults.some((animal) => animal.sex === "M");
}

export function addNewbornLivestock(state, sex = "F") {
  ensureLivestockState(state);
  const animal = {
    id: `animal-${state.counters.animal++}`,
    kind: LIVESTOCK_KIND,
    sex,
    age: 0,
    alive: true
  };
  state.animals.push(animal);
  syncLivestockTotal(state);
  return animal;
}

export function ageLivestockOneYear(state) {
  ensureLivestockState(state);
  const before = getLivestockSummary(state);
  for (const animal of state.animals) {
    if (animal.alive) animal.age += 1;
  }
  const after = getLivestockSummary(state);
  return {
    matured: Math.max(0, after.adult - before.adult),
    becameOld: Math.max(0, after.old - before.old),
    before,
    after
  };
}

export function removeLivestock(state, count = 1, options = {}) {
  ensureLivestockState(state);
  const living = getLivingLivestock(state);
  if (living.length < count) return [];

  const protectBreedingPair = options.protectBreedingPair === true;
  const candidates = [...living].sort((a, b) => {
    const stageRank = { old: 3, adult: 2, juvenile: 1, newborn: 0 };
    const rankDiff = stageRank[getLivestockLifeStage(b)] - stageRank[getLivestockLifeStage(a)];
    return rankDiff || b.age - a.age || a.id.localeCompare(b.id);
  });

  const removed = [];
  for (const animal of candidates) {
    if (removed.length >= count) break;
    if (protectBreedingPair && wouldBreakBreedingPair(state, animal, removed)) continue;
    animal.alive = false;
    removed.push(animal);
  }

  if (removed.length < count) {
    for (const animal of removed) animal.alive = true;
    syncLivestockTotal(state);
    return [];
  }

  syncLivestockTotal(state);
  return removed;
}

export function receiveLivestock(state, count, sexChooser = null) {
  const received = [];
  for (let index = 0; index < count; index += 1) {
    received.push(addNewbornLivestock(state, sexChooser ? sexChooser(index) : index % 2 === 0 ? "F" : "M"));
  }
  return received;
}

export function getSlaughterFoodYield(animal) {
  const stage = getLivestockLifeStage(animal);
  if (stage === "juvenile") return 3;
  if (stage === "adult") return 5;
  if (stage === "old") return 4;
  return 0;
}

function wouldBreakBreedingPair(state, candidate, alreadyRemoved) {
  const removedIds = new Set(alreadyRemoved.map((animal) => animal.id));
  removedIds.add(candidate.id);
  const remainingAdults = getLivingLivestock(state).filter(
    (animal) => !removedIds.has(animal.id) && getLivestockLifeStage(animal) === "adult"
  );
  const hadPair = hasBreedingPair(state);
  if (!hadPair) return false;
  return !(
    remainingAdults.some((animal) => animal.sex === "F") &&
    remainingAdults.some((animal) => animal.sex === "M")
  );
}

export function syncLivestockTotal(state) {
  if (!state.stores) state.stores = {};
  state.stores.livestock = Array.isArray(state.animals)
    ? state.animals.filter((animal) => animal.alive).length
    : Math.max(0, state.stores.livestock ?? 0);
  return state.stores.livestock;
}
