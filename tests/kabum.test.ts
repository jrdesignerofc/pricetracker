// tests/kabum.test.ts
import { describe, it, expect } from "vitest";
import { parseBRL } from "../lib/price";
import { scrapeKabumPrice } from "../lib/scrapers/kabum";
import * as http from "../lib/http";

// Testa parseBRL isolado
describe("parseBRL", () => {
  it("converte string BRL em número", () => {
    expect(parseBRL("R$ 1.234,56")).toBeCloseTo(1234.56, 2);
    expect(parseBRL("1.999,00")).toBe(1999.0);
  });
});

// Mock simples do fetchWithRetry para testar parser do KaBuM
describe("scrapeKabumPrice", () => {
  it("lê preço do JSON-LD quando disponível", async () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@type":"Product","name":"Item","offers":{"@type":"Offer","price":"2799.90"}}
        </script>
      </head><body></body></html>
    `;
    // @ts-ignore
    vi.spyOn(http, "fetchWithRetry").mockResolvedValue({ html, status: 200 });

    const { price, currency } = await scrapeKabumPrice("https://www.kabum.com.br/produto/foo");
    expect(price).toBeCloseTo(2799.9, 1);
    expect(currency).toBe("BRL");
  });

  it("cai para seletor HTML quando não há JSON-LD", async () => {
    const html = `
      <div class="finalPrice">R$ 1.899,90</div>
    `;
    // @ts-ignore
    vi.spyOn(http, "fetchWithRetry").mockResolvedValue({ html, status: 200 });

    const { price } = await scrapeKabumPrice("https://www.kabum.com.br/produto/bar");
    expect(price).toBeCloseTo(1899.9, 1);
  });
});
