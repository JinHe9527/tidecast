/** Spot floored to the strike grid — the ATM strike (9-dec fixed point). */
export function floorToTick(spot: number, tickSize: number): number {
  return Math.floor(spot / tickSize) * tickSize;
}

/**
 * The shared strike domain around ATM: `span` ticks each side, high→low,
 * clamped at `minStrike`. Feeds the ladder rows and the smile/heat X-axis.
 */
export function strikeGrid(atm: number, tickSize: number, span: number, minStrike: number): number[] {
  const out: number[] = [];
  for (let i = span; i >= -span; i--) {
    const s = atm + i * tickSize;
    if (s >= minStrike) out.push(s);
  }
  return out;
}
