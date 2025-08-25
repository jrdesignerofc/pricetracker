// lib/http.ts (substitua a função fetchWithRetry inteira por esta versão)
type FetchOpts = {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryBackoffMs?: number;
};

export async function fetchWithRetry(url: string, opts: FetchOpts = {}) {
  const {
    headers = {},
    timeoutMs = Number(process.env.SCRAPE_TIMEOUT_MS ?? 12000),
    retries = Number(process.env.SCRAPE_MAX_RETRIES ?? 2),
    retryBackoffMs = Number(process.env.SCRAPE_BACKOFF_MS ?? 800),
  } = opts;

  const ua =
    process.env.SCRAPE_USER_AGENT ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
          ...headers,
        },
        signal: controller.signal,
      });
      clearTimeout(t);

      if (!res.ok) {
        // 404/410: não tenta de novo
        if (res.status === 404 || res.status === 410) {
          throw new Error(`HTTP ${res.status}`);
        }
        // 5xx/429: pode tentar retry
        if ((res.status >= 500 || res.status === 429) && attempt < retries) {
          await sleep(retryBackoffMs * Math.pow(2, attempt));
          attempt++;
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();
      return { html, status: res.status };
    } catch (err) {
      clearTimeout(t);
      lastErr = err;
      if (attempt < retries) {
        await sleep(retryBackoffMs * Math.pow(2, attempt));
        attempt++;
      } else {
        break;
      }
    }
  }
  throw lastErr ?? new Error("fetchWithRetry failed");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
