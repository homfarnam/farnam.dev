/**
 * Minimal Overpass client with mirror fallback and retries.
 * Build-time only — the site never talks to Overpass at runtime.
 */
const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function overpass(query, { attempts = 6 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const url = MIRRORS[attempt % MIRRORS.length];
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "farnam-portfolio-build/1.0" },
        body: new URLSearchParams({ data: query }),
      });
      const text = await response.text();
      if (!response.ok || !text.trimStart().startsWith("{")) throw new Error(`${url} → ${response.status} ${text.slice(0, 120)}`);
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      await sleep(2000 * (attempt + 1));
    }
  }
  throw lastError;
}
