// Capture fresh terminal screenshots from the live dev app (real volatility
// smile, dark brand theme). Run with the dev server up:  node scripts/shot.mjs
import { chromium } from "playwright";

const URL = process.env.URL || "http://localhost:5174/app";
const OUT = "/Users/mac/WorkSpace/Web3_Project/Tidecast/submission/media";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
await ctx.addInitScript(() => localStorage.setItem("tidecast-theme", "dark"));
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector('svg[aria-label="Implied volatility by strike"]', { timeout: 25000 });
await page.waitForTimeout(3000); // let live price/SVI settle and the curve tween in

const shot = async (name, clip) =>
  page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 92, ...(clip ? { clip } : {}) });

await shot("01-terminal");

const card = await page.locator("main section").first().boundingBox();
if (card) await shot("04-smile", card);

const aside = await page.locator("main aside").last().boundingBox();
if (aside) await shot("05-ladder", { x: aside.x - 8, y: aside.y, width: aside.width + 8, height: aside.height });

// Best-effort real mint → a proof screenshot with the live smile behind it.
try {
  await page.getByText("Mint Up", { exact: false }).first().click();
  await page.waitForSelector("text=/Suiscan|minted/i", { timeout: 30000 });
  await page.waitForTimeout(900);
  await shot("03-mint");
  console.log("mint shot captured");
} catch (e) {
  console.log("mint shot skipped:", String(e.message).split("\n")[0]);
}

await browser.close();
console.log("done →", OUT);
