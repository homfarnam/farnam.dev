// Downloads OSM buildings, water and streets for each diorama into data-raw/osm (gitignored).
// Run: node scripts/fetch-osm.mjs   — data © OpenStreetMap contributors, ODbL.
import { mkdir, writeFile } from "node:fs/promises";
import { overpass } from "./overpass.mjs";
import { CITIES } from "./cities.config.mjs";

await mkdir(new URL("../data-raw/osm/", import.meta.url), { recursive: true });

// Optional filter: node scripts/fetch-osm.mjs amsterdam
const only = process.argv[2];
for (const city of CITIES.filter((candidate) => !only || candidate.id === only)) {
  const { lat, lon, radius } = city;
  const around = `(around:${radius},${lat},${lon})`;
  const query = `[out:json][timeout:180];
(
  way["building"]${around};
  way["natural"="water"]${around};
  relation["natural"="water"]${around};
  way["waterway"="riverbank"]${around};
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|pedestrian)$"]${around};
);
out geom;`;
  console.log(`fetching ${city.id}…`);
  const data = await overpass(query);
  const target = new URL(`../data-raw/osm/${city.id}.json`, import.meta.url);
  await writeFile(target, JSON.stringify(data));
  console.log(`  ${data.elements.length} elements → ${target.pathname}`);
}
