import { chromium } from "playwright";

const URL = "http://localhost:5174/";

async function capture(theme, out) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 832 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  // Seed theme before the app reads it.
  await page.addInitScript((t) => {
    localStorage.setItem("tidecast-theme", t);
  }, theme);
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
  // Let oracle/price/svi/positions settle.
  await page.waitForTimeout(7_000);
  await page.screenshot({ path: out });
  console.log("wrote", out);
  await browser.close();
}

await capture("dark", "/tmp/tidecast-dark.png");
await capture("light", "/tmp/tidecast-light.png");
