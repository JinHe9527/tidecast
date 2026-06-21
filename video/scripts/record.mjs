// Records real interaction footage of the Tidecast trading terminal on testnet.
// One webm per scene into video/out/clips/, chaining storageState so scenes build
// on each other. A synthetic cyan cursor is injected so the camera sees the pointer.
//
//   cd video && node scripts/record.mjs            # all four scenes
//   cd video && node scripts/record.mjs 03-mint    # one scene by id
//
// Scene 03 performs a REAL mint (signs a PTB in-process) and waits for the new
// position row to land on-chain. The captured tx digest is written to
// out/clips/mint-digest.txt for the compositor to overlay.

import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../out/clips");
const STATE = resolve(OUT, "storage-state.json");
const URL = "http://localhost:5174/app";
const VIEWPORT = { width: 1920, height: 1080 };
// recordVideo.size MUST equal the viewport — Playwright pads (not scales) a larger
// canvas with grey. deviceScaleFactor:2 still renders the page at 2x device pixels,
// so the 1920×1080 video is crisp; the final deliverable is 1920×1080 anyway.
const RECORD = { width: 1920, height: 1080 };

mkdirSync(OUT, { recursive: true });

// ── synthetic cursor ────────────────────────────────────────────────────────
// A fixed cyan dot following mousemove, shrinking on mousedown. Injected before
// any app script so it survives navigation.
const CURSOR_SCRIPT = () => {
  const make = () => {
    if (document.getElementById("__cursor")) return;
    const dot = document.createElement("div");
    dot.id = "__cursor";
    Object.assign(dot.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "22px",
      height: "22px",
      marginLeft: "-11px",
      marginTop: "-11px",
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 35%, rgba(103,232,249,0.95), rgba(34,211,238,0.55) 55%, rgba(14,116,144,0) 72%)",
      boxShadow: "0 0 16px 4px rgba(34,211,238,0.45)",
      border: "1.5px solid rgba(224,247,255,0.9)",
      pointerEvents: "none",
      zIndex: "2147483647",
      transform: "translate(-9999px,-9999px) scale(1)",
      transition: "transform 60ms linear, width 90ms ease, height 90ms ease",
      willChange: "transform",
    });
    document.documentElement.appendChild(dot);
  };
  const place = (x, y, down) => {
    const dot = document.getElementById("__cursor");
    if (!dot) return;
    dot.style.transform = `translate(${x}px,${y}px) scale(${down ? 0.6 : 1})`;
  };
  let down = false;
  window.addEventListener("mousemove", (e) => place(e.clientX, e.clientY, down), true);
  window.addEventListener("mousedown", (e) => { down = true; place(e.clientX, e.clientY, true); }, true);
  window.addEventListener("mouseup", (e) => { down = false; place(e.clientX, e.clientY, false); }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", make);
  else make();
};

// ── easing + director ─────────────────────────────────────────────────────────
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Director {
  constructor(page) {
    this.page = page;
    this.x = VIEWPORT.width / 2;
    this.y = VIEWPORT.height / 2;
  }
  async glideTo(x, y, ms = 700) {
    const steps = Math.max(12, Math.round(ms / 16));
    const sx = this.x, sy = this.y;
    for (let i = 1; i <= steps; i++) {
      const t = easeInOut(i / steps);
      await this.page.mouse.move(sx + (x - sx) * t, sy + (y - sy) * t);
      await sleep(ms / steps);
    }
    this.x = x; this.y = y;
  }
  async center(selector, { timeout = 15000 } = {}) {
    const el = this.page.locator(selector).first();
    await el.waitFor({ state: "visible", timeout });
    const b = await el.boundingBox();
    if (!b) throw new Error(`no box for ${selector}`);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, box: b };
  }
  async glide(selector, ms = 700, opts) {
    const { x, y } = await this.center(selector, opts);
    await this.glideTo(x, y, ms);
    return { x, y };
  }
  async glideHandle(handle, ms = 600) {
    const b = await handle.boundingBox();
    if (!b) return;
    await this.glideTo(b.x + b.width / 2, b.y + b.height / 2, ms);
  }
  async click(selector, ms = 650, opts) {
    const { x, y } = await this.glide(selector, ms, opts);
    await sleep(220);
    await this.page.mouse.down();
    await sleep(90);
    await this.page.mouse.up();
    await this.page.locator(selector).first().click({ force: true }).catch(() => {});
    return { x, y };
  }
  async pause(ms) { await sleep(ms); }
}

