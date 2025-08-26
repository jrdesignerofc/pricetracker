// tests/scraper.test.ts
import { describe, expect, it } from "vitest";
import { parseBRL } from "../lib/utils/price-utils";

describe("parseBRL", () => {
  it("parse formats", () => {
    expect(parseBRL("R$ 1.234,56")).toBeCloseTo(1234.56);
    expect(parseBRL("1.234,56")).toBeCloseTo(1234.56);
    expect(parseBRL("1234,56")).toBeCloseTo(1234.56);
    expect(parseBRL("R$ 45,00")).toBeCloseTo(45);
  });
});
