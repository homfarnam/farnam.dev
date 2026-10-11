# Farnam: Beyond the Code

An explorable 3D laboratory that doubles as Farnam's portfolio. It's built with Next.js 16 (App Router), React Three Fiber, Drei, GSAP, Zustand, Tailwind 4 and strict TypeScript.

- Creative direction and architecture: [docs/DIRECTION.md](docs/DIRECTION.md)
- Content that still needs supplying or confirming: [docs/CONTENT-REVIEW.md](docs/CONTENT-REVIEW.md)

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build && npm start
```

Requires Node 20+.

## Deploy (Vercel)

1. Push the repo to GitHub and import it in Vercel. It detects Next.js, so no settings are needed.
2. `profile.siteUrl` in `src/data/profile.ts` is the production domain (https://farnam.dev); canonical URLs, Open Graph, the sitemap and robots point at it.

## Map and city data

The Journey chapter uses real geography, baked at build time into `public/geo/`:

- `public/geo/tehran.bin` and `public/geo/amsterdam.bin` hold buildings, streets and water **© OpenStreetMap contributors**, available under the [Open Database License](https://www.openstreetmap.org/copyright). Where OSM has no height for a building, a plausible height is used. The site credits this in the Journey view.
- `public/geo/amsterdam-3dbag.glb` (and the `-lite` variant for low quality) holds measured LoD2.2 buildings from the [3DBAG](https://3dbag.nl) by tudelft3d and 3DGI, **CC BY 4.0**. They are baked by `node scripts/bake-3dbag.mjs` (and `… lite`), which downloads the needed tiles once into `data-raw/3dbag/`.
- `public/geo/street/herengracht.*` is the street-level walk: 3DBAG buildings (CC BY 4.0) plus OSM water, bridges, trees and street lamps (ODbL), baked at 1 unit = 1 m by `node scripts/fetch-street.mjs && node scripts/bake-street.mjs`. The walk area is set in `scripts/street.config.mjs`. Some canal-side trees are generated where OSM has none.
- `public/geo/street/tajrish.*` is the Tehran walk (Tajrish Square, the old bazaar, Imamzadeh Saleh), baked by `node scripts/fetch-street.mjs tajrish && node scripts/bake-street-tehran.mjs`. Streets, mapped buildings and landmarks come from OSM (ODbL). OSM's building coverage in Tehran is incomplete, so empty street frontage is filled with generated apartment blocks (the `_KIND = 1` attribute in the GLB). The plane trees, jubs and street lamps along the main roads, the shrine's dome and minarets, and the Alborz backdrop are also generated. The walk overlay says so.
- `public/textures/street/*` holds CC0 textures from [ambientCG](https://ambientcg.com): Bricks094, PavingStones140, RoofingTiles014B and PaintedPlaster017 for Amsterdam, and Bricks084, Travertine009, Asphalt033 and PavingStones136 for Tehran (colour and normal maps, 1K). No attribution is required, but it's credited here. Facades (windows, frames, lit rooms) are generated in the shader.
- `public/geo/map.bin` holds land and coastlines from [Natural Earth](https://www.naturalearthdata.com/) (public domain).
- `public/geo/globe.png` is the Journey's opening globe: Natural Earth land, coastlines, and the outlines of Iran and the European Netherlands (no other borders are drawn), baked by `node scripts/bake-globe.mjs`. Distances on the globe are computed at runtime as great-circle distances from the airport and city coordinates (`src/lib/world/globe.ts`); the arc is the shortest path, not a recorded flight track.

To refresh the data, run this once (it needs a network connection and writes to `data-raw/`, which is gitignored):

```bash
node scripts/fetch-osm.mjs
```

Natural Earth's `ne_50m_land.geojson` and `ne_50m_admin_0_countries.geojson` go in `data-raw/naturalearth/`. Then bake the binaries (offline and deterministic):

```bash
node scripts/bake-geo.mjs
node scripts/bake-globe.mjs
```

Diorama centres and radii are in `scripts/cities.config.mjs`. The map projection is in `src/data/geo.json`.

## Visual checks without a browser window

`node scripts/shoot.mjs <out-dir> stop:7 walk quality:high turn:arrowleft:900 escape` drives the dev server in headless Chrome (SwiftShader WebGL) and saves screenshots of each view. `globe` opens the Journey overview and `freeze:0.4` holds the globe-to-map unroll at a value. `wait`, `press:space` and `jump:<index>` drive the self-playing Journey. It renders on the Mac's GPU (Metal) by default; `SHOOT_GPU=swiftshader` forces software WebGL. `SHOOT_MOBILE=1` uses a phone viewport and `SHOOT_DEBUG=1` prints the story state after each view. This is development-only; it uses `window.__experience`, `__runtime`, `__gsap` and `__gl` handles that exist only in dev builds.

## Editing content

All content lives in `src/data/`. The 3D world, the HUD, the console and the server-rendered text version all read from these files, so an edit shows up everywhere.

| File | What's in it |
| --- | --- |
| `profile.ts` | name, title, roles, skills, music, contact links. `PLACEHOLDER` renders visibly as "pending". |
| `projects.ts` | every project: problem, role, tech, challenges, architecture, outcomes, links |
| `chapters.ts` | chapter titles, narrative beats, `open` flag and door bearing |

Never add metrics or links you can't back up. Leave `outcomes: []` and the site says "Measured outcomes to be added."

## Adding a project

1. Add an entry to `projects` in `src/data/projects.ts`, with a new `ProjectId` and `SimulationKind`.
2. Create its 3D artifact in `src/components/objects/artifacts/` (it receives `focused`, `hoverRef` and `accent`) and register it in `VISUALS` in `src/components/scenes/CreatorScene.tsx`.
3. Create its demo in `src/components/simulations/` and register it in `SIMULATIONS` in `src/components/ui/ProjectPanel.tsx`.

The vault arc, camera close-up, story path, console `projects` command and SEO text all update automatically.

## Opening a sealed chapter

1. Build the scene in `src/components/scenes/<Name>Scene.tsx`. It's in chamber-local space, with +Z facing back to the hub and the entrance at `z = 16`.
2. Register it in `chamberScenes` in `src/components/experience/World.tsx` (lazy import).
3. Add its camera shot in `chamberShots` in `src/lib/world/layout.ts`.
4. Set `open: true` in `src/data/chapters.ts`. The door turns from a barrier into a portal, the corridor appears, and the chapter joins the story path.

## Controls

Click or tap hotspots, drag to turn artifacts, and use ←/→ or the Next/Back buttons to follow the story path (scrolling never changes the page). The Journey plays itself like a film: Space plays or pauses. Number keys `1–6` jump to chapters, `H` goes home, `D` opens the dossier, `` ` `` opens the console, `?` shows help and `Esc` closes things. There's also a code that old consoles remember.
