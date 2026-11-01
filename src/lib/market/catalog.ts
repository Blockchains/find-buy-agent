export type SourceId = "coinbase" | "circle" | "binance";

export type Accept = {
  scheme: string;
  network: string;
  networkLabel: string;
  asset: string;
  assetName: string;
  amount: string;
  priceLabel: string;
  payTo: string;
  timeoutSeconds: number;
  evm: boolean;
  extra: Record<string, string>;
};

export type Offer = {
  id: string;
  source: SourceId;
  sourceLabel: string;
  name: string;
  description: string;
  url: string;
  tags: string[];
  updated: string;
  accepts: Accept[];
};

export type SourcePage = {
  id: SourceId;
  label: string;
  total: number | null;
  offset: number;
  limit: number;
  error?: string;
  offers: Offer[];
};

export type MarketPage = {
  queriedAt: string;
  query: string;
  sources: SourcePage[];
};

const USDC = new Set(
  [
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v",
  ].map((item) => item.toLowerCase()),
);

const NETWORKS: Record<string, string> = {
  "eip155:1": "Ethereum",
  "eip155:137": "Polygon",
  "eip155:143": "Monad",
  "eip155:8453": "Base",
  "eip155:42161": "Arbitrum",
  "eip155:10": "Optimism",
  "eip155:56": "BNB Chain",
  "solana:5eykt4usfv8p8njdtrepy1vzqkqzkvdp": "Solana",
};

const SOURCES: Record<SourceId, { label: string }> = {
  coinbase: { label: "Coinbase Bazaar" },
  circle: { label: "Circle" },
  binance: { label: "Binance B402" },
};

export function sourceIds(): SourceId[] {
  return ["coinbase", "circle", "binance"];
}

export function sourceLabel(id: SourceId): string {
  return SOURCES[id].label;
}

function networkLabel(network: string): string {
  return NETWORKS[network.toLowerCase()] ?? network;
}

