import { describe, expect, it } from "vitest";
import { fmtUsd, fmtDusdc } from "@/lib/constants";

// fmtUsd: 9-dec fixed point → "$X,XXX". 62575368041947 = $62,575.368.
describe("fmtUsd", () => {
  it("renders a 9-dec price as whole-dollar currency", () => {
    expect(fmtUsd(62575368041947)).toBe("$62,575");
  });

  it("rounds to the requested fraction digits", () => {
    expect(fmtUsd(62575368041947, 3)).toBe("$62,575.368");
  });

  it("renders zero", () => {
    expect(fmtUsd(0)).toBe("$0");
  });

  it("accepts bigint and adds thousands separators", () => {
    // 1_000_000 * 1e9 raw = $1,000,000
    expect(fmtUsd(1_000_000_000_000_000n)).toBe("$1,000,000");
  });

  it("handles a single tick (1e9 raw = $1)", () => {
    expect(fmtUsd(1_000_000_000)).toBe("$1");
  });
});

// fmtDusdc: 6-dec raw → "x.xx dUSDC".
describe("fmtDusdc", () => {
  it("renders a 6-dec raw amount with 2 decimals", () => {
    // 5022519 raw ≈ 5.02 dUSDC (the verified UP quote cost)
    expect(fmtDusdc(5022519)).toBe("5.02 dUSDC");
  });

  it("renders zero", () => {
    expect(fmtDusdc(0)).toBe("0.00 dUSDC");
  });

  it("renders a whole 10 dUSDC (10_000_000 raw)", () => {
    expect(fmtDusdc(10_000_000)).toBe("10.00 dUSDC");
  });

  it("accepts bigint and adds thousands separators for large amounts", () => {
    expect(fmtDusdc(1_234_567_000_000n)).toBe("1,234,567.00 dUSDC");
  });

  it("honors a custom digit count", () => {
    expect(fmtDusdc(5022519, 4)).toBe("5.0225 dUSDC");
  });
});
