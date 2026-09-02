export const OCCUPATIONS = [
  "Farmer",
  "Herder",
  "Forestry",
  "Miner",
  "Builder",
  "Unassigned"
];

const people = (entries) =>
  entries.map(([id, givenName, surname, sex, age, role, occupation]) => ({
    id,
    givenName,
    surname,
    sex,
    age,
    role,
    occupation,
    alive: true,
    residenceId: "etxe-1"
  }));

export const STARTING_SCENARIOS = [
  {
    id: "irizar-etxezarreta",
    familyName: "Irizar Etxezarreta",
    placeName: "Hernani · Urumea",
    description:
      "A relatively balanced valley household with two fields, livestock and woodland access. The easiest starting economy.",
    center: [43.2641, -1.9748],
    seed: 110011,
    stores: { food: 38, wood: 13, stone: 7, livestock: 5 },
    people: people([
      ["p1", "Eneko", "Irizar", "M", 36, "head", "Farmer"],
      ["p2", "Toda", "Etxezarreta", "F", 32, "head", "Herder"],
      ["p3", "Gartzea", "Irizar", "M", 15, "child", "Farmer"],
      ["p4", "Oneka", "Irizar", "F", 13, "child", "Forestry"],
      ["p5", "Lope", "Irizar", "M", 9, "child", "Unassigned"],
      ["p6", "Maria", "Irizar", "F", 6, "child", "Unassigned"],
      ["p7", "Martin", "Irizar", "M", 3, "child", "Unassigned"]
    ]),
    assets: [
      { id: "a1", type: "field", name: "Lower field", coords: [43.267, -1.978], residenceId: "etxe-1", state: {} },
      { id: "a2", type: "field", name: "River field", coords: [43.261, -1.969], residenceId: "etxe-1", state: {} },
      { id: "a3", type: "pasture", name: "Shared pasture", coords: [43.271, -1.968], residenceId: "etxe-1", state: {} },
      { id: "a4", type: "forest", name: "Woodland", coords: [43.257, -1.982], residenceId: "etxe-1", state: {} }
    ]
  },
  {
    id: "oiarbide-aranburu",
    familyName: "Oiarbide Aranburu",
    placeName: "Oiartzun valley",
    description:
      "A woodland-heavy household with strong building potential but only one established field.",
    center: [43.2992, -1.858],
    seed: 110022,
    stores: { food: 34, wood: 20, stone: 6, livestock: 6 },
    people: people([
      ["p1", "Gartzea", "Oiarbide", "M", 39, "head", "Forestry"],
      ["p2", "Sancha", "Aranburu", "F", 35, "head", "Herder"],
      ["p3", "Eneko", "Oiarbide", "M", 17, "child", "Builder"],
      ["p4", "Toda", "Oiarbide", "F", 14, "child", "Farmer"],
      ["p5", "Lope", "Oiarbide", "M", 10, "child", "Unassigned"],
      ["p6", "Oneka", "Oiarbide", "F", 5, "child", "Unassigned"]
    ]),
    assets: [
      { id: "a1", type: "field", name: "House field", coords: [43.297, -1.862], residenceId: "etxe-1", state: {} },
      { id: "a2", type: "pasture", name: "Hillside pasture", coords: [43.305, -1.85], residenceId: "etxe-1", state: {} },
      { id: "a3", type: "forest", name: "Upper woodland", coords: [43.307, -1.867], residenceId: "etxe-1", state: {} },
      { id: "a4", type: "forest", name: "Lower woodland", coords: [43.291, -1.851], residenceId: "etxe-1", state: {} }
    ]
  },
  {
    id: "aldaz-goienetxe",
    familyName: "Aldaz Goienetxe",
    placeName: "Goizueta · upper Urumea",
    description:
      "An upland household rich in animals and woodland, but with less food security and limited arable land.",
    center: [43.1717, -1.864],
    seed: 110033,
    stores: { food: 31, wood: 16, stone: 8, livestock: 8 },
    people: people([
      ["p1", "Lope", "Aldaz", "M", 41, "head", "Herder"],
      ["p2", "Oneka", "Goienetxe", "F", 37, "head", "Forestry"],
      ["p3", "Martin", "Aldaz", "M", 18, "child", "Builder"],
      ["p4", "Maria", "Aldaz", "F", 15, "child", "Farmer"],
      ["p5", "Gartzea", "Aldaz", "M", 12, "child", "Herder"],
      ["p6", "Toda", "Aldaz", "F", 8, "child", "Unassigned"],
      ["p7", "Eneko", "Aldaz", "M", 4, "child", "Unassigned"]
    ]),
    assets: [
      { id: "a1", type: "field", name: "Valley field", coords: [43.169, -1.859], residenceId: "etxe-1", state: {} },
      { id: "a2", type: "pasture", name: "Upper pasture", coords: [43.18, -1.857], residenceId: "etxe-1", state: {} },
      { id: "a3", type: "forest", name: "Beech woodland", coords: [43.177, -1.875], residenceId: "etxe-1", state: {} },
      { id: "a4", type: "forest", name: "River woodland", coords: [43.164, -1.873], residenceId: "etxe-1", state: {} }
    ]
  },
  {
    id: "zubia-ormaetxea",
    familyName: "Zubia Ormaetxea",
    placeName: "Tolosa · Oria",
    description:
      "A smaller river-valley household with good fields and access to stone, but fewer working-age people.",
    center: [43.1348, -2.078],
    seed: 110044,
    stores: { food: 36, wood: 10, stone: 13, livestock: 4 },
    people: people([
      ["p1", "Martin", "Zubia", "M", 34, "head", "Farmer"],
      ["p2", "Maria", "Ormaetxea", "F", 29, "head", "Farmer"],
      ["p3", "Eneko", "Zubia", "M", 12, "child", "Miner"],
      ["p4", "Sancha", "Zubia", "F", 7, "child", "Unassigned"],
      ["p5", "Lope", "Zubia", "M", 2, "child", "Unassigned"]
    ]),
    assets: [
      { id: "a1", type: "field", name: "North field", coords: [43.139, -2.081], residenceId: "etxe-1", state: {} },
      { id: "a2", type: "field", name: "River field", coords: [43.13, -2.074], residenceId: "etxe-1", state: {} },
      { id: "a3", type: "pasture", name: "Low pasture", coords: [43.141, -2.07], residenceId: "etxe-1", state: {} },
      { id: "a4", type: "mine", name: "Stone working", coords: [43.128, -2.087], residenceId: "etxe-1", state: {} }
    ]
  }
];
