export interface Env {
  TARGET_URL: string;
  CRON_KEY: string;
  SLOTS?: string;
  BATCH_SIZE?: string;
}

function getUtcMinute(now = new Date()): number {
  return now.getUTCMinutes(); // 0..59
}

async function run(env: Env): Promise<Response> {
  const url = new URL(env.TARGET_URL);

  const slots = Math.max(1, Number(env.SLOTS ?? "6"));
  const batchSize = Math.max(1, Number(env.BATCH_SIZE ?? "10"));

  const minute = getUtcMinute();
  const slot = minute % slots;

  // params de paginação
  url.searchParams.set("slot", String(slot));
  url.searchParams.set("slots", String(slots));
  url.searchParams.set("batchSize", String(batchSize));

  // auth (teu endpoint aceita header OU query)
  url.searchParams.set("key", env.CRON_KEY);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "x-cron-key": env.CRON_KEY,
      "User-Agent": "PriceTracker-Worker/1.0"
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return new Response(`Upstream ${res.status}: ${body}`, { status: 502 });
  }

  return new Response("ok", { status: 200 });
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(run(env));
  },
  async fetch(_request: Request, env: Env): Promise<Response> {
    return run(env);
  },
};
