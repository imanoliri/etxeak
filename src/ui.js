import {
  BUILD_TYPES,
  ETXE_WORK_RADIUS_KM,
  WORK_AGE,
  getCurrentSeason,
  getLivingPeople,
  getResidenceCapacity,
  getResidencePopulation
} from "./simulation.js";
import { OCCUPATIONS } from "./scenarios.js";

const els = {
  title: document.querySelector("#game-title"),
  dateChip: document.querySelector("#date-chip"),
  seasonClock: document.querySelector("#season-clock"),
  timerToggle: document.querySelector("#timer-toggle"),
  timerSeconds: document.querySelector("#timer-seconds"),
  timerCountdown: document.querySelector("#timer-countdown"),
  resourceBar: document.querySelector("#resource-bar"),
  seasonFeedback: document.querySelector("#season-feedback"),
  actionDock: document.querySelector("#action-dock"),
  familyButton: document.querySelector("#family-button"),
  buildButton: document.querySelector("#build-button"),
  slaughterButton: document.querySelector("#slaughter-button"),
  nextSeasonButton: document.querySelector("#next-season-button"),
  sidePanel: document.querySelector("#side-panel"),
  panelKicker: document.querySelector("#panel-kicker"),
  panelTitle: document.querySelector("#panel-title"),
  panelContent: document.querySelector("#panel-content"),
  closePanel: document.querySelector("#close-panel"),
  setupOverlay: document.querySelector("#setup-overlay"),
  scenarioList: document.querySelector("#scenario-list"),
  summaryOverlay: document.querySelector("#summary-overlay"),
  summaryTitle: document.querySelector("#summary-title"),
  summaryContent: document.querySelector("#summary-content"),
  closeSummary: document.querySelector("#close-summary"),
  placementBanner: document.querySelector("#placement-banner"),
  placementText: document.querySelector("#placement-text"),
  cancelPlacement: document.querySelector("#cancel-placement"),
  toast: document.querySelector("#toast")
};

let toastTimer = null;

export function bindStaticActions(handlers) {
  els.familyButton.addEventListener("click", handlers.onFamily);
  els.buildButton.addEventListener("click", handlers.onBuild);
  els.slaughterButton.addEventListener("click", handlers.onSlaughter);
  els.nextSeasonButton.addEventListener("click", handlers.onNextSeason);
  els.timerToggle.addEventListener("click", handlers.onToggleAutoplay);
  els.timerSeconds.addEventListener("change", (event) => handlers.onTimerSeconds(event.target.value));
  els.closePanel.addEventListener("click", closePanel);
  els.closeSummary.addEventListener("click", () => {
    els.summaryOverlay.classList.add("is-hidden");
    handlers.onCloseSummary?.();
  });
  els.cancelPlacement.addEventListener("click", handlers.onCancelPlacement);
}

export function renderScenarioSelection(scenarios, onChoose) {
  els.scenarioList.innerHTML = "";

  scenarios.forEach((scenario) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "scenario-card";
    card.innerHTML = `
      <span class="scenario-place">${scenario.placeName}</span>
      <strong>${scenario.familyName}</strong>
      <span class="scenario-description">${scenario.description}</span>
      <span class="scenario-stats">
        <span>${scenario.people.length} people</span>
        <span>${scenario.assets.filter((asset) => asset.type === "field").length} fields</span>
        <span>${scenario.stores.livestock} animals</span>
        <span>${scenario.stores.wood} wood</span>
      </span>
    `;
    card.addEventListener("click", () => onChoose(scenario.id));
    els.scenarioList.append(card);
  });
}

export function startGameUI(state) {
  els.setupOverlay.classList.add("is-hidden");
  els.actionDock.classList.remove("is-hidden");
  els.resourceBar.classList.remove("is-hidden");
  els.seasonClock.classList.remove("is-hidden");
  renderHud(state);
}

export function renderSeasonTimer({ paused, seconds, remainingSeconds }) {
  els.timerSeconds.value = String(seconds);
  els.timerToggle.textContent = paused ? "Play" : "Pause";
  els.timerToggle.setAttribute("aria-pressed", paused ? "true" : "false");
  els.timerCountdown.textContent = paused ? "paused" : `${Math.max(0, remainingSeconds).toFixed(1)}s`;
}