// ── shared launch ──────────────────────────────────────────────────────────────
async function openScene() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: "dark",
    recordVideo: { dir: OUT, size: RECORD },
    storageState: existsSync(STATE) ? STATE : undefined,
  });
  await ctx.addInitScript(() => localStorage.setItem("tidecast-theme", "dark"));
  await ctx.addInitScript(CURSOR_SCRIPT);
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  // Let oracles / price / svi / positions settle and the smile draw.
  await page.waitForFunction(
    () => !!document.querySelector('svg[aria-label="Implied volatility by strike"]'),
    { timeout: 30000 },
  ).catch(() => {});
  await page.waitForTimeout(2500);
  return { browser, ctx, page, dir: new Director(page) };
}

async function finish(id, { browser, ctx, page }) {
  await page.waitForTimeout(400);
  const video = page.video();
  await ctx.storageState({ path: STATE });
  await ctx.close();
  await browser.close();
  const tmp = await video.path();
  const dest = resolve(OUT, `${id}.webm`);
  const { renameSync } = await import("node:fs");
  renameSync(tmp, dest);
  console.log(`  wrote ${dest}`);
}

// ── helpers for ladder rows ─────────────────────────────────────────────────────
async function ladderRows(page) {
  const rows = page.locator('[aria-label="Strike ladder"] > div');
  await rows.first().waitFor({ state: "visible", timeout: 15000 });
  return rows;
}

// ────────────────────────────────────────────────────────────────────────────────
// Scene 01 — market: ticker pulses, glide the expiry rail, sweep the strike ladder
// so the smile marker + heat bar track the cursor (the signature cross-link). ~18s
async function scene01(id) {
  const s = await openScene();
  const { page, dir } = s;
  try {
    await dir.glideTo(960, 120, 600);
    await dir.pause(2200); // ticker breathing — let the live price pulse

    // Expiry rail: hover a few rows.
    const opts = page.locator('[role="option"]');
    const n = await opts.count();
    if (n >= 2) {
      await dir.glideHandle(await opts.nth(0).elementHandle());
      await dir.pause(1000);
      await dir.glideHandle(await opts.nth(Math.min(2, n - 1)).elementHandle());
      await dir.pause(1000);
      await dir.glideHandle(await opts.nth(Math.min(4, n - 1)).elementHandle());
      await dir.pause(900);
      await dir.glideHandle(await opts.nth(0).elementHandle());
      await dir.pause(800);
    }

    // Strike ladder sweep — hover row by row; the smile dot + heat bar follow.
    const rows = await ladderRows(page);
    const rc = await rows.count();
    for (let i = 0; i < rc; i++) {
      await dir.glideHandle(await rows.nth(i).elementHandle(), 420);
      await dir.pause(820);
    }
    // Sweep back up to show the cross-link tracking in both directions.
    for (let i = rc - 2; i >= Math.max(0, rc - 5); i--) {
      await dir.glideHandle(await rows.nth(i).elementHandle(), 420);
      await dir.pause(700);
    }
    await dir.pause(1600);
  } finally {
    await finish(id, s);
  }
}

