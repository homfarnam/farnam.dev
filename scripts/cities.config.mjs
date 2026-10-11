/**
 * Diorama centres. `displayRadius` (metres) is what fits on the plinth and sets
 * the scale; `radius` (metres) is how much real city is baked. Amsterdam bakes
 * twice its plinth so the city can expand around the visitor on arrival.
 * `osmBuildings: false` means buildings come from another source (3D BAG).
 */
export const CITIES = [
  { id: "tehran", name: "Tehran — Tajrish", lat: 35.8044, lon: 51.4339, radius: 850, displayRadius: 850, osmBuildings: true },
  {
    id: "amsterdam",
    name: "Amsterdam — Dam & canal ring",
    lat: 52.3731,
    lon: 4.8926,
    radius: 1400,
    displayRadius: 700,
    osmBuildings: false,
  },
];
