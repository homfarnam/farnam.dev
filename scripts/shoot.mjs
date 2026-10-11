// Headless visual check: drives the dev server in Chrome (SwiftShader WebGL)
// and saves screenshots of named views. Dev-only, not part of the site.
//
//   node scripts/shoot.mjs out-dir view1 view2 …
//   views: hub | journey | globe | stop:<index> | play | wait | press:<key> | jump:<index> | freeze:<0..1> | explore | walk
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const [, , outDir = "shots", ...views] = process.argv;
const URL = process.env.SHOOT_URL ?? "http://localhost:3000";
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  // Metal runs at real frame rates; SHOOT_GPU=swiftshader forces software WebGL.
  args:
    process.env.SHOOT_GPU === "swiftshader"
      ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
      : ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu"],
});
const page = await browser.newPage({
  viewport: process.env.SHOOT_MOBILE ? { width: 390, height: 844 } : { width: 1280, height: 800 },
  isMobile: Boolean(process.env.SHOOT_MOBILE),
  hasTouch: Boolean(process.env.SHOOT_MOBILE),
});
const errors = [];
page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto(URL);
await page.waitForFunction(() => window.__experience?.getState().sceneReady, null, { timeout: 120000 });
console.log("hidden:", await page.evaluate(() => document.hidden));
// Software rendering runs at a few frames per second: let GSAP use real elapsed time.
await page.evaluate(() => window.__gsap.ticker.lagSmoothing(0));
await page.evaluate(() => window.__experience.getState().begin("free"));
if (process.env.SHOOT_QUALITY)
  await page.evaluate((q) => window.__experience.getState().setQuality(q), process.env.SHOOT_QUALITY);
await page.waitForTimeout(5000);

