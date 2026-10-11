// Prints OSM building counts around candidate diorama centres.
import { overpass } from "./overpass.mjs";

const candidates = {
  "tehran-university": [35.7036, 51.3961],
  vanak: [35.7577, 51.4096],
  "milad-area": [35.7448, 51.3753],
  azadi: [35.6997, 51.3381],
  tajrish: [35.8044, 51.4339],
  "amsterdam-dam": [52.3731, 4.8926],
};

for (const [name, [lat, lon]] of Object.entries(candidates)) {
  try {
    const result = await overpass(`[out:json][timeout:90];way["building"](around:700,${lat},${lon});out count;`);
    console.log(name.padEnd(20), result.elements?.[0]?.tags?.ways ?? "?");
  } catch (error) {
    console.log(name.padEnd(20), "failed:", String(error).slice(0, 100));
  }
}
