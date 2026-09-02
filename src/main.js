import { STARTING_SCENARIOS } from "./scenarios.js";
import { tradeWithFamily } from "./commerce.js";
import { establishEtxeWithMarriage } from "./households.js";
import {
  advanceSeason,
  createGame,
  movePerson,
  setOccupation,
  slaughterAnimal,
  startProject
} from "./simulation.js";
import {
  clearCommercePartners,
  clearScenarioPreviews,
  createMap,
  focusOn,
  renderGameState,
  showCommercePartners,
  showScenarioPreviews
} from "./map.js";
import {
  bindStaticActions,
  hidePlacement,
  openAssetPanel,
  openCommercePanel,
  openBuildPanel,
  openFamilyPanel,
  openMarriagePanel,
  openResidencePanel,
  renderHud,
  renderScenarioSelection,
  renderSeasonTimer,
  setCommerceActive,
  showPlacement,
  showToast,
  startGameUI
} from "./ui.js";

const DEFAULT_SEASON_SECONDS = 7;
const MIN_SEASON_SECONDS = 1;
const MAX_SEASON_SECONDS = 300;
const TIMER_TICK_MS = 100;

let state = null;
let placementType = null;
let autoplaySeconds = DEFAULT_SEASON_SECONDS;
let autoplayPaused = false;
let remainingMs = autoplaySeconds * 1000;
let deadlineMs = null;
let timerId = null;
let lastSeasonSummary = null;
let commerceMode = false;
let commerceSelection = { giveResource: null, receiveResource: null };
let pendingEtxeOpening = null;

const mapContext = createMap(handleMapClick);

bindStaticActions({
  onFamily: () => {
    if (!state) return;
    clearExternalFamilyMode();
    openFamilyPanel(state, familyHandlers);
  },
  onBuild: () => {
    if (!state) return;
    clearExternalFamilyMode();
    openBuildPanel(state, beginPlacement);
  },
  onCommerce: toggleCommerce,
  onSlaughter: handleSlaughter,
  onNextSeason: handleNextSeason,
  onToggleAutoplay: toggleAutoplay,
  onTimerSeconds: setAutoplaySeconds,
  onCancelPlacement: cancelPlacement
});

renderScenarioSelection(STARTING_SCENARIOS, startScenario);
showScenarioPreviews(mapContext, STARTING_SCENARIOS, startScenario);
renderTimer();

function startScenario(scenarioId) {
  const scenario = STARTING_SCENARIOS.find((entry) => entry.id === scenarioId);
  if (!scenario) return;

  state = createGame(scenario);
  lastSeasonSummary = null;
  commerceMode = false;
  pendingEtxeOpening = null;
  setCommerceActive(false);
  clearCommercePartners(mapContext);
  clearScenarioPreviews(mapContext);
  startGameUI(state);
  focusOn(mapContext, scenario.center, 13);
  refreshMap();
  resetAutoplayCountdown();
  showToast(`${scenario.familyName} begins in Spring 1100.`);
}

function refresh() {
  if (!state) return;
  renderHud(state, lastSeasonSummary);
  refreshMap();
}

function refreshMap() {
  if (!state) return;
  renderGameState(mapContext, state, {
    onResidence: (residenceId) => openResidencePanel(state, residenceId, residenceHandlers),
    onAsset: (assetId) => openAssetPanel(state, assetId),
    seasonSummary: lastSeasonSummary
  });
}

const familyHandlers = {
  onOccupation(personId, occupation) {
    if (setOccupation(state, personId, occupation)) {
      refresh();
      openFamilyPanel(state, familyHandlers);
    }
  },
  onMovePerson(personId, residenceId) {
    if (movePerson(state, personId, residenceId)) {
      refresh();
      openFamilyPanel(state, familyHandlers);
    } else {
      showToast("That etxe is full or has not been opened yet.");
      openFamilyPanel(state, familyHandlers);
    }
  }
};

const residenceHandlers = {
  onBeginOpening(residenceId, manId) {
    beginEtxeOpening(residenceId, manId);
  }
};

function beginEtxeOpening(residenceId, manId) {
  if (!state) return;

  cancelPlacement();
  commerceMode = false;
  pendingEtxeOpening = { residenceId, manId };
  setCommerceActive(true);
  showCommercePartners(
    mapContext,
    STARTING_SCENARIOS,
    state.scenarioId,
    state,
    openMarriagePartner
  );
  showToast("Choose the family the wife will come from.");
}

function openMarriagePartner(scenarioId) {
  if (!state || !pendingEtxeOpening) return;

  const partner = STARTING_SCENARIOS.find(
    (scenario) =>
      scenario.id === scenarioId && scenario.id !== state.scenarioId
  );
  if (!partner) return;

  openMarriagePanel(
    state,
    pendingEtxeOpening.residenceId,
    pendingEtxeOpening.manId,
    partner,
    { onConfirmMarriage: handleConfirmMarriage }
  );
}

function handleConfirmMarriage(
  residenceId,
  manId,
  scenarioId,
  paymentResource
) {
  if (!state) return;

  const partner = STARTING_SCENARIOS.find(
    (scenario) =>
      scenario.id === scenarioId && scenario.id !== state.scenarioId
  );
  if (!partner) return;

  const result = establishEtxeWithMarriage(
    state,
    residenceId,
    manId,
    partner,
    paymentResource
  );
  showToast(result.message);
  if (!result.ok) return;

  pendingEtxeOpening = null;
  commerceMode = false;
  setCommerceActive(false);
  clearCommercePartners(mapContext);
  refresh();
  focusOn(mapContext, result.residence.coords, 13);
  openResidencePanel(state, residenceId, residenceHandlers);
}

