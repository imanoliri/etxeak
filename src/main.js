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
  showPlacement,
  showSummary,
  showToast,
  startGameUI
} from "./ui.js";

let state = null;
let placementType = null;

const mapContext = createMap(handleMapClick);

bindStaticActions({
  onFamily: () => state && openFamilyPanel(state, familyHandlers),
  onBuild: () => state && openBuildPanel(state, beginPlacement),
  onSlaughter: handleSlaughter,
  onNextSeason: handleNextSeason,
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

  const summary = advanceSeason(state);
  refresh();
  showSummary(summary);
}
