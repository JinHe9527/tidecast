// Render the title / problem / outro cards to 1920×1080 PNGs (transparent-free,
// dark tide-line branding) for the compositor to animate.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CARDS = resolve(HERE, "cards.html");
const OUT = resolve(HERE, "../out/cards");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`file://${CARDS}`, { waitUntil: "networkidle" });

for (const id of ["title", "problem", "outro"]) {
  await page.evaluate((cur) => {
    document.querySelectorAll(".card").forEach((c) => c.classList.remove("show"));
    document.getElementById(cur).classList.add("show");
  }, id);
  await page.waitForTimeout(300);
  const out = resolve(OUT, `${id}.png`);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log("wrote", out);
}
await browser.close();