// Scene 02 — quote: click an amount preset (25), Cost/Payout/implied roll live;
// toggle Up/Down once. ~12s
async function scene02(id) {
  const s = await openScene();
  const { page, dir } = s;
  try {
    // Load the ticket from a ladder side (Up on a near-ATM row) so a quote exists.
    const rows = await ladderRows(page);
    const mid = Math.floor((await rows.count()) / 2);
    const upBtn = rows.nth(mid).locator("button").nth(1); // right = Up
    await dir.glideHandle(await upBtn.elementHandle());
    await dir.pause(400);
    await upBtn.click({ force: true });
    await dir.pause(2000);

    // Amount presets — step 10 → 25 → 50 so the cost / payout / implied roll live.
    const preset10 = page.getByRole("button", { name: /^10$/ }).first();
    await dir.glideHandle(await preset10.elementHandle());
    await dir.pause(300);
    await preset10.click({ force: true });
    await dir.pause(1800);
    const preset25 = page.getByRole("button", { name: /^25$/ }).first();
    await dir.glideHandle(await preset25.elementHandle());
    await dir.pause(300);
    await preset25.click({ force: true });
    await dir.pause(2000); // cost / payout / implied roll
    const preset50 = page.getByRole("button", { name: /^50$/ }).first();
    await dir.glideHandle(await preset50.elementHandle());
    await dir.pause(300);
    await preset50.click({ force: true });
    await dir.pause(2000);

    // Toggle direction (Up -> Down -> Up) to show the live re-quote in place.
    const down = page.getByRole("button", { name: /^Down$/ }).first();
    await dir.glideHandle(await down.elementHandle());
    await dir.pause(300);
    await down.click({ force: true });
    await dir.pause(2000);
    const up = page.getByRole("button", { name: /^Up$/ }).first();
    await dir.glideHandle(await up.elementHandle());
    await dir.pause(300);
    await up.click({ force: true });
    await dir.pause(2200);
  } finally {
    await finish(id, s);
  }
}

// Scene 03 — mint: ATM strike + Up, amount 1 dUSDC, real Mint Up -> PTB signs ->
// success toast w/ Suiscan link -> position lands in the dock with live PnL. ~20s.
// 1 dUSDC keeps the position cost inside the manager's pre-deposited headroom, so
// the PTB is mint-only (no deposit moveCall) and fits the wallet's thin SUI gas.
async function scene03(id) {
  const s = await openScene();
  const { page, dir } = s;
  let digest = null;
  // The real digest: scrape the executeTransactionBlock JSON-RPC response.
  page.on("response", async (res) => {
    if (digest) return;
    try {
      const req = res.request();
      if (req.method() !== "POST") return;
      const post = req.postData();
      if (!post || !/executeTransactionBlock/.test(post)) return;
      const body = await res.json();
      const d = body?.result?.digest;
      if (d) {
        digest = d;
        writeFileSync(resolve(OUT, "mint-digest.txt"), d);
        console.log(`  mint digest: ${d}`);
      }
    } catch { /* not JSON / consumed — ignore */ }
  });
  try {
    // Pick the ATM row's Up side.
    const rows = await ladderRows(page);
    const rc = await rows.count();
    let atmIdx = 0;
    for (let i = 0; i < rc; i++) {
      if (/ATM/.test(await rows.nth(i).textContent())) { atmIdx = i; break; }
    }
    const upBtn = rows.nth(atmIdx).locator("button").nth(1);
    await dir.glideHandle(await upBtn.elementHandle());
    await dir.pause(250);
    await upBtn.click({ force: true });
    await dir.pause(1000);

    // Set amount to 1 dUSDC via the NumberField input.
    const input = page.locator('input[aria-label="Amount (dUSDC)"], [aria-label="Amount (dUSDC)"] input').first();
    await dir.glideHandle(await input.elementHandle());
    await input.click({ force: true });
    await page.keyboard.press("Control+A").catch(() => {});
    await page.keyboard.press("Meta+A").catch(() => {});
    for (const ch of "1") { await page.keyboard.type(ch); await sleep(140); }
    await page.keyboard.press("Tab");
    await dir.pause(2000); // re-quote at 1 dUSDC

    // If a trading account must be created first, do it and wait.
    const createBtn = page.getByRole("button", { name: /Create trading account/ });
    if (await createBtn.count()) {
      await dir.glideHandle(await createBtn.first().elementHandle());
      await createBtn.first().click({ force: true });
      await page.getByRole("button", { name: /Mint (Up|Down)/ }).first()
        .waitFor({ state: "visible", timeout: 60000 });
      await dir.pause(1500);
    }

    const mint = page.getByRole("button", { name: /^Mint Up$/ }).first();
    await mint.waitFor({ state: "visible", timeout: 20000 });
    await dir.glideHandle(await mint.elementHandle());
    await dir.pause(350);
    await page.mouse.down(); await sleep(90); await page.mouse.up();
    await mint.click({ force: true }).catch(() => {});

    // Wait for the success toast + Suiscan link, capture the digest.
    const toastLink = page.getByRole("button", { name: /View on Suiscan/ }).first();
    await toastLink.waitFor({ state: "visible", timeout: 90000 });
    await dir.glideHandle(await toastLink.elementHandle(), 700);
    await dir.pause(1200);

    // The position row should land in the dock (flashes via .row-flash).
    await page.locator("footer .row-flash, footer [class*='row-flash']").first()
      .waitFor({ state: "visible", timeout: 90000 }).catch(() => {});
    // Glide down to the new position row.
    const posRow = page.locator("footer").getByText(/Up \$/).first();
    if (await posRow.count()) {
      await dir.glideHandle(await posRow.elementHandle(), 800).catch(() => {});
    }
    await dir.pause(2500); // let live PnL tick
    if (!digest) console.warn("  (no digest captured — check toast / RPC)");
  } finally {
    await finish(id, s);
  }
}