export function renderHud(state, seasonSummary = null) {
  els.title.textContent = state.familyName;
  els.dateChip.textContent = `${getCurrentSeason(state)} · ${state.date.year}`;

  const resources = [
    { key: "food", icon: "🌾", label: "Food", value: state.stores.food },
    { key: "wood", icon: "🪵", label: "Wood", value: state.stores.wood },
    { key: "stone", icon: "🪨", label: "Stone", value: state.stores.stone },
    { key: "livestock", icon: "🐑", label: "Animals", value: state.stores.livestock },
    { key: "people", icon: "👥", label: "People", value: getLivingPeople(state).length },
    { key: "etxeak", icon: "🏠", label: "Etxeak", value: state.residences.length }
  ];

  els.resourceBar.innerHTML = resources
    .map(({ key, icon, label, value }) => {
      const delta = seasonSummary?.resourceDeltas?.[key] ?? 0;
      const deltaText = delta === 0 ? "" : `${delta > 0 ? "+" : ""}${delta}`;
      const deltaClass = delta > 0 ? "is-positive" : delta < 0 ? "is-negative" : "";
      return `
        <div class="resource-item">
          <span class="resource-label"><span class="resource-emoji" aria-hidden="true">${icon}</span>${label}</span>
          <span class="resource-value">${value}</span>
          <span class="resource-delta ${deltaClass}">${deltaText}</span>
        </div>
      `;
    })
    .join("");

  renderSeasonFeedback(seasonSummary);
  els.slaughterButton.classList.toggle("is-hidden", getCurrentSeason(state) !== "Autumn");
}

function renderSeasonFeedback(summary) {
  if (!summary) {
    els.seasonFeedback.classList.add("is-hidden");
    els.seasonFeedback.innerHTML = "";
    return;
  }

  const messages = summary.messages.filter((message) => !isRoutineEconomicMessage(message));

  if (messages.length === 0) {
    els.seasonFeedback.classList.add("is-hidden");
    els.seasonFeedback.innerHTML = "";
    return;
  }

  els.seasonFeedback.innerHTML = `
    <strong>${summary.season} ${summary.year}</strong>
    <div class="season-feedback-items">
      ${messages.map((message) => `<span class="season-feedback-item">${message}</span>`).join("")}
    </div>
  `;
  els.seasonFeedback.classList.remove("is-hidden");
}

function isRoutineEconomicMessage(message) {
  return (
    message.startsWith("Household consumption:") ||
    message.includes(": sown (") ||
    message.includes(": could not be sown") ||
    message.includes(": crop tended.") ||
    message.includes(": harvested +") ||
    message.includes(": harvest was lost") ||
    /: \+\d+ wood\.$/.test(message) ||
    /: \+\d+ stone\.$/.test(message) ||
    message.includes(": livestock increased by ") ||
    message.includes("food from animal products") ||
    message.includes("construction work.")
  );
}

export function openFamilyPanel(state, handlers) {
  els.panelKicker.textContent = "FAMILY";
  els.panelTitle.textContent = state.familyName;

  const genealogy = genealogyHtml(state);
  const peopleHtml = getLivingPeople(state)
    .sort((a, b) => b.age - a.age)
    .map((person) => personRow(state, person))
    .join("");

  const residencesHtml = state.residences
    .map((residence) => {
      const residents = getResidencePopulation(state, residence.id);
      const capacity = getResidenceCapacity(residence);
      return `
        <div class="etxe-row">
          <div class="etxe-head"><strong>${residence.name}</strong><span>${residents}/${capacity} people</span></div>
          <span class="muted">Founded ${residence.foundedYear} · ${ETXE_WORK_RADIUS_KM} km work radius</span>
        </div>
      `;
    })
    .join("");

  els.panelContent.innerHTML = `
    <section class="panel-section">
      <h3>Family tree</h3>
      ${genealogy}
    </section>
    <section class="panel-section">
      <h3>People</h3>
      ${peopleHtml}
    </section>
    <section class="panel-section">
      <h3>Etxeak</h3>
      ${residencesHtml}
    </section>
  `;

  els.panelContent.querySelectorAll("[data-occupation]").forEach((select) => {
    select.addEventListener("change", (event) => {
      handlers.onOccupation(event.target.dataset.occupation, event.target.value);
    });
  });

  els.panelContent.querySelectorAll("[data-residence]").forEach((select) => {
    select.addEventListener("change", (event) => {
      handlers.onMovePerson(event.target.dataset.residence, event.target.value);
    });
  });

  els.sidePanel.classList.remove("is-hidden");
}

