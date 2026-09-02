import { BUILD_TYPES, WORK_AGE, getCurrentSeason, getLivingPeople } from "./simulation.js";
import { OCCUPATIONS } from "./scenarios.js";

const els = {
  title: document.querySelector("#game-title"),
  dateChip: document.querySelector("#date-chip"),
  resourceBar: document.querySelector("#resource-bar"),
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
  els.closePanel.addEventListener("click", closePanel);
  els.closeSummary.addEventListener("click", () => els.summaryOverlay.classList.add("is-hidden"));
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
  renderHud(state);
}

export function renderHud(state) {
  els.title.textContent = state.familyName;
  els.dateChip.textContent = `${getCurrentSeason(state)} · ${state.date.year}`;

  const resources = [
    ["Food", state.stores.food],
    ["Wood", state.stores.wood],
    ["Stone", state.stores.stone],
    ["Livestock", state.stores.livestock],
    ["People", getLivingPeople(state).length],
    ["Etxeak", state.residences.length]
  ];

  els.resourceBar.innerHTML = resources
    .map(
      ([label, value]) => `
        <div class="resource-item">
          <span class="resource-label">${label}</span>
          <span class="resource-value">${value}</span>
        </div>
      `
    )
    .join("");

  els.slaughterButton.classList.toggle("is-hidden", getCurrentSeason(state) !== "Autumn");
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
      const residents = getLivingPeople(state).filter(
        (person) => person.residenceId === residence.id
      ).length;
      return `
        <div class="etxe-row">
          <div class="etxe-head"><strong>${residence.name}</strong><span>${residents} people</span></div>
          <span class="muted">Founded ${residence.foundedYear}</span>
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
    .map(
      (residence) =>
        `<option value="${residence.id}" ${residence.id === person.residenceId ? "selected" : ""}>${residence.name}</option>`
    )
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
  const assets = state.assets.filter((asset) => asset.residenceId === residence.id);

  els.panelKicker.textContent = "ETXE";
  els.panelTitle.textContent = residence.name;
  els.panelContent.innerHTML = `
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
      ? "Tap within 5 km of one of your etxeak to clear a field."
      : "Tap the map where the new etxe should be built.";
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
