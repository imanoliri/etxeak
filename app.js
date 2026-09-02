(() => {
  // Roughly matches the geographic extent selected for MVP-0:
  // the Gipuzkoa coast and inland valleys, plus adjoining northern Navarre.
  const PLAYABLE_BOUNDS = L.latLngBounds(
    [42.88, -2.42],
    [43.48, -1.65]
  );

  const map = L.map("map", {
    zoomControl: true,
    attributionControl: true,
    minZoom: 9,
    maxZoom: 19,
    maxBounds: PLAYABLE_BOUNDS.pad(0.12),
    maxBoundsViscosity: 0.82
  });

  const topo = L.tileLayer(
    "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    {
      maxNativeZoom: 17,
      maxZoom: 17,
      detectRetina: true,
      attribution:
        'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style © <a href="https://opentopomap.org">OpenTopoMap</a>'
    }
  );

  const street = L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxNativeZoom: 19,
      maxZoom: 19,
      detectRetina: true,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  );

  street.addTo(map);

  L.control.layers(
    {
      "OpenStreetMap · detailed": street,
      "Topographic · regional": topo
    },
    null,
    {
      collapsed: true,
      position: "topright"
    }
  ).addTo(map);

  L.rectangle(PLAYABLE_BOUNDS, {
    color: "#263b31",
    weight: 2,
    opacity: 0.62,
    fillColor: "#f1e5bd",
    fillOpacity: 0.045,
    dashArray: "8 7",
    interactive: false
  }).addTo(map);

  const labels = [
    { name: "Donostia", coords: [43.3183, -1.9812] },
    { name: "Tolosa", coords: [43.1348, -2.0780] },
    { name: "Beasain", coords: [43.0504, -2.2007] },
    { name: "Irun", coords: [43.3390, -1.7894] },
    { name: "Goizueta", coords: [43.1716, -1.8640] }
  ];

  labels.forEach(({ name, coords }) => {
    L.marker(coords, {
      interactive: false,
      icon: L.divIcon({
        className: "region-label",
        html: name,
        iconSize: [90, 20],
        iconAnchor: [45, 10]
      })
    }).addTo(map);
  });

  map.fitBounds(PLAYABLE_BOUNDS, {
    paddingTopLeft: [18, 86],
    paddingBottomRight: [18, 40]
  });
})();