function genealogyHtml(state) {
  const heads = state.people.filter((person) => person.role === "head").slice(0, 2);
  const headIds = new Set(heads.map((person) => person.id));
  const children = state.people
    .filter((person) => person.parentIds?.some((parentId) => headIds.has(parentId)))
    .sort((a, b) => b.age - a.age);

  const personLabel = (person) => `
    <span class="genealogy-person ${person.alive ? "" : "is-deceased"}">
      <strong>${person.givenName} ${person.surname}</strong>
      <small>${person.alive ? `${person.age} years` : `died at ${person.age}`}</small>
    </span>
  `;

  return `
    <div class="genealogy-tree">
      <div class="genealogy-couple">
        ${heads.map(personLabel).join('<span class="genealogy-link">×</span>')}
      </div>
      <div class="genealogy-stem" aria-hidden="true"></div>
      <div class="genealogy-children">
        ${children.map(personLabel).join("") || '<span class="muted">No children recorded.</span>'}
      </div>
    </div>
  `;
}

function personRow(state, person) {
  const child = person.age < WORK_AGE;
  const occupationOptions = OCCUPATIONS.map(
    (occupation) =>
      `<option value="${occupation}" ${occupation === person.occupation ? "selected" : ""}>${occupation}</option>`
  ).join("");
  const residenceOptions = state.residences
    .map((residence) => {
      const residents = getResidencePopulation(state, residence.id);
      const capacity = getResidenceCapacity(residence);
      const isCurrent = residence.id === person.residenceId;
      const full = residents >= capacity && !isCurrent;
      return `<option value="${residence.id}" ${isCurrent ? "selected" : ""} ${full ? "disabled" : ""}>${residence.name} (${residents}/${capacity})${full ? " — full" : ""}</option>`;
    })
    .join("");

  return `
    <div class="person-row">
      <div class="person-head">
        <strong>${person.givenName} ${person.surname}</strong>
        <span>${person.age}</span>
      </div>
      <span class="person-meta">${person.role === "head" ? "Household head" : child ? "Child" : "Family member"}</span>
      <div class="person-controls">
        <label>
          Occupation
          <select data-occupation="${person.id}" ${child ? "disabled" : ""}>
            ${occupationOptions}
          </select>
        </label>
        <label>
          Residence
          <select data-residence="${person.id}">
            ${residenceOptions}
          </select>
        </label>
      </div>
    </div>
  `;
}

export function openBuildPanel(state, onStartPlacement) {
  els.panelKicker.textContent = "BUILD";
  els.panelTitle.textContent = "Develop the family";

  const projectHtml =
    state.projects.length === 0
      ? '<p class="muted">No active projects.</p>'
      : state.projects
          .map((project) => {
            const percent = Math.round((project.progress / project.workRequired) * 100);
            return `
              <div class="project-row">
                <div class="project-head"><strong>${project.name}</strong><span>${project.progress}/${project.workRequired}</span></div>
                <div class="progress-track"><div class="progress-value" style="width:${percent}%"></div></div>
              </div>
            `;
          })
          .join("");

  els.panelContent.innerHTML = `
    <section class="panel-section">
      <h3>New project</h3>
      ${buildButton("etxe", state)}
      ${buildButton("field", state)}
      <p class="muted">Projects only progress when at least one working-age family member has the Builder occupation.</p>
    </section>
    <section class="panel-section">
      <h3>Active projects</h3>
      ${projectHtml}
    </section>
  `;

  els.panelContent.querySelectorAll("[data-build]").forEach((button) => {
    button.addEventListener("click", () => onStartPlacement(button.dataset.build));
  });

  els.sidePanel.classList.remove("is-hidden");
}

