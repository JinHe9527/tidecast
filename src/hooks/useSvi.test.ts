import { describe, expect, it } from "vitest";
import { totalVariance, impliedVol, upProbability, type SviParams } from "@/hooks/useSvi";

// Params at the protocol-wide 9-dec scale, mirroring fetchSvi's parsing
// (rho/m carry sign flags). rho ≈ 0.94 per CLAUDE.md's verified rho_raw
// 940010306; a/b/sigma chosen so ATM IV lands in the plausible BTC band.
const SCALE = 1e9;
const SVI: SviParams = {
  a: 10_000 / SCALE, // 0.00001
  b: 1_000_000 / SCALE, // 0.001
  rho: (940_010_306 / SCALE), // +0.94001…
  m: 0 / SCALE, // 0 (m_negative would flip sign)
  sigma: 2_430_000 / SCALE, // 0.00243
  timestamp: 0,
};

const FORWARD = 62575; // forward in plain dollars (impliedVol only uses log(strike/forward))
const T = 1 / 8760; // ~1 hour, in years — the rolling sub-hourly oracles

describe("totalVariance", () => {
  it("at ATM (k=0) collapses to a + b·sqrt(m² + sigma²)", () => {
    const expected = SVI.a + SVI.b * (SVI.rho * -SVI.m + Math.sqrt(SVI.m ** 2 + SVI.sigma ** 2));
    expect(totalVariance(SVI, 0)).toBeCloseTo(expected, 12);
    expect(totalVariance(SVI, 0)).toBeGreaterThan(0);
  });

  it("rises away from the smile minimum (convex in k)", () => {
    const atm = totalVariance(SVI, 0);
    expect(totalVariance(SVI, 0.05)).toBeGreaterThan(atm);
    expect(totalVariance(SVI, -0.05)).toBeGreaterThan(atm);
  });
});

describe("impliedVol", () => {
  it("lands ATM IV in a sane annualized band (~0.3–0.6) for short-dated BTC", () => {
    const iv = impliedVol(SVI, FORWARD, FORWARD, T);
    expect(iv).toBeGreaterThan(0.3);
    expect(iv).toBeLessThan(0.6);
  });

  it("returns NaN when the fit is degenerate (negative variance)", () => {
    const bad: SviParams = { ...SVI, a: -1, b: 0, rho: 0, m: 0, sigma: 0 };
    expect(impliedVol(bad, FORWARD, FORWARD, T)).toBeNaN();
  });

  it("returns NaN at zero time-to-expiry", () => {
    expect(impliedVol(SVI, FORWARD, FORWARD, 0)).toBeNaN();
  });
});

describe("upProbability", () => {
  it("is ~0.5 at the money", () => {
    expect(upProbability(SVI, FORWARD, FORWARD, T)).toBeCloseTo(0.5, 1);
  });

  it("decreases monotonically as the strike rises", () => {
    const lo = upProbability(SVI, FORWARD * 0.99, FORWARD, T);
    const mid = upProbability(SVI, FORWARD, FORWARD, T);
    const hi = upProbability(SVI, FORWARD * 1.01, FORWARD, T);
    expect(lo).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(hi);
  });

  it("stays clamped within [0, 1] at extreme strikes", () => {
    const itm = upProbability(SVI, FORWARD * 0.5, FORWARD, T);
    const otm = upProbability(SVI, FORWARD * 2, FORWARD, T);
    expect(itm).toBeGreaterThanOrEqual(0);
    expect(itm).toBeLessThanOrEqual(1);
    expect(otm).toBeGreaterThanOrEqual(0);
    expect(otm).toBeLessThanOrEqual(1);
    // deep ITM ≈ near-certain, deep OTM ≈ near-impossible
    expect(itm).toBeGreaterThan(0.99);
    expect(otm).toBeLessThan(0.01);
  });

  it("returns NaN when the smile fit is degenerate", () => {
    const bad: SviParams = { ...SVI, a: -1, b: 0, rho: 0, m: 0, sigma: 0 };
    expect(upProbability(bad, FORWARD, FORWARD, T)).toBeNaN();
  });
});
