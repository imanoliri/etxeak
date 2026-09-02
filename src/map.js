import { ETXE_WORK_RADIUS_KM, getResidenceCapacity, getResidencePopulation } from "./simulation.js";
import { getScenarioProducedResources, getTradeDistanceKm, getResourceLabel } from "./commerce.js";

const PLAYABLE_BOUNDS = window.L.latLngBounds(
  [42.88, -2.42],
  [43.48, -1.65]
);

const markerKinds = {
  field: "field",
  forest: "forest",
  pasture: "pasture",
  mine: "mine"
};


function markerSvg(kind) {
  const icons = {
    home: '<path d="M4 11.5 12 5l8 6.5v8H14v-5h-4v5H4z"/>',
    field: '<path d="M12 21V5"/><path d="M12 8c-3 0-5-1.8-5-4 3 0 5 1.8 5 4Z"/><path d="M12 11c3 0 5-1.8 5-4-3 0-5 1.8-5 4Z"/><path d="M12 14c-3 0-5-1.8-5-4 3 0 5 1.8 5 4Z"/><path d="M12 17c3 0 5-1.8 5-4-3 0-5 1.8-5 4Z"/>',
    forest: '<path d="M12 3 7 10h3l-5 7h5v4h4v-4h5l-5-7h3z"/>',
    pasture: '<path d="M7 11.5c0-2.5 2-4.5 4.5-4.5H15c2.8 0 5 2.2 5 5v2.5h-2v4h-2v-4H9v4H7v-4H5.5A1.5 1.5 0 0 1 4 13v-1.5h3Z"/><path d="M7 11.5V8.8A2.8 2.8 0 0 0 4.2 6H3"/><circle cx="16.5" cy="10" r=".7"/>',
    mine: '<path d="m7 6 10 10M17 6 7 16"/><path d="M5 5h5M14 5h5"/>',
    project: '<path d="M5 18h14M7 18l2-9h6l2 9M10 9V6h4v3"/>',
    scenario: '<path d="M12 3l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z"/>',
    trade: '<path d="M4 7h13"/><path d="m14 4 3 3-3 3"/><path d="M20 17H7"/><path d="m10 14-3 3 3 3"/>'
  };

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[kind] ?? icons.project}</svg>`;
}

function divIcon(kind, className = "", badgeText = "") {
  return window.L.divIcon({
    className: "",
    html: `<div class="marker-stack"><div class="game-marker ${className}" data-kind="${kind}">${markerSvg(kind)}</div>${badgeText ? `<span class="marker-capacity">${badgeText}</span>` : ""}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
}

export function createMap(onMapClick) {
  const map = window.L.map("map", {
    zoomControl: false,
    attributionControl: true,
    minZoom: 9,
    maxZoom: 19,
    maxBounds: PLAYABLE_BOUNDS.pad(0.12),
    maxBoundsViscosity: 0.82
  });

  const topo = window.L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    maxNativeZoom: 17,
    maxZoom: 19,
    detectRetina: true,
    attribution:
      'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style © <a href="https://opentopomap.org">OpenTopoMap</a>'
  });

  const street = window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxNativeZoom: 19,
    maxZoom: 19,
    detectRetina: true,
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  topo.addTo(map);

  window.L.control.layers(
    {
      "Topographic": topo,
      "OpenStreetMap": street
    },
    null,
    { collapsed: true, position: "topright" }
  ).addTo(map);

  window.L.control.zoom({ position: "topright" }).addTo(map);

  window.L.rectangle(PLAYABLE_BOUNDS, {
    color: "#263b31",
    weight: 2,
    opacity: 0.5,
    fillColor: "#f1e5bd",
    fillOpacity: 0.035,
    dashArray: "8 7",
    interactive: false
  }).addTo(map);

  map.fitBounds(PLAYABLE_BOUNDS, {
    paddingTopLeft: [18, 112],
    paddingBottomRight: [18, 70]
  });

  map.on("click", (event) => onMapClick?.([event.latlng.lat, event.latlng.lng]));

  const gameLayer = window.L.layerGroup().addTo(map);
  const previewLayer = window.L.layerGroup().addTo(map);
  const commerceLayer = window.L.layerGroup().addTo(map);

  return { map, gameLayer, previewLayer, commerceLayer };
}

export function showScenarioPreviews(mapContext, scenarios, onChoose) {
  mapContext.previewLayer.clearLayers();

  scenarios.forEach((scenario) => {
    const marker = window.L.marker(scenario.center, {
      icon: divIcon("scenario")
    });
    marker.bindPopup(
      `<strong>${scenario.familyName}</strong><br><span>${scenario.placeName}</span>`
    );
    marker.on("click", () => onChoose?.(scenario.id));
    marker.addTo(mapContext.previewLayer);
  });
}

export function clearScenarioPreviews(mapContext) {
  mapContext.previewLayer.clearLayers();
}

