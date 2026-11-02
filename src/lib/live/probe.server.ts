import { assertPublicHttps, challengeAccepts, type Accept } from "@/lib/market/catalog";
import { SEED_HOSTS } from "@/lib/settings";

const DISCOVERY = "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources?limit=50&offset=0";
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

let hostsCache: { at: number; hosts: Set<string> } | null = null;

function hostOf(url: string): string {
  return new URL(url).hostname.toLowerCase();
}

async function discoveryHosts(): Promise<Set<string>> {
  if (hostsCache && Date.now() - hostsCache.at < 60_000) return hostsCache.hosts;
  const hosts = new Set<string>(SEED_HOSTS.map((host) => host.toLowerCase()));
  try {
    const response = await fetch(DISCOVERY, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
    if (response.ok) {
      const payload = (await response.json()) as { resources?: { resource?: string | { url?: string }; accepts?: { scheme?: string; network?: string; asset?: string }[] }[]; items?: unknown[] };
      const rows = payload.resources ?? payload.items ?? [];
      for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const record = row as { resource?: string | { url?: string }; accepts?: { scheme?: string; network?: string; asset?: string }[] };
        const resource = record.resource;
        const url = typeof resource === "string" ? resource : resource?.url;
        const base = (record.accepts ?? []).some((accept) => accept.scheme === "exact" && accept.network === "eip155:8453" && (accept.asset || "").toLowerCase() === USDC);
        if (url?.startsWith("https://") && base) hosts.add(hostOf(url));
      }
    }
  } catch {
    /* seeds still stand */
  }
  hostsCache = { at: Date.now(), hosts };
  return hosts;
}

export async function allowedHost(raw: string): Promise<boolean> {
  const url = assertPublicHttps(raw);
  const hosts = await discoveryHosts();
  const host = url.hostname.toLowerCase();
  return hosts.has(host) || hosts.has(host.replace(/^www\./, ""));
}

export async function probeAllowed(raw: string): Promise<{ status: number; paymentRequired: string; accepts: Accept[]; snippet: string }> {
  if (!(await allowedHost(raw))) throw new Error("That host is not on the allowlist.");
  const url = assertPublicHttps(raw);
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
    headers: { accept: "application/json, text/plain, */*" },
  });
  const header = response.headers.get("payment-required") ?? "";
  let paymentRequired = header;
  if (header) {
    try {
      paymentRequired = Buffer.from(header, "base64").toString("utf8");
    } catch {
      paymentRequired = header;
    }
  }
  const body = await response.text();
  return {
    status: response.status,
    paymentRequired,
    accepts: challengeAccepts(paymentRequired, body),
    snippet: body.slice(0, 2000),
  };
}

export async function discoverBase(): Promise<{ title: string; url: string; payers: number }[]> {
  const response = await fetch(DISCOVERY, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`Bazaar answered ${response.status}`);
  const payload = (await response.json()) as { resources?: Record<string, unknown>[] };
  const rows = payload.resources ?? [];
  const found: { title: string; url: string; payers: number }[] = [];
  for (const row of rows) {
    const resource = row.resource;
    const url = typeof resource === "string" ? resource : typeof resource === "object" && resource && "url" in resource ? String((resource as { url?: string }).url || "") : "";
    if (!url.startsWith("https://")) continue;
    const accepts = Array.isArray(row.accepts) ? row.accepts : [];
    const base = accepts.some((accept) => {
      const item = accept as { scheme?: string; network?: string; asset?: string };
      return item.scheme === "exact" && item.network === "eip155:8453" && (item.asset || "").toLowerCase() === USDC;
    });
    if (!base) continue;
    const quality = row.quality as { l30DaysUniquePayers?: number } | undefined;
    found.push({
      title: String(row.serviceName || row.name || new URL(url).hostname),
      url,
      payers: Number(quality?.l30DaysUniquePayers) || 0,
    });
  }
  return found.slice(0, 24);
}
