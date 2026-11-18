// Run against a built docs preview, e.g. HIG_DOCS_PREVIEW_URL=http://localhost:4174/hig/ node scripts/perf/catalog-web.mjs.
// Emits one JSONL row per state. Callback intervals include handler and render work;
// they do not measure when a GPU buffer reaches the display.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { samplePreview } from "./catalog-frames.mjs";
const base = process.env.HIG_DOCS_PREVIEW_URL ?? "http://localhost:4174/hig/";
const { catalog } = JSON.parse(
  readFileSync("apps/docs/src/content.json", "utf8"),
);
const browser = await chromium.launch();
let errors = 0;
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference",
  });
  for (const entry of [
    ...catalog,
    {
      name: "Token action flow",
      route: "flow/token-action-flow",
      states: ["default"],
    },
  ]) {
    for (const state of entry.states) {
      const url = new URL("docs/" + entry.route + "/", base);
      url.searchParams.set("state", state);
      try {
        await page.goto(url.href, { waitUntil: "domcontentloaded" });
        console.log(
          JSON.stringify({
            name: entry.name,
            ...(await page.evaluate(samplePreview, state)),
          }),
        );
      } catch (error) {
        errors++;
        console.log(
          JSON.stringify({ name: entry.name, state, error: error.message }),
        );
      }
    }
  }
} finally {
  await browser.close();
}
if (errors) process.exitCode = 1;