function priceLabel(amount: string, assetName: string, asset: string): string {
  if (!/^\d+$/.test(amount)) return amount;
  const stable = /usd coin|usdc|usd1/i.test(assetName) || USDC.has(asset.toLowerCase());
  const usd1 = /usd1/i.test(assetName) || asset.toLowerCase() === "0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d";
  const decimals = usd1 || amount.length > 10 ? 18 : 6;
  const whole = amount.length > decimals ? amount.slice(0, amount.length - decimals) : "0";
  const fracRaw = amount.length > decimals ? amount.slice(amount.length - decimals) : amount.padStart(decimals, "0");
  const frac = fracRaw.slice(0, 6).replace(/0+$/, "");
  const shown = frac ? `${whole}.${frac}` : whole;
  if (usd1) return `USD1 ${shown}`;
  if (stable || decimals === 6) return `$${shown}`;
  return `${shown} ${assetName || "token"}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}

function normalizeAccept(raw: unknown): Accept | null {
  const row = asRecord(raw);
  if (!row) return null;
  const asset = str(row.asset);
  const amount = str(row.amount) || str(row.maxAmountRequired);
  const payTo = str(row.payTo);
  const network = str(row.network);
  if (!asset || !amount || !payTo || !network) return null;
  const extraRaw = asRecord(row.extra) ?? {};
  const extra: Record<string, string> = {};
  for (const [key, value] of Object.entries(extraRaw)) {
    if (typeof value === "string") extra[key] = value;
  }
  const assetName = extra.name || "";
  return {
    scheme: str(row.scheme) || "exact",
    network,
    networkLabel: networkLabel(network),
    asset,
    assetName,
    amount,
    priceLabel: priceLabel(amount, assetName, asset),
    payTo,
    timeoutSeconds: Number(row.maxTimeoutSeconds) || 60,
    evm: network.toLowerCase().startsWith("eip155:"),
    extra,
  };
}

function normalizeItem(source: SourceId, raw: unknown): Offer | null {
  const row = asRecord(raw);
  if (!row) return null;
  const resource = row.resource;
  const url = typeof resource === "string" ? resource : str(asRecord(resource)?.url);
  if (!url.startsWith("https://")) return null;
  const accepts = Array.isArray(row.accepts) ? row.accepts.map(normalizeAccept).filter((item): item is Accept => Boolean(item)) : [];
  if (accepts.length === 0) return null;
  const tags = Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [];
  const name = str(row.serviceName) || str(row.name) || hostOf(url);
  return {
    id: `${source}:${url}`,
    source,
    sourceLabel: SOURCES[source].label,
    name,
    description: str(row.description),
    url,
    tags: tags.slice(0, 6),
    updated: str(row.lastUpdated),
    accepts,
  };
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function extract(payload: unknown): { items: unknown[]; total: number | null } {
  const root = asRecord(payload) ?? {};
  const nested = asRecord(root.data);
  const body = nested && (Array.isArray(nested.items) || Array.isArray(nested.resources)) ? nested : root;
  const items = Array.isArray(body.items) ? body.items : Array.isArray(body.resources) ? body.resources : [];
  const pagination = asRecord(body.pagination) ?? asRecord(root.pagination);
  const total = pagination && typeof pagination.total === "number" ? pagination.total : null;
  return { items, total };
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "FindBuyAgent/1.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`${response.status} from ${new URL(url).hostname}`);
  return response.json();
}

function listUrl(source: SourceId, limit: number, offset: number, query: string): string {
  const q = query.trim();
  if (source === "coinbase") {
    if (q) {
      return `https://api.cdp.coinbase.com/platform/v2/x402/discovery/search?query=${encodeURIComponent(q)}&limit=${limit}`;
    }
    return `https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources?limit=${limit}&offset=${offset}`;
  }
  if (source === "circle") {
    const base = `https://api.circle.com/v2/x402/discovery/resources?limit=${limit}&offset=${offset}`;
    return q ? `${base}&query=${encodeURIComponent(q)}` : base;
  }
  if (q) {
    return `https://www.binance.com/bapi/ramp/v1/public/ramp/b402/bazaar/search?query=${encodeURIComponent(q)}&limit=${limit}`;
  }
  return `https://www.binance.com/bapi/ramp/v1/public/ramp/b402/bazaar/resources?limit=${limit}&offset=${offset}`;
}

const cache = new Map<string, { at: number; page: SourcePage }>();

async function loadSource(source: SourceId, limit: number, offset: number, query: string): Promise<SourcePage> {
  const key = `${source}:${limit}:${offset}:${query.trim().toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 45_000) return hit.page;
  try {
    const payload = await getJson(listUrl(source, limit, offset, query));
    const { items, total } = extract(payload);
    const offers = items.map((item) => normalizeItem(source, item)).filter((item): item is Offer => Boolean(item));
    const page: SourcePage = { id: source, label: SOURCES[source].label, total, offset, limit, offers };
    cache.set(key, { at: Date.now(), page });
    return page;
  } catch (error) {
    return {
      id: source,
      label: SOURCES[source].label,
      total: null,
      offset,
      limit,
      offers: [],
      error: error instanceof Error ? error.message : "Catalog request failed",
    };
  }
}

export async function loadMarket(input: {
  source?: SourceId | "all";
  offset?: number;
  limit?: number;
  query?: string;
}): Promise<MarketPage> {
  const chosen = input.source && input.source !== "all" ? [input.source] : sourceIds();
  const limit = Math.min(Math.max(input.limit ?? 24, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);
  const query = (input.query ?? "").trim().slice(0, 160);
  const sources = await Promise.all(chosen.map((source) => loadSource(source, limit, offset, query)));
  return { queriedAt: new Date().toISOString(), query, sources };
}

export function assertPublicHttps(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("Only https resources can be opened.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
    throw new Error("That host is not a public merchant.");
  }
  if (/^(10\.|127\.|0\.0\.0\.0|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) {
    throw new Error("That host is not a public merchant.");
  }
  return url;
}
