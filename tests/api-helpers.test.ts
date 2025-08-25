// tests/api-helpers.test.ts
import { describe, it, expect } from "vitest";
import { createProductSchema, priceHistoryQuerySchema } from "../lib/validation";

describe("Schemas de API", () => {
  it("valida createProductSchema", () => {
    const ok = createProductSchema.safeParse({
      name: "SSD 1TB",
      store: "PICHAU",
      url: "https://www.pichau.com.br/produto/0002",
      sku: "SSD1TB-0002",
      isActive: true,
    });
    expect(ok.success).toBe(true);
  });

  it("falha se URL inválida", () => {
    const bad = createProductSchema.safeParse({
      name: "Item",
      store: "KABUM",
      url: "not-a-url",
    });
    expect(bad.success).toBe(false);
  });

  it("valida priceHistoryQuerySchema (days opcional)", () => {
    const q = priceHistoryQuerySchema.safeParse({ productId: "abc", days: "30" });
    expect(q.success).toBe(true);
    if (q.success) expect(q.data.days).toBe(30);
  });
});
