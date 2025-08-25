// tests/pichau.test.ts
import { describe, it, expect, vi } from "vitest";
import { parseBRL } from "../lib/price";
import { scrapePichauPrice } from "../lib/scrapers/pichau";
import * as http from "../lib/http";

describe("scrapePichauPrice", () => {
  it("usa JSON-LD quando disponível", async () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@type":"Product","offers":{"@type":"Offer","price":"999.90"}}
        </script>
      </head><body></body></html>
    `;
    // @ts-ignore
    vi.spyOn(http, "fetchWithRetry").mockResolvedValue({ html, status: 200 });

    const { price, currency } = await scrapePichauPrice("https://www.pichau.com.br/produto/x");
    expect(price).toBeCloseTo(999.9, 1);
    expect(currency).toBe("BRL");
  });

  it("cai para seletor HTML quando não há JSON-LD", async () => {
    const html = `<span class="price">R$ 2.499,00</span>`;
    // @ts-ignore
    vi.spyOn(http, "fetchWithRetry").mockResolvedValue({ html, status: 200 });

    const { price } = await scrapePichauPrice("https://www.pichau.com.br/produto/y");
    expect(price).toBeCloseTo(2499.0, 1);
  });

  it("parseBRL converte formatos comuns", () => {
    expect(parseBRL("R$ 1.234,56")).toBeCloseTo(1234.56, 2);
  });
});
