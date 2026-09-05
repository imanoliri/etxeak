// Deterministic, campaign-owned geography for the Urumea prototype. Map tiles
// are presentation only; construction rules query this module.

export const CAMPAIGN_BOUNDS = {
  south: 42.88,
  west: -2.42,
  north: 43.48,
  east: -1.65
};

export const GEOGRAPHY_ZONES = [
  { id: "hernani-valley", name: "Hernani valley floor", center: [43.2641, -1.9748], radiusKm: 3.3, terrain: "valley", elevationM: 45 },
  { id: "oiartzun-valley", name: "Oiartzun valley", center: [43.2992, -1.858], radiusKm: 3.1, terrain: "valley", elevationM: 75 },
  { id: "goizueta-valley", name: "Upper Urumea valley", center: [43.1717, -1.864], radiusKm: 2.8, terrain: "valley", elevationM: 155 },
  { id: "tolosa-valley", name: "Oria valley floor", center: [43.1348, -2.078], radiusKm: 3.2, terrain: "valley", elevationM: 90 }
];

export const MINERAL_DEPOSITS = [
  {
    id: "arditurri-mining-district",
    name: "Arditurri mining district",
    center: [43.2788083, -1.8077961],
    radiusKm: 0.4,
    resources: ["iron", "silver-bearing lead"],
    activeFromYear: 900,
    activeToYear: 1500,
    evidence: "Documented ancient mining district with medieval iron extraction and ironworks.",
    confidence: "high",
    sources: [
      "https://tourism.euskadi.eus/en/cultural-heritage/arditurri-mines/webtur00-content/en/",
      "https://zientzia.eus/artikuluak/arditurri-mendeetan-aberastasun-iturri/en/",
      "https://www.arditurribideberdea.eus/en/arditurri-meatze-gunea/"
    ]
  },
  {
    id: "irugurutzeta-mining-district",
    name: "Irugurutzeta mining district",
    center: [43.3179905, -1.7722181],
    radiusKm: 0.35,
    resources: ["iron"],
    activeFromYear: 900,
    activeToYear: 1500,
    evidence: "Aiako Harria mining locality; municipal history records mining through the Middle Ages.",
    confidence: "medium",
    sources: [
      "https://www.irun.org/es/desarrollo-sostenible/espacios-naturales-protegidos/presentacion/coto-minero-de-irugurutzeta",
      "https://ironrouteinthepyrenees.com/re/the-irugurutzeta-mining-reserve/"
    ]
  }
];

export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const rad = (degrees) => (degrees * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function insideBounds([lat, lon]) {
  return lat >= CAMPAIGN_BOUNDS.south && lat <= CAMPAIGN_BOUNDS.north && lon >= CAMPAIGN_BOUNDS.west && lon <= CAMPAIGN_BOUNDS.east;
}

function nearestZone(coords) {
  return GEOGRAPHY_ZONES
    .map((zone) => ({ zone, distanceKm: haversineKm(coords, zone.center) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
}

export function getGeographyAt(coords, year = 1100) {
  if (!insideBounds(coords)) return { insideCampaign: false, terrain: "outside", slopePercent: null, elevationM: null, drainage: "unknown", mineralDeposit: null };

  const nearest = nearestZone(coords);
  const deposit = MINERAL_DEPOSITS.find(
    (entry) =>
      year >= entry.activeFromYear &&
      year <= entry.activeToYear &&
      haversineKm(coords, entry.center) <= entry.radiusKm
  ) ?? null;
  const radialRise = Math.max(0, nearest.distanceKm - nearest.zone.radiusKm * 0.35);
  const ripple = Math.abs(Math.sin(coords[0] * 173 + coords[1] * 97));
  const slopePercent = Math.round(Math.min(48, radialRise * 5.2 + ripple * 5));
  const elevationM = Math.round(nearest.zone.elevationM + radialRise * 72 + ripple * 24);
  const terrain = deposit ? "exposed-rock" : nearest.distanceKm <= nearest.zone.radiusKm ? "valley" : slopePercent <= 18 ? "hillside" : "upland";
  const drainage = terrain === "valley" && ripple < 0.12 ? "wet" : "drained";

  return {
    insideCampaign: true,
    zoneId: nearest.zone.id,
    zoneName: nearest.zone.name,
    terrain,
    slopePercent,
    elevationM,
    drainage,
    mineralDeposit: deposit && {
      id: deposit.id,
      name: deposit.name,
      resources: [...deposit.resources],
      evidence: deposit.evidence,
      confidence: deposit.confidence,
      sources: [...deposit.sources]
    }
  };
}

const RULES = {
  etxe: {
    valid: (land) => land.terrain !== "exposed-rock" && land.drainage !== "wet" && land.slopePercent <= 25,
    invalidReason: (land) => land.terrain === "exposed-rock" ? "A dwelling cannot be placed on the exposed mineral deposit." : land.drainage === "wet" ? "The ground is too wet for a dwelling." : "The slope is too steep for a dwelling."
  },
  field: {
    valid: (land) => land.terrain === "valley" && land.drainage === "drained" && land.slopePercent <= 12,
    invalidReason: (land) => land.drainage === "wet" ? "The ground is poorly drained for a field." : land.terrain !== "valley" ? "A field needs workable valley land." : "The slope is too steep to clear as a field."
  },
  mine: {
    valid: (land) => Boolean(land.mineralDeposit) && land.terrain === "exposed-rock",
    invalidReason: () => "A mine requires rocky terrain with a configured exposed mineral deposit."
  }
};

export function evaluateBuildSite(type, coords, year = 1100) {
  const geography = getGeographyAt(coords, year);
  if (!geography.insideCampaign) return { valid: false, reason: "The site is outside the campaign geography.", geography };
  const rule = RULES[type];
  if (!rule) return { valid: false, reason: "This project has no geographic placement rule.", geography };
  if (!rule.valid(geography)) return { valid: false, reason: rule.invalidReason(geography), geography };
  return { valid: true, reason: `Suitable ${geography.terrain} terrain.`, geography };
}
