// tests/terabyte.test.ts
import { describe, it, expect, vi } from "vitest";
import { parseBRL } from "../lib/price";
import { scrapeTerabytePrice } from "../lib/scrapers/terabyte";
import * as http from "../lib/http";

describe("scrapeTerabytePrice", () => {
  it("usa JSON-LD quando disponível", async () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@type":"Product","offers":{"@type":"Offer","price":"1499.90"}}
        </script>
      </head><body></body></html>
    `;
    // @ts-ignore
    vi.spyOn(http, "fetchWithRetry").mockResolvedValue({ html, status: 200 });

    const { price, currency } = await scrapeTerabytePrice("https://www.terabyteshop.com.br/produto/x");
    expect(price).toBeCloseTo(1499.9, 1);
    expect(currency).toBe("BRL");
  });

  it("cai para seletor HTML quando não há JSON-LD", async () => {
    const html = `<div class="product-price">R$ 2.099,00</div>`;
    // @ts-ignore
    vi.spyOn(http, "fetchWithRetry").mockResolvedValue({ html, status: 200 });

    const { price } = await scrapeTerabytePrice("https://www.terabyteshop.com.br/produto/y");
    expect(price).toBeCloseTo(2099.0, 1);
  });

  it("parseBRL funciona para formatos comuns", () => {
    expect(parseBRL("R$ 1.234,56")).toBeCloseTo(1234.56, 2);
  });
});
