// Downloads OSM water, bridges, trees and street lamps for each walk area into data-raw/osm (gitignored).
// Data © OpenStreetMap contributors, ODbL.
import { mkdir, writeFile } from "node:fs/promises";
import { overpass } from "./overpass.mjs";
import { STREETS } from "./street.config.mjs";

await mkdir(new URL("../data-raw/osm/", import.meta.url), { recursive: true });
const only = process.argv[2];
for (const street of STREETS.filter((candidate) => !only || candidate.id === only)) {
  const around = `(around:${street.radius + 80},${street.lat},${street.lon})`;
  const extra =
    street.buildings === "osm"
      ? `way["building"]${around};
  way["highway"]${around};
  nwr["amenity"="place_of_worship"]${around};
  way["amenity"="marketplace"]${around};`
      : "";
  const query = `[out:json][timeout:180];
(
  way["natural"="water"]${around};
  relation["natural"="water"]${around};
  way["waterway"="riverbank"]${around};
  way["highway"]["bridge"]${around};
  node["natural"="tree"]${around};
  node["highway"="street_lamp"]${around};
  ${extra}
);
out geom;`;
  console.log(`fetching ${street.id}…`);
  const data = await overpass(query);
  const counts = {};
  for (const element of data.elements) {
    const tags = element.tags ?? {};
    const kind = tags.building
      ? "buildings"
      : tags.natural === "tree"
        ? "trees"
        : tags.highway === "street_lamp"
          ? "lamps"
          : tags.bridge
            ? "bridges"
            : tags.highway
              ? "roads"
              : (tags.amenity ?? "water");
    counts[kind] = (counts[kind] ?? 0) + 1;
  }
  await writeFile(new URL(`../data-raw/osm/street-${street.id}.json`, import.meta.url), JSON.stringify(data));
  console.log(" ", counts);
}
