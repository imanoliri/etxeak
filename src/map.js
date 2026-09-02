const PLAYABLE_BOUNDS = window.L.latLngBounds(
  [42.88, -2.42],
  [43.48, -1.65]
);

const markerCodes = {
  field: "F",
  forest: "W",
  pasture: "P",
  mine: "M"
};

function divIcon(label, className = "") {
  return window.L.divIcon({
    className: "",
    html: `<div class="game-marker ${className}">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

export function createMap(onMapClick) {
  const map = window.L.map("map", {
    zoomControl: true,
    attributionControl: true,
    minZoom: 9,
    maxZoom: 19,
    maxBounds: PLAYABLE_BOUNDS.pad(0.12),
    maxBoundsViscosity: 0.82
  });

  const topo = window.L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    maxNativeZoom: 17,
    maxZoom: 17,
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

  return { map, gameLayer, previewLayer };
}

export function showScenarioPreviews(mapContext, scenarios, onChoose) {
  mapContext.previewLayer.clearLayers();

  scenarios.forEach((scenario) => {
    const marker = window.L.marker(scenario.center, {
      icon: divIcon("S")
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

export function renderGameState(mapContext, state, handlers = {}) {
  mapContext.gameLayer.clearLayers();

  state.residences.forEach((residence) => {
    const residents = state.people.filter(
      (person) => person.alive && person.residenceId === residence.id
    ).length;
    const marker = window.L.marker(residence.coords, {
      icon: divIcon("E")
    });
    marker.bindPopup(
      `<strong>${residence.name}</strong><br><span>${residents} resident${residents === 1 ? "" : "s"}</span>`
    );
    marker.on("click", () => handlers.onResidence?.(residence.id));
    marker.addTo(mapContext.gameLayer);
  });

  state.assets.forEach((asset) => {
    const marker = window.L.marker(asset.coords, {
      icon: divIcon(markerCodes[asset.type] ?? "A", "asset")
    });
    marker.bindTooltip(asset.name, { direction: "top" });
    marker.on("click", () => handlers.onAsset?.(asset.id));
    marker.addTo(mapContext.gameLayer);
  });

  state.projects.forEach((project) => {
    const marker = window.L.marker(project.coords, {
      icon: divIcon("…", "project")
    });
    marker.bindTooltip(
      `${project.name}: ${project.progress}/${project.workRequired} work`,
      { direction: "top" }
    );
    marker.addTo(mapContext.gameLayer);
  });
}

export function focusOn(mapContext, coords, zoom = 13) {
  mapContext.map.flyTo(coords, zoom, { duration: 0.6 });
}