// Scene 04 — analytics: glide the vol smile (gradient + ATM / your-strike markers +
// skew label) then the positioning heatmap beneath. ~14s
async function scene04(id) {
  const s = await openScene();
  const { page, dir } = s;
  try {
    const smile = page.locator('svg[aria-label="Implied volatility by strike"]').first();
    const b = await smile.boundingBox();
    if (b) {
      // Sweep across the smile left → ATM → right so dots + skew read.
      await dir.glideTo(b.x + b.width * 0.12, b.y + b.height * 0.6, 800);
      await dir.pause(1300);
      await dir.glideTo(b.x + b.width * 0.32, b.y + b.height * 0.5, 800);
      await dir.pause(1100);
      await dir.glideTo(b.x + b.width * 0.5, b.y + b.height * 0.42, 900);
      await dir.pause(1500); // dwell on ATM + skew label
      await dir.glideTo(b.x + b.width * 0.68, b.y + b.height * 0.5, 800);
      await dir.pause(1100);
      await dir.glideTo(b.x + b.width * 0.88, b.y + b.height * 0.55, 900);
      await dir.pause(1300);
    }
    // Positioning heatmap beneath — hover bars so they brighten.
    const heat = page.locator('svg[aria-label="Net minted position by strike"]').first();
    const hb = await heat.boundingBox();
    if (hb) {
      for (const frac of [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) {
        await dir.glideTo(hb.x + hb.width * frac, hb.y + hb.height * 0.5, 550);
        await dir.pause(800);
      }
    }
    await dir.pause(2000);
  } finally {
    await finish(id, s);
  }
}

const SCENES = {
  "01-market": scene01,
  "02-quote": scene02,
  "03-mint": scene03,
  "04-analytics": scene04,
};

const only = process.argv[2];
const ids = only ? [only] : Object.keys(SCENES);
for (const id of ids) {
  if (!SCENES[id]) { console.error(`unknown scene ${id}`); process.exit(1); }
  console.log(`scene ${id}…`);
  await SCENES[id](id);
}
console.log("done.");