const set = (fn) => page.evaluate(fn);
process.on("unhandledRejection", async (error) => {
  console.log("FAILED:", String(error).split("\n")[0]);
  console.log(
    "state:",
    await page
      .evaluate(() => {
        const s = window.__experience.getState();
        return JSON.stringify({ chapter: s.chapter, travellingTo: s.travellingTo, phase: s.phase, quality: s.quality });
      })
      .catch(() => "?"),
  );
  console.log("console errors:\n" + errors.slice(0, 10).join("\n"));
  await browser.close();
  process.exit(1);
});
for (const [index, view] of views.entries()) {
  if (view === "hub") await set(() => window.__experience.getState().goTo("awakening"));
  else if (view === "journey") await set(() => window.__experience.getState().goTo("journey"));
  else if (view.startsWith("stop:") || view === "globe") {
    const index = view === "globe" ? null : Number(view.split(":")[1]);
    // Jump straight into the Journey (software rendering makes the flight too slow to wait for).
    await set(() => {
      const store = window.__experience;
      const state = store.getState();
      if (state.chapter !== "journey")
        store.setState({ chapter: "journey", travellingTo: null, mounted: [...new Set([...state.mounted, "journey"])] });
    });
    try {
      await page.waitForFunction(
        () => window.__experience.getState().chapter === "journey" && !window.__experience.getState().travellingTo,
        null,
        { timeout: 240000 },
      );
    } catch (error) {
      const state = await page.evaluate(() => {
        const s = window.__experience.getState();
        return JSON.stringify({
          chapter: s.chapter,
          travellingTo: s.travellingTo,
          phase: s.phase,
          quality: s.quality,
          walking: s.walking,
        });
      });
      console.log("FAILED waiting for journey; state:", state);
      console.log("console errors:\n" + errors.slice(0, 10).join("\n"));
      await page.screenshot({ path: `${outDir}/failure.png` });
      await browser.close();
      process.exit(1);
    }
    await page.evaluate((i) => window.__experience.getState().focusJourneyStop(i), index);
    // Hold still for the screenshot (arriving starts the scene playing).
    await page.evaluate(() => window.__experience.getState().setJourneyPlaying(false));
    // The overview has no stop change to react to: a resize makes the camera settle on its resting shot.
    if (index === null) await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  } else if (view.startsWith("freeze:")) {
    // Hold the globe ↔ map morph at a value (dev handles: __gsap, __runtime).
    await page.evaluate(
      (value) => {
        window.__gsap.globalTimeline.pause();
        window.__runtime.globe = value;
      },
      Number(view.split(":")[1]),
    );
  } else if (view === "wait") {
    // Nothing: just let time pass (e.g. while the Journey plays).
  } else if (view.startsWith("press:")) await page.keyboard.press(view.split(":")[1] === "space" ? " " : view.split(":")[1]);
  else if (view.startsWith("jump:"))
    await page.evaluate((i) => window.__experience.getState().focusJourneyStop(i), Number(view.split(":")[1]));
  else if (view === "play") await set(() => window.__experience.getState().setJourneyPlaying(true));
  else if (view === "explore") await set(() => window.__experience.getState().setJourneyExplore(true));
  else if (view === "walk") await set(() => window.__experience.getState().setWalking?.(true, "herengracht"));
  else if (view === "walk:tajrish") await set(() => window.__experience.getState().setWalking?.(true, "tajrish"));
  else if (view === "escape") await page.keyboard.press("Escape");
  else if (view.startsWith("look:")) {
    // look:<fromNorth>:<fromEast>:<atNorth>:<atEast>:<pitchDegrees> — snaps to the nearest walkable spot.
    const [, fn, fe, an, ae, pitch = "8"] = view.split(":").map(Number);
    await page.evaluate(
      ([fn, fe, an, ae, pitch]) => {
        const spot = window.__walkNear(fn, fe) ?? [fn, fe];
        const dn = an - spot[0];
        const de = ae - spot[1];
        // forward = (−sin yaw, −cos yaw) in (north, east)
        const yaw = Math.atan2(-dn, -de);
        Object.assign(window.__walkPlayer, { north: spot[0], east: spot[1], yaw, pitch: (pitch * Math.PI) / 180 });
      },
      [fn, fe, an, ae, pitch],
    );
  } else if (view.startsWith("pose:")) {
    // pose:<north>:<east>:<yawDegrees>[:<pitchDegrees>]  (street-local metres; yaw 0 = west, 90 = south, -90 = north)
    const [, north, east, yaw, pitch = "0"] = view.split(":");
    await page.evaluate(
      ([n, e, y, p]) =>
        Object.assign(window.__walkPlayer, { north: n, east: e, yaw: (y * Math.PI) / 180, pitch: (p * Math.PI) / 180 }),
      [Number(north), Number(east), Number(yaw), Number(pitch)],
    );
  } else if (view.startsWith("quality:")) {
    await page.evaluate((q) => window.__experience.getState().setQuality(q), view.split(":")[1]);
    continue;
  } else if (view.startsWith("turn:")) {
    // Hold a key for N ms (e.g. turn:arrowleft:600, turn:w:2000) to move/look before the shot.
    const [, key, ms] = view.split(":");
    await page.keyboard.down(key === "arrowleft" ? "ArrowLeft" : key === "arrowright" ? "ArrowRight" : key);
    await page.waitForTimeout(Number(ms));
    await page.keyboard.up(key === "arrowleft" ? "ArrowLeft" : key === "arrowright" ? "ArrowRight" : key);
  }
  await page.waitForTimeout(Number(process.env.SHOOT_WAIT ?? 9000));
  const file = `${outDir}/${String(index).padStart(2, "0")}-${view.replace(":", "-")}.png`;
  await page.screenshot({ path: file, timeout: 180000 });
  if (process.env.SHOOT_DEBUG)
    console.log(
      view,
      await page.evaluate(() => {
        const s = window.__experience.getState();
        const r = window.__runtime;
        return JSON.stringify({
          stop: s.journeyStop,
          playing: s.journeyPlaying,
          explore: s.journeyExplore,
          globe: r.globe,
          arc: r.globeArc,
        });
      }),
    );
  console.log("saved", file);
}
if (errors.length) console.log("console errors:\n" + errors.slice(0, 10).join("\n"));
await browser.close();