function buildButton(type, state) {
  const definition = BUILD_TYPES[type];
  const cost = Object.entries(definition.cost)
    .map(([resource, amount]) => `${amount} ${resource}`)
    .join(" · ");

  return `
    <div class="asset-row">
      <div class="asset-head"><strong>${definition.label}</strong><span>${definition.workRequired} work</span></div>
      <span class="muted">Cost: ${cost}</span>
      <button type="button" data-build="${type}">Choose location</button>
    </div>
  `;
}

export function openResidencePanel(state, residenceId) {
  const residence = state.residences.find((entry) => entry.id === residenceId);
  if (!residence) return;

  const residents = getLivingPeople(state).filter(
    (person) => person.residenceId === residence.id
  );
  const capacity = getResidenceCapacity(residence);
  const assets = state.assets.filter((asset) => asset.residenceId === residence.id);

  els.panelKicker.textContent = "ETXE";
  els.panelTitle.textContent = residence.name;
  els.panelContent.innerHTML = `
    <section class="panel-section">
      <div class="etxe-capacity-card">
        <strong>👥 ${residents.length}/${capacity}</strong>
        <span>${residents.length >= capacity ? "Full — no births or additional residents" : `${capacity - residents.length} spaces available`}</span>
        <small>Work radius: ${ETXE_WORK_RADIUS_KM} km</small>
      </div>
    </section>
    <section class="panel-section">
      <h3>Residents</h3>
      ${residents.map((person) => `<div class="asset-row"><strong>${person.givenName} ${person.surname}</strong><span class="muted">${person.age} · ${person.occupation}</span></div>`).join("") || '<p class="muted">No residents yet.</p>'}
    </section>
    <section class="panel-section">
      <h3>Assets</h3>
      ${assets.map((asset) => `<div class="asset-row"><strong>${asset.name}</strong><span class="muted">${asset.type}</span></div>`).join("") || '<p class="muted">No attached productive assets.</p>'}
    </section>
  `;
  els.sidePanel.classList.remove("is-hidden");
}

export function openAssetPanel(state, assetId) {
  const asset = state.assets.find((entry) => entry.id === assetId);
  if (!asset) return;

  const residence = state.residences.find((entry) => entry.id === asset.residenceId);
  els.panelKicker.textContent = asset.type;
  els.panelTitle.textContent = asset.name;

  let detail = "";
  if (asset.type === "field") {
    detail = `Sown: ${asset.state.sown ? "yes" : "no"} · Tended: ${asset.state.tended ? "yes" : "no"}`;
  }

  els.panelContent.innerHTML = `
    <section class="panel-section">
      <div class="asset-row">
        <strong>${asset.type}</strong>
        <span class="muted">Attached to ${residence?.name ?? "unknown etxe"}</span>
        ${detail ? `<span class="muted">${detail}</span>` : ""}
      </div>
    </section>
  `;
  els.sidePanel.classList.remove("is-hidden");
}

export function closePanel() {
  els.sidePanel.classList.add("is-hidden");
}

export function showPlacement(type) {
  const definition = BUILD_TYPES[type];
  els.placementText.textContent =
    type === "field"
      ? `Tap within ${ETXE_WORK_RADIUS_KM} km of one of your etxeak to clear a field.`
      : `Tap within ${ETXE_WORK_RADIUS_KM} km of an existing etxe so builders can reach the site.`;
  els.placementBanner.classList.remove("is-hidden");
  closePanel();
}

export function hidePlacement() {
  els.placementBanner.classList.add("is-hidden");
}

export function showSummary(summary) {
  els.summaryTitle.textContent = `${summary.season} ${summary.year}`;
  els.summaryContent.innerHTML = (
    summary.messages.length ? summary.messages : ["Nothing notable happened this season."]
  )
    .map((message) => `<div class="summary-line">${message}</div>`)
    .join("");
  els.summaryOverlay.classList.remove("is-hidden");
}

export function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.remove("is-hidden");
  toastTimer = setTimeout(() => els.toast.classList.add("is-hidden"), 2600);
}