function beginPlacement(type) {
  clearExternalFamilyMode();
  placementType = type;
  showPlacement(type);
}

function cancelPlacement() {
  placementType = null;
  hidePlacement();
}

function handleMapClick(coords) {
  if (!state || !placementType) return;

  const result = startProject(state, placementType, coords);
  if (!result.ok) {
    showToast(result.message);
    return;
  }

  const label = result.project.name;
  placementType = null;
  hidePlacement();
  refresh();
  openBuildPanel(state, beginPlacement);
  showToast(`${label} project started.`);
}


function toggleCommerce() {
  if (!state) return;
  if (commerceMode || pendingEtxeOpening) {
    clearExternalFamilyMode();
    return;
  }

  cancelPlacement();
  commerceMode = true;
  setCommerceActive(true);
  showCommercePartners(
    mapContext,
    STARTING_SCENARIOS,
    state.scenarioId,
    state,
    openTradePartner
  );
  showToast("Commerce: select another family location on the map.");
}

function clearExternalFamilyMode(refocus = true) {
  commerceMode = false;
  pendingEtxeOpening = null;
  setCommerceActive(false);
  clearCommercePartners(mapContext);
  if (refocus && state?.residences?.[0]) {
    focusOn(mapContext, state.residences[0].coords, 13);
  }
}

function openTradePartner(scenarioId) {
  if (!state || !commerceMode) return;
  const partner = STARTING_SCENARIOS.find((scenario) => scenario.id === scenarioId && scenario.id !== state.scenarioId);
  if (!partner) return;
  openCommercePanel(
    state,
    partner,
    {
      onTrade: handleTrade,
      onSelectionChange: handleCommerceSelectionChange
    },
    commerceSelection
  );
}

function handleCommerceSelectionChange(giveResource, receiveResource) {
  commerceSelection = { giveResource, receiveResource };
}

function handleTrade(scenarioId, giveResource, receiveResource) {
  if (!state) return;
  commerceSelection = { giveResource, receiveResource };
  const partner = STARTING_SCENARIOS.find((scenario) => scenario.id === scenarioId && scenario.id !== state.scenarioId);
  if (!partner) return;

  const result = tradeWithFamily(state, partner, giveResource, receiveResource);
  showToast(result.message);
  if (!result.ok) return;

  refresh();
  openCommercePanel(
    state,
    partner,
    {
      onTrade: handleTrade,
      onSelectionChange: handleCommerceSelectionChange
    },
    commerceSelection
  );
}

function handleSlaughter() {
  if (!state) return;
  const result = slaughterAnimal(state);
  showToast(result.message);
  if (result.ok) refresh();
}

function handleNextSeason() {
  if (!state) return;

  const wasRunning = !autoplayPaused;
  resolveSeason();
  showToast("Season resolved. Results are shown on the map and resource bar.");

  if (wasRunning) resetAutoplayCountdown();
}

function resolveSeason() {
  lastSeasonSummary = advanceSeason(state);
  refresh();
  return lastSeasonSummary;
}

function resolveSeasonAutomatically() {
  if (!state || autoplayPaused) return;

  clearTimer();
  deadlineMs = null;
  resolveSeason();
  resetAutoplayCountdown();
}

function toggleAutoplay() {
  if (!state) return;

  if (autoplayPaused) {
    autoplayPaused = false;
    startAutoplayTimer(false);
  } else {
    pauseAutoplay();
  }
}

function setAutoplaySeconds(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    renderTimer();
    return;
  }

  autoplaySeconds = Math.min(
    MAX_SEASON_SECONDS,
    Math.max(MIN_SEASON_SECONDS, Math.round(parsed))
  );
  remainingMs = autoplaySeconds * 1000;

  if (autoplayPaused || !state) {
    clearTimer();
    deadlineMs = null;
    renderTimer();
  } else {
    startAutoplayTimer(true);
  }
}

function resetAutoplayCountdown() {
  remainingMs = autoplaySeconds * 1000;

  if (!state || autoplayPaused) {
    clearTimer();
    deadlineMs = null;
    renderTimer();
    return;
  }

  startAutoplayTimer(true);
}

function startAutoplayTimer(resetCountdown) {
  clearTimer();

  if (!state || autoplayPaused) {
    renderTimer();
    return;
  }

  if (resetCountdown || remainingMs <= 0 || remainingMs > autoplaySeconds * 1000) {
    remainingMs = autoplaySeconds * 1000;
  }

  deadlineMs = Date.now() + remainingMs;
  renderTimer();

  timerId = window.setInterval(() => {
    if (!state || autoplayPaused || deadlineMs === null) return;

    remainingMs = Math.max(0, deadlineMs - Date.now());
    renderTimer();

    if (remainingMs <= 0) {
      resolveSeasonAutomatically();
    }
  }, TIMER_TICK_MS);
}

function pauseAutoplay() {
  if (deadlineMs !== null) {
    remainingMs = Math.max(0, deadlineMs - Date.now());
  }

  autoplayPaused = true;
  clearTimer();
  deadlineMs = null;
  renderTimer();
}

function clearTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function renderTimer() {
  renderSeasonTimer({
    paused: autoplayPaused,
    seconds: autoplaySeconds,
    remainingSeconds: remainingMs / 1000
  });
}