export function showCommercePartners(mapContext, scenarios, activeScenarioId, state, onChoose) {
  mapContext.commerceLayer.clearLayers();

  const partners = scenarios.filter((scenario) => scenario.id !== activeScenarioId);
  for (const scenario of partners) {
    const produced = getScenarioProducedResources(scenario);
    const distanceKm = getTradeDistanceKm(state, scenario);
    const marker = window.L.marker(scenario.center, {
      icon: divIcon("trade", "commerce")
    });

    const producedText = produced.map((resource) => getResourceLabel(resource)).join(", ");
    marker.bindPopup(
      `<strong>${scenario.familyName}</strong><br><span>${scenario.placeName}</span><br><span>${distanceKm.toFixed(1)} km away</span><br><span>Produces: ${producedText || "nothing tradable"}</span>`
    );
    marker.bindTooltip(`${scenario.familyName} · trade`, { direction: "top" });
    marker.on("click", () => onChoose?.(scenario.id));
    marker.addTo(mapContext.commerceLayer);
  }

  const points = [
    ...state.residences.map((residence) => residence.coords),
    ...partners.map((scenario) => scenario.center)
  ];
  if (points.length > 1) {
    mapContext.map.fitBounds(window.L.latLngBounds(points), {
      paddingTopLeft: [28, 130],
      paddingBottomRight: [28, 100],
      maxZoom: 11
    });
  }
}

export function clearCommercePartners(mapContext) {
  mapContext.commerceLayer.clearLayers();
}

export function renderGameState(mapContext, state, handlers = {}) {
  mapContext.gameLayer.clearLayers();
  const seasonSummary = handlers.seasonSummary ?? null;

  state.residences.forEach((residence) => {
    const residents = getResidencePopulation(state, residence.id);
    const capacity = getResidenceCapacity(residence);

    window.L.circle(residence.coords, {
      radius: ETXE_WORK_RADIUS_KM * 1000,
      color: "#315642",
      weight: 1.5,
      opacity: 0.4,
      fillColor: "#315642",
      fillOpacity: 0.045,
      dashArray: "5 6",
      interactive: false
    }).addTo(mapContext.gameLayer);

    const marker = window.L.marker(residence.coords, {
      icon: divIcon("home", residence.opened ? "" : "unopened", residence.opened ? `${residents}/${capacity}` : "new")
    });
    marker.bindPopup(
      `<strong>${residence.name}</strong><br><span>${residence.opened ? `${residents}/${capacity} residents` : "Built · not yet opened"}</span><br><span>${ETXE_WORK_RADIUS_KM} km work radius</span>`
    );
    marker.on("click", () => handlers.onResidence?.(residence.id));
    marker.addTo(mapContext.gameLayer);
  });

  state.assets.forEach((asset) => {
    const sowingFailed =
      asset.type === "field" &&
      asset.state?.sowingFailed === true &&
      asset.state?.sowingFailureReason === "no-seed";
    const markerClass = sowingFailed ? "asset sowing-failed" : "asset";
    const marker = window.L.marker(asset.coords, {
      icon: divIcon(markerKinds[asset.type] ?? "project", markerClass)
    });
    const failureText = sowingFailed ? " · sowing failed: no seed" : "";
    marker.bindTooltip(`${asset.name}${failureText}`, { direction: "top" });
    marker.on("click", () => handlers.onAsset?.(asset.id));
    marker.addTo(mapContext.gameLayer);
  });

  state.projects.forEach((project) => {
    const marker = window.L.marker(project.coords, {
      icon: divIcon("project", "project")
    });
    marker.bindTooltip(
      `${project.name}: ${project.progress}/${project.workRequired} work`,
      { direction: "top" }
    );
    marker.addTo(mapContext.gameLayer);
  });

  const workedLocations = new Map();
  for (const activity of seasonSummary?.activities ?? []) {
    const key = activity.coords.join(",");
    const existing = workedLocations.get(key);
    if (existing) {
      existing.workers += activity.workers;
      existing.labels.push(activity.label);
    } else {
      workedLocations.set(key, {
        coords: activity.coords,
        workers: activity.workers,
        labels: [activity.label]
      });
    }
  }

  for (const activity of workedLocations.values()) {
    const count = activity.workers > 1 ? `×${activity.workers}` : "";
    const icon = window.L.divIcon({
      className: "",
      html: `<div class="worker-marker" aria-label="${activity.workers} worker${activity.workers === 1 ? "" : "s"}">👤<span>${count}</span></div>`,
      iconSize: [34, 26],
      iconAnchor: [2, 28]
    });
    const marker = window.L.marker(activity.coords, {
      icon,
      interactive: false,
      keyboard: false
    });
    marker.bindTooltip(
      `${activity.workers} worker${activity.workers === 1 ? "" : "s"} · ${activity.labels.join(", ")}`,
      { direction: "right", offset: [12, -8] }
    );
    marker.addTo(mapContext.gameLayer);
  }
}

export function focusOn(mapContext, coords, zoom = 13) {
  mapContext.map.flyTo(coords, zoom, { duration: 0.6 });
}
