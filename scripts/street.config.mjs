/**
 * Street-level walk areas. Coordinates in WGS84; radius in metres.
 * `buildings`: "3dbag" (measured Dutch models) or "osm" (OSM footprints, gaps
 * along streets filled with generated blocks — flagged in the data).
 */
export const STREETS = [
  { id: "herengracht", name: "Herengracht", lat: 52.3752, lon: 4.8869, radius: 300, facing: "west", buildings: "3dbag" },
  { id: "tajrish", name: "Tajrish", lat: 35.8048, lon: 51.4318, radius: 300, facing: "north", buildings: "osm" },
];
