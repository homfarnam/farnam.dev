# Farnam: Beyond the Code — creative direction & architecture

## The idea in one line

A dark laboratory that wakes up when you arrive. Every door leads to a part of Farnam's mind, and every object you touch tells you something true about them.

## World

```
                 [02 Engineer]  [03 Creator]  [04 Musician]  [05 Human]
                         \           |             |          /
                          door    door          door      door
                             \       |             |       /
                              ─────  THE LAB (hub)  ─────
                                   holo-core · desk · guitar
                                          ▲
                                       visitor
```

- **Hub (Chapter 01, The Awakening):** a circular lab, open at the front so the camera never looks through a wall. The holo-core in the middle opens the dossier. The workstation's screens scroll real data and open the console. The guitar on its stand hints at the music chapter. Four doors around the back wall lead to the other chapters.
- **The Journey (Chapter 02):** a dot-matrix night map. The route winds through Tehran, with a mountain ridge along its flank, rises into a one-way flight arc (March 2022), and lands in Amsterdam's canal rings. There is one beacon per stop. The scene plays itself stop by stop (or the visitor steps through), and the camera glides from stop to stop while the route lights up behind you.
- **Chambers:** each one sits 64 m out along its door's bearing, reached through a ring corridor. Chamber-local space always has +Z pointing back to the hub (`src/lib/world/layout.ts`).
- **Sealed doors:** chapters that aren't built show an amber energy barrier. Clicking explains what's coming and links to the text version. Nothing pretends to be finished.

## Visual identity

| Token  | Hex       | Use                                                    |
| ------ | --------- | ------------------------------------------------------ |
| void   | `#080B12` | background, fog                                        |
| navy   | `#101827` | panels, secondary surfaces                             |
| signal | `#3B82F6` | structure light, grid                                  |
| cyan   | `#22D3EE` | interactive glow, holograms                            |
| ember  | `#F97316` | the one call to action per screen, sealed doors, alerts |
| ink    | `#F8FAFC` | primary text                                           |
| mute   | `#94A3B8` | secondary text                                         |

- **Type:** Space Grotesk carries the narrative voice. IBM Plex Mono is used only where the *system* speaks (boot log, console, technical labels). All caps is reserved for the machine voice.
- **Light:** bloom triggers only above luminance 1, so only emissive parts glow. Fog does the atmosphere; there is no glow everywhere.
- **UI:** the "instrument" panel has a thin frame with two cyan corner notches. There is no card grid, and it isn't glassmorphism.
- **Motion:** one orchestrated moment per transition. The boot power-up stutters on like fluorescent tubes. Travel is a directed three-shot path (approach door → corridor → reveal). Everything else answers the visitor's input.

## Interaction model

| Input | Effect |
| --- | --- |
| Click / tap | doors travel, artifacts open, the core opens the dossier, the desk opens the console |
| Drag (focused artifact) | rotate it, with inertia |
| ← → / Next · Back | next or previous stop on the *story path*: hub → vault → each artifact |
| 1–6, H, D, `, ?, Esc | chapter jump, home, dossier, console, help, close |
| Guided mode | same world; the "Next" button is promoted to the primary orange action |

Every 3D hotspot has a DOM twin (a hidden list that appears on keyboard focus), so nothing is reachable *only* in WebGL.

## Architecture

```
src/
  app/                    RSC: layout, page (crawlable StoryDocument + JSON-LD), sitemap, robots
  data/                   profile.ts · projects.ts · chapters.ts — the only place content lives
  stores/experienceStore  Zustand: phase, chapter, travel, focus, panels, quality, audio
  lib/world/              layout math, camera shots, story-path stops, runtime (per-frame mutable values)
  lib/shaders/            typed ShaderMaterial factories (hologram, grid floor, dust, portal)
  lib/audio/              Web Audio synth — created only after the visitor turns sound on
  components/
    experience/           Experience (client root), World, CameraController, LabLights, PostFX
    scenes/               AwakeningScene (eager), CreatorScene (code-split, lazy)
    objects/              HoloCore, ChapterDoor, Workstation, Guitar, ProjectArtifact, artifacts/*
    ui/                   BootSequence, HUD, panels, Dialog (focus trap)
    simulations/          the five project demos (no network)
    document/             StoryDocument — SSR content, no-WebGL fallback, text mode
```

Rules the code follows:

- **One camera owner.** GSAP tweens a plain rig object. One `useFrame` applies it and adds parallax along the camera's own right axis.
- **No React state per frame.** Render loops read `useExperience.getState()` and the `runtime` object.
- **Chambers load on demand.** `React.lazy` loads them, they mount on first visit, and the vault chunk is prefetched 2.5 s after the lab boots.
- **Quality tiers.** `PerformanceMonitor` drops to *low* (DPR ≤ 1.25, no post-processing, about 35 % particles). Coarse-pointer or low-memory devices start at *low*.

## Phases

1. ✅ Direction (this document)
2. ✅ Prototype: boot, hub, camera system, navigation, the Creator chapter fully built
3. ✅ The Journey (Tehran → Amsterdam route, 12 stops). ⏳ Engineer (architecture map + "build a system"), Musician (instruments in the order they were learned: violin 2014, guitar 2023, accordion 2025), Human (finale, behind the holo-core)
4. ⏳ Polish: GLB hero models (guitar, violin, accordion), audio design, secret developer room
5. ⏳ Optimisation pass on real devices
6. ⏳ Production: real domain, links, OG image
