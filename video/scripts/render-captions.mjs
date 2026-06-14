// Render lower-third caption overlays (transparent PNG, 1920×1080) for each demo
// scene, plus a "real testnet mint" badge. The mint caption embeds the real digest
// read from out/clips/mint-digest.txt.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync, readFileSync, existsSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = resolve(HERE, "captions.html");
const OUT = resolve(HERE, "../out/captions");
mkdirSync(OUT, { recursive: true });

const digestFile = resolve(HERE, "../out/clips/mint-digest.txt");
const digest = existsSync(digestFile) ? readFileSync(digestFile, "utf8").trim() : "";
const shortDigest = digest ? `${digest.slice(0, 8)}…${digest.slice(-6)}` : "—";

const browser = await chromium.launch();
// dSF 1 so the PNG is exactly 1920×1080 — it overlays the 1080p clips 1:1.
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(`file://${PAGE}`, { waitUntil: "networkidle" });
await page.evaluate((sd) => {
  const el = document.getElementById("digest-line");
  if (el) el.textContent = `tx ${sd} · suiscan.xyz/testnet`;
}, shortDigest);

// caption id → also show the real-mint badge on the mint scene
const items = [
  { id: "c-market", file: "market", badge: false },
  { id: "c-quote", file: "quote", badge: false },
  { id: "c-mint", file: "mint", badge: true },
  { id: "c-analytics", file: "analytics", badge: false },
];

for (const it of items) {
  await page.evaluate(({ id, badge }) => {
    document.querySelectorAll(".cap").forEach((c) => c.classList.remove("show"));
    document.getElementById(id).classList.add("show");
    document.getElementById("b-real").classList.toggle("show", badge);
  }, it);
  await page.waitForTimeout(150);
  const out = resolve(OUT, `${it.file}.png`);
  await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log("wrote", out);
}
await browser.close();
