import { STARTING_SCENARIOS } from "./scenarios.js";
import {
  advanceSeason,
  createGame,
  movePerson,
  setOccupation,
  slaughterAnimal,
  startProject
} from "./simulation.js";
import {
  clearScenarioPreviews,
  createMap,
  focusOn,
  renderGameState,
  showScenarioPreviews
} from "./map.js";
import {
  bindStaticActions,
  hidePlacement,
  openAssetPanel,
  openBuildPanel,
  openFamilyPanel,
  openResidencePanel,
  renderHud,
  renderScenarioSelection,
  renderSeasonTimer,
  showPlacement,
  showSummary,
  showToast,
  startGameUI
} from "./ui.js";

const DEFAULT_SEASON_SECONDS = 7;
const MIN_SEASON_SECONDS = 1;
const MAX_SEASON_SECONDS = 300;

let state = null;
let placementType = null;
let seasonSeconds = DEFAULT_SEASON_SECONDS;
let autoplayPaused = false;
let seasonAdvanceTimer = null;
let countdownTimer = null;
let seasonDeadline = null;
let resumeAfterSummary = false;

const mapContext = createMap(handleMapClick);

bindStaticActions({
  onFamily: () => state && openFamilyPanel(state, familyHandlers),
  onBuild: () => state && openBuildPanel(state, beginPlacement),
  onSlaughter: handleSlaughter,
  onNextSeason: handleNextSeason,
  onToggleAutoplay: toggleAutoplay,
  onTimerSeconds: setSeasonSeconds,
  onCloseSummary: handleSummaryClosed,
  onCancelPlacement: cancelPlacement
});

renderScenarioSelection(STARTING_SCENARIOS, startScenario);
showScenarioPreviews(mapContext, STARTING_SCENARIOS, startScenario);

function startScenario(scenarioId) {
  const scenario = STARTING_SCENARIOS.find((entry) => entry.id === scenarioId);
  if (!scenario) return;

  state = createGame(scenario);
  clearScenarioPreviews(mapContext);
  startGameUI(state);
  focusOn(mapContext, scenario.center, 13);
  refreshMap();
  autoplayPaused = false;
  resumeAfterSummary = false;
  scheduleNextSeason();
  showToast(`${scenario.familyName} begins in Spring 1100.`);
}

function refresh() {
  if (!state) return;
  renderHud(state);
  refreshMap();
}

function refreshMap() {
  if (!state) return;
  renderGameState(mapContext, state, {
    onResidence: (residenceId) => openResidencePanel(state, residenceId),
    onAsset: (assetId) => openAssetPanel(state, assetId)
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
    }
  }
};

function beginPlacement(type) {
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

function handleSlaughter() {
  if (!state) return;
  const result = slaughterAnimal(state);
  showToast(result.message);
  if (result.ok) refresh();
}

function handleNextSeason() {
  if (!state) return;

  const wasRunning = !autoplayPaused;
  clearSeasonTimer();
  resumeAfterSummary = wasRunning;

  const summary = advanceSeason(state);
  refresh();
  showSummary(summary);
}

function handleAutoSeason() {
  if (!state || autoplayPaused) return;

  const summary = advanceSeason(state);
  refresh();

  const firstMessage = summary.messages[0] ?? "Nothing notable happened.";
  showToast(`${summary.season} ${summary.year}: ${firstMessage}`);
  scheduleNextSeason();
}

function toggleAutoplay() {
  autoplayPaused = !autoplayPaused;
  resumeAfterSummary = false;

  if (autoplayPaused) {
    clearSeasonTimer();
    renderSeasonTimer({
      paused: true,
      seconds: seasonSeconds,
      remainingSeconds: seasonSeconds
    });
  } else {
    scheduleNextSeason();
  }
}

function setSeasonSeconds(value) {
  const parsed = Number.parseInt(value, 10);
  seasonSeconds = Number.isFinite(parsed)
    ? Math.min(MAX_SEASON_SECONDS, Math.max(MIN_SEASON_SECONDS, parsed))
    : DEFAULT_SEASON_SECONDS;

  if (autoplayPaused || !state) {
    renderSeasonTimer({
      paused: autoplayPaused,
      seconds: seasonSeconds,
      remainingSeconds: seasonSeconds
    });
    return;
  }

  scheduleNextSeason();
}

function handleSummaryClosed() {
  if (!resumeAfterSummary) return;
  resumeAfterSummary = false;
  scheduleNextSeason();
}

function scheduleNextSeason() {
  clearSeasonTimer();

  if (!state || autoplayPaused) {
    renderSeasonTimer({
      paused: autoplayPaused,
      seconds: seasonSeconds,
      remainingSeconds: seasonSeconds
    });
    return;
  }

  seasonDeadline = Date.now() + seasonSeconds * 1000;
  renderCountdown();
  countdownTimer = window.setInterval(renderCountdown, 100);
  seasonAdvanceTimer = window.setTimeout(handleAutoSeason, seasonSeconds * 1000);
}

function renderCountdown() {
  const remainingSeconds = seasonDeadline
    ? Math.max(0, (seasonDeadline - Date.now()) / 1000)
    : seasonSeconds;

  renderSeasonTimer({
    paused: autoplayPaused,
    seconds: seasonSeconds,
    remainingSeconds
  });
}

function clearSeasonTimer() {
  if (seasonAdvanceTimer !== null) {
    window.clearTimeout(seasonAdvanceTimer);
    seasonAdvanceTimer = null;
  }

  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }

  seasonDeadline = null;
}
