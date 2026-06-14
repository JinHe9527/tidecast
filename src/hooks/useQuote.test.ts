import { describe, expect, it } from "vitest";
import { bcs } from "@mysten/sui/bcs";
import { decodeU64 } from "@/hooks/useQuote";

// devInspect returnValues are little-endian u64 byte arrays. The verified
// 10-dUSDC UP quote at ATM was (cost, alt) = (5022519, 4822543).
describe("decodeU64", () => {
  it("decodes the verified quote bytes (little-endian)", () => {
    // 5022519 = 0x4CA337 → LE bytes [0x37, 0xA3, 0x4C, 0, 0, 0, 0, 0]
    expect(decodeU64([0x37, 0xa3, 0x4c, 0, 0, 0, 0, 0])).toBe(5022519n);
    // 4822543 = 0x49960F → LE bytes [0x0F, 0x96, 0x49, 0, 0, 0, 0, 0]
    expect(decodeU64([0x0f, 0x96, 0x49, 0, 0, 0, 0, 0])).toBe(4822543n);
  });

  it("decodes zero and one", () => {
    expect(decodeU64([0, 0, 0, 0, 0, 0, 0, 0])).toBe(0n);
    expect(decodeU64([1, 0, 0, 0, 0, 0, 0, 0])).toBe(1n);
  });

  it("respects byte order (256 sits in the second byte)", () => {
    expect(decodeU64([0, 1, 0, 0, 0, 0, 0, 0])).toBe(256n);
  });

  it("decodes max u64", () => {
    expect(decodeU64([255, 255, 255, 255, 255, 255, 255, 255])).toBe(18446744073709551615n);
  });

  it("accepts a Uint8Array as well as a number[]", () => {
    expect(decodeU64(Uint8Array.from([0x37, 0xa3, 0x4c, 0, 0, 0, 0, 0]))).toBe(5022519n);
  });

  it("round-trips against bcs.u64 serialization", () => {
    for (const v of [0n, 1n, 1000n, 5022519n, 18446744073709551615n]) {
      const bytes = Array.from(bcs.u64().serialize(v).toBytes());
      expect(decodeU64(bytes)).toBe(v);
    }
  });
});
