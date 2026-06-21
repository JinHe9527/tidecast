// Capture fresh terminal screenshots from the live dev app (with the real
// volatility smile). Run with the dev server up:  node scripts/shot.mjs
import { chromium } from "playwright";

const URL = process.env.URL || "http://localhost:5174/app";
const OUT = "/Users/mac/WorkSpace/Web3_Project/Tidecast/submission/media";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  colorScheme: "dark", // brand terminal is dark cyan-on-near-black
});
await ctx.addInitScript(() => localStorage.setItem("tidecast-theme", "dark"));
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('svg[aria-label="Implied volatility by strike"]', { timeout: 25000 });
await page.waitForTimeout(3000); // let live price/SVI settle and the curve tween in

await page.screenshot({ path: `${OUT}/01-terminal.jpg`, type: "jpeg", quality: 92 });

const card = page.locator("main section").first();
const box = await card.boundingBox();
if (box) {
  await page.screenshot({
    path: `${OUT}/04-smile.jpg`,
    type: "jpeg",
    quality: 92,
    clip: { x: box.x, y: box.y, width: box.width, height: box.height },
  });
}

await browser.close();
console.log("shots written to", OUT);
