import { describe, expect, it } from "vitest";
import { floorToTick, strikeGrid } from "@/lib/strikes";

// Verified grid (CLAUDE.md): tick 1e9, min_strike 50000000000000.
const TICK = 1_000_000_000;
const MIN = 50_000_000_000_000;

describe("floorToTick", () => {
  it("floors a 9-dec spot to the strike grid", () => {
    // spot $62,575.368 → ATM $62,575 (62575000000000)
    expect(floorToTick(62575368041947, TICK)).toBe(62575000000000);
  });

  it("leaves an exact tick multiple unchanged", () => {
    expect(floorToTick(62575000000000, TICK)).toBe(62575000000000);
  });

  it("floors toward zero across a tick boundary", () => {
    expect(floorToTick(62575999999999, TICK)).toBe(62575000000000);
  });
});

describe("strikeGrid", () => {
  it("returns 2*span+1 strikes high→low around ATM", () => {
    const atm = 62575000000000;
    const g = strikeGrid(atm, TICK, 4, MIN);
    expect(g).toHaveLength(9);
    expect(g[0]).toBe(atm + 4 * TICK); // highest first
    expect(g[4]).toBe(atm); // ATM centered
    expect(g.at(-1)).toBe(atm - 4 * TICK); // lowest last
  });

  it("is strictly descending", () => {
    const g = strikeGrid(62575000000000, TICK, 4, MIN);
    for (let i = 1; i < g.length; i++) expect(g[i]).toBeLessThan(g[i - 1]);
  });

  it("clamps rows that fall below min_strike", () => {
    // ATM two ticks above the floor: only ATM-2..ATM+span survive.
    const atm = MIN + 2 * TICK;
    const g = strikeGrid(atm, TICK, 4, MIN);
    expect(g.at(-1)).toBe(MIN);
    expect(g.every((s) => s >= MIN)).toBe(true);
    expect(g).toHaveLength(7); // span above (5) + ATM..MIN (2 below + ATM)
  });
});
