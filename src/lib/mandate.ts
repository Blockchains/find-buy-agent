import { sha256, toBytes, getAddress, isAddress, hashTypedData, type Hex } from "viem";
import { loadAgent } from "@/lib/market/agent";

export type MandateMode = "suggest" | "ask" | "auto";
export type WindowPeriod = "day" | "week" | "month";

export type Mandate = {
  id: string;
  version: 1;
  name: string;
  mode: MandateMode;
  perBuyUsd: number;
  window: { amountUsd: number; period: WindowPeriod };
  askAboveUsd: number;
  merchants: { mode: "allowlist" | "any"; domains: string[] };
  payees: string[];
  chains: number[];
  assets: string[];
  categories: { block: string[] };
  expiresAt: string;
  createdAt: string;
  owner?: string;
  signature?: string;
  digest?: string;
  ap2Type: "open";
  revokedAt?: string;
};

export type SpendOffer = {
  amountUsd: number | null;
  merchant: string;
  payTo?: string;
  chainId: number;
  asset: string;
  category?: string;
  item?: string;
};

export type RuleCode =
  | "per_buy_cap"
  | "window_cap"
  | "merchant_not_allowed"
  | "payee_not_allowed"
  | "chain_not_allowed"
  | "asset_not_allowed"
  | "category_blocked"
  | "expired"
  | "suggest_only"
  | "revoked"
  | "ask_every_time";

export type Check = { rule: RuleCode; result: "pass" | "ask" | "fail"; detail: string };
export type Decision = "pay" | "ask" | "block";
export type Evaluation = { checks: Check[]; decision: Decision; reason: RuleCode | "ok" };

export const MANDATE_CHAINS: { id: number; name: string }[] = [
  { id: 8453, name: "Base" },
  { id: 137, name: "Polygon" },
  { id: 42161, name: "Arbitrum" },
  { id: 10, name: "Optimism" },
  { id: 1, name: "Ethereum" },
  { id: 43114, name: "Avalanche" },
  { id: 56, name: "BNB" },
];

const STORE_KEY = "fba-mandates-v1";
const CHAIN_IDS = new Set(MANDATE_CHAINS.map((chain) => chain.id));

type Store = { version: 1; activeId: string; mandates: Mandate[] };

export function chainName(chainId: number): string {
  return MANDATE_CHAINS.find((chain) => chain.id === chainId)?.name ?? `Chain ${chainId}`;
}

export function ruleLabel(rule: RuleCode | "ok"): string {
  switch (rule) {
    case "per_buy_cap":
      return "the per-buy cap";
    case "window_cap":
      return "the window cap";
    case "merchant_not_allowed":
      return "the merchant allowlist";
    case "payee_not_allowed":
      return "the payee allowlist";
    case "chain_not_allowed":
      return "the chain allowlist";
    case "asset_not_allowed":
      return "the asset allowlist";
    case "category_blocked":
      return "a blocked category";
    case "expired":
      return "expiry";
    case "suggest_only":
      return "suggest only";
    case "revoked":
      return "a revoked mandate";
    case "ask_every_time":
      return "ask every time";
    default:
      return "your rules";
  }
}

export function normalizeDomain(value: string): string | null {
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/\.$/, "");
  if (!host || host.length > 253) return null;
  if (!/^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(host)) return null;
  return host;
}

export function validPayee(value: string): boolean {
  if (!isAddress(value)) return false;
  if (value === value.toLowerCase()) return true;
  try {
    return value === getAddress(value);
  } catch {
    return false;
  }
}

function money(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function plainEnglish(mandate: Mandate): string {
  const when = new Date(mandate.expiresAt);
  const expiry = Number.isNaN(when.getTime())
    ? "an unknown date"
    : when.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const places =
    mandate.merchants.mode === "any"
      ? "any merchant"
      : mandate.merchants.domains.length
        ? mandate.merchants.domains.join(", ")
        : "no merchant yet";
  const where = `in ${mandate.assets.join(", ") || "no asset"} on ${mandate.chains.map(chainName).join(", ") || "no chain"}`;
  const never = mandate.categories.block.length ? ` Never buys ${mandate.categories.block.join(", ")}.` : "";
  const end = ` ${where}.${never} Expires ${expiry}.`;
  if (mandate.revokedAt) return `Revoked. This mandate cannot pay.${end}`;
  if (mandate.mode === "suggest") return `Finds and compares. Never pays.${end}`;
  if (mandate.mode === "ask") {
    return `Asks before every buy, up to $${money(mandate.perBuyUsd)} per buy and $${money(mandate.window.amountUsd)} per ${mandate.window.period} at ${places}, ${where}.${never} Expires ${expiry}.`;
  }
  return `Auto-pays up to $${money(mandate.perBuyUsd)} per buy and $${money(mandate.window.amountUsd)} per ${mandate.window.period} at ${places}, ${where}. Asks first above $${money(mandate.askAboveUsd)}.${never} Expires ${expiry}.`;
}

function hostAllowed(domains: string[], merchant: string): boolean {
  const host = merchant.toLowerCase().replace(/^www\./, "");
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function sameWindow(period: WindowPeriod, at: Date, now: Date): boolean {
  if (period === "day") return at.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  if (period === "month") return at.toISOString().slice(0, 7) === now.toISOString().slice(0, 7);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return at >= start && at < end;
}

export function spentInWindow(mandate: Mandate, rows: { createdAt: string; amountUsd: number; status: string }[], now = new Date()): number {
  return rows.reduce((sum, row) => {
    if (row.status !== "settled" && row.status !== "signed") return sum;
    const at = new Date(row.createdAt);
    if (Number.isNaN(at.getTime()) || !sameWindow(mandate.window.period, at, now)) return sum;
    return sum + (Number.isFinite(row.amountUsd) ? row.amountUsd : 0);
  }, 0);
}

export function windowAlert(spent: number, cap: number): null | 80 | 95 {
  if (!(cap > 0) || !(spent >= 0)) return null;
  const ratio = spent / cap;
  if (ratio >= 0.95) return 95;
  if (ratio >= 0.8) return 80;
  return null;
}

export function evaluate(mandate: Mandate, offer: SpendOffer, spentInThisWindow: number, now = new Date()): Evaluation {
  const checks: Check[] = [];
  const amount = offer.amountUsd;
  const merchant = offer.merchant.toLowerCase().replace(/^www\./, "");
  if (mandate.revokedAt) {
    checks.push({ rule: "revoked", result: "fail", detail: "This mandate was revoked. It cannot pay." });
  } else {
    checks.push({ rule: "revoked", result: "pass", detail: "Mandate is active." });
  }
  const expiry = new Date(mandate.expiresAt);
  if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= now.getTime()) {
    checks.push({ rule: "expired", result: "fail", detail: "This mandate has expired." });
  } else {
    checks.push({ rule: "expired", result: "pass", detail: `Expires ${expiry.toISOString()}.` });
  }
  if (mandate.mode === "suggest") {
    checks.push({ rule: "suggest_only", result: "fail", detail: "Suggest only. Finds and compares. Never pays." });
  } else {
    checks.push({ rule: "suggest_only", result: "pass", detail: "Paying is allowed by the mode." });
  }
  const blocked = mandate.categories.block.find((item) => {
    const needle = item.trim().toLowerCase();
    if (!needle) return false;
    return `${offer.category ?? ""} ${offer.item ?? ""} ${merchant}`.toLowerCase().includes(needle);
  });
  checks.push(
    blocked
      ? { rule: "category_blocked", result: "fail", detail: `Blocked category: ${blocked}.` }
      : { rule: "category_blocked", result: "pass", detail: "No blocked category matched." },
  );
  if (mandate.merchants.mode === "allowlist" && !hostAllowed(mandate.merchants.domains, merchant)) {
    checks.push({ rule: "merchant_not_allowed", result: "fail", detail: `${merchant || "This merchant"} is not on the allowlist.` });
  } else {
    checks.push({ rule: "merchant_not_allowed", result: "pass", detail: mandate.merchants.mode === "any" ? "Any merchant is allowed." : `${merchant} is allowed.` });
  }
  const payee = (offer.payTo || "").toLowerCase();
  if (mandate.payees.length > 0 && !mandate.payees.some((item) => item.toLowerCase() === payee)) {
    checks.push({ rule: "payee_not_allowed", result: "fail", detail: "This payTo address is not on the allowlist." });
  } else {
    checks.push({ rule: "payee_not_allowed", result: "pass", detail: mandate.payees.length ? "Payee is allowed." : "No payee restriction." });
  }
  checks.push(
    mandate.chains.includes(offer.chainId)
      ? { rule: "chain_not_allowed", result: "pass", detail: `${chainName(offer.chainId)} is allowed.` }
      : { rule: "chain_not_allowed", result: "fail", detail: `${chainName(offer.chainId)} is not allowed.` },
  );
  const asset = offer.asset.toUpperCase();
  checks.push(
    mandate.assets.some((item) => item.toUpperCase() === asset)
      ? { rule: "asset_not_allowed", result: "pass", detail: `${asset} is allowed.` }
      : { rule: "asset_not_allowed", result: "fail", detail: `${asset || "This asset"} is not allowed.` },
  );
  if (amount === null) {
    checks.push({ rule: "per_buy_cap", result: "ask", detail: "The price was not in USD, so it waits for you." });
    checks.push({ rule: "window_cap", result: "ask", detail: "The window cannot be checked without a USD price." });
  } else if (amount > mandate.perBuyUsd) {
    checks.push({ rule: "per_buy_cap", result: "fail", detail: `$${money(amount)} is over the $${money(mandate.perBuyUsd)} per-buy cap.` });
    checks.push({
      rule: "window_cap",
      result: spentInThisWindow + amount > mandate.window.amountUsd ? "fail" : "pass",
      detail: `$${money(spentInThisWindow + amount)} against $${money(mandate.window.amountUsd)} this ${mandate.window.period}.`,
    });
  } else if (mandate.mode === "auto" && amount > mandate.askAboveUsd) {
    checks.push({ rule: "per_buy_cap", result: "ask", detail: `$${money(amount)} is above the ask-first line of $${money(mandate.askAboveUsd)}.` });
    checks.push({
      rule: "window_cap",
      result: spentInThisWindow + amount > mandate.window.amountUsd ? "fail" : "pass",
      detail: `$${money(spentInThisWindow + amount)} against $${money(mandate.window.amountUsd)} this ${mandate.window.period}.`,
    });
  } else {
    checks.push({ rule: "per_buy_cap", result: "pass", detail: `$${money(amount)} is within $${money(mandate.perBuyUsd)}.` });
    checks.push({
      rule: "window_cap",
      result: spentInThisWindow + amount > mandate.window.amountUsd ? "fail" : "pass",
      detail: `$${money(spentInThisWindow + amount)} against $${money(mandate.window.amountUsd)} this ${mandate.window.period}.`,
    });
  }
  if (mandate.mode === "ask" && !checks.some((check) => check.result === "fail")) {
    checks.push({ rule: "ask_every_time", result: "ask", detail: "Ask every time is on. This still waits for you." });
  }
  const failed = checks.find((check) => check.result === "fail");
  if (failed) return { checks, decision: "block", reason: failed.rule };
  const asking = checks.find((check) => check.result === "ask");
  if (asking) return { checks, decision: "ask", reason: asking.rule };
  return { checks, decision: "pay", reason: "ok" };
}

export function blankMandate(partial: Partial<Mandate> = {}): Mandate {
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    id: crypto.randomUUID(),
    version: 1,
    name: "Everyday buys",
    mode: "ask",
    perBuyUsd: 20,
    window: { amountUsd: 50, period: "day" },
    askAboveUsd: 20,
    merchants: { mode: "any", domains: [] },
    payees: [],
    chains: MANDATE_CHAINS.map((chain) => chain.id),
    assets: ["USDC"],
    categories: { block: [] },
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
    ap2Type: "open",
    ...partial,
  };
}

function fromVault(): Mandate {
  const agent = loadAgent();
  return blankMandate({
    name: "Everyday buys",
    mode: agent.rules.auto ? "auto" : "ask",
    perBuyUsd: agent.rules.maxUsd,
    window: { amountUsd: agent.rules.dailyUsd, period: "day" },
    askAboveUsd: agent.rules.maxUsd,
  });
}

function asMandate(value: unknown): Mandate | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1 || raw.ap2Type !== "open") return null;
  if (typeof raw.id !== "string" || typeof raw.name !== "string" || raw.name.length < 1 || raw.name.length > 80) return null;
  if (raw.mode !== "suggest" && raw.mode !== "ask" && raw.mode !== "auto") return null;
  if (typeof raw.perBuyUsd !== "number" || raw.perBuyUsd < 0 || raw.perBuyUsd > 100000) return null;
  const window = raw.window as { amountUsd?: unknown; period?: unknown } | undefined;
  if (!window || typeof window.amountUsd !== "number" || window.amountUsd < 0) return null;
  if (window.period !== "day" && window.period !== "week" && window.period !== "month") return null;
  if (typeof raw.askAboveUsd !== "number" || raw.askAboveUsd < 0) return null;
  const merchants = raw.merchants as { mode?: unknown; domains?: unknown } | undefined;
  if (!merchants || (merchants.mode !== "allowlist" && merchants.mode !== "any") || !Array.isArray(merchants.domains)) return null;
  if (!merchants.domains.every((domain) => typeof domain === "string" && normalizeDomain(domain))) return null;
  if (!Array.isArray(raw.payees) || !raw.payees.every((payee) => typeof payee === "string" && validPayee(payee))) return null;
  if (!Array.isArray(raw.chains) || raw.chains.some((chain) => typeof chain !== "number" || chain === 84532 || !CHAIN_IDS.has(chain))) return null;
  if (!Array.isArray(raw.assets) || raw.assets.some((asset) => asset !== "USDC")) return null;
  const categories = raw.categories as { block?: unknown } | undefined;
  if (!categories || !Array.isArray(categories.block) || categories.block.some((item) => typeof item !== "string")) return null;
  if (typeof raw.expiresAt !== "string" || typeof raw.createdAt !== "string") return null;
  return {
    id: raw.id,
    version: 1,
    name: raw.name,
    mode: raw.mode,
    perBuyUsd: raw.perBuyUsd,
    window: { amountUsd: window.amountUsd, period: window.period },
    askAboveUsd: raw.askAboveUsd,
    merchants: { mode: merchants.mode, domains: merchants.domains.map((domain) => normalizeDomain(domain)!) },
    payees: raw.payees,
    chains: raw.chains,
    assets: ["USDC"],
    categories: { block: categories.block.map((item) => item.trim()).filter(Boolean) },
    expiresAt: raw.expiresAt,
    createdAt: raw.createdAt,
    owner: typeof raw.owner === "string" ? raw.owner : undefined,
    signature: typeof raw.signature === "string" ? raw.signature : undefined,
    digest: typeof raw.digest === "string" ? raw.digest : undefined,
    ap2Type: "open",
    revokedAt: typeof raw.revokedAt === "string" ? raw.revokedAt : undefined,
  };
}

export function loadMandates(): Store {
  const fallback = (): Store => {
    const mandate = fromVault();
    return { version: 1, activeId: mandate.id, mandates: [mandate] };
  };
  if (typeof localStorage === "undefined") return fallback();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const created = fallback();
      localStorage.setItem(STORE_KEY, JSON.stringify(created));
      return created;
    }
    const parsed = JSON.parse(raw) as { version?: number; activeId?: string; mandates?: unknown[] };
    const mandates = (parsed.mandates ?? []).map(asMandate).filter((item): item is Mandate => Boolean(item));
    if (!mandates.length) return fallback();
    const activeId = mandates.some((item) => item.id === parsed.activeId) ? parsed.activeId! : mandates[0].id;
    return { version: 1, activeId, mandates };
  } catch {
    return fallback();
  }
}

export function saveMandates(store: Store) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("fba-mandate"));
}

export function activeMandate(): Mandate {
  const store = loadMandates();
  return store.mandates.find((item) => item.id === store.activeId) ?? store.mandates[0];
}

export function upsertMandate(mandate: Mandate, makeActive = false): Store {
  const store = loadMandates();
  const mandates = store.mandates.some((item) => item.id === mandate.id)
    ? store.mandates.map((item) => (item.id === mandate.id ? mandate : item))
    : [mandate, ...store.mandates];
  const next = { version: 1 as const, activeId: makeActive ? mandate.id : store.activeId, mandates };
  saveMandates(next);
  return next;
}

export function setActiveMandate(id: string): Store {
  const store = loadMandates();
  if (!store.mandates.some((item) => item.id === id)) return store;
  const next = { ...store, activeId: id };
  saveMandates(next);
  return next;
}

const MANDATE_TYPES = {
  Mandate: [
    { name: "id", type: "string" },
    { name: "name", type: "string" },
    { name: "mode", type: "string" },
    { name: "perBuyUsd", type: "string" },
    { name: "windowAmountUsd", type: "string" },
    { name: "windowPeriod", type: "string" },
    { name: "askAboveUsd", type: "string" },
    { name: "merchantMode", type: "string" },
    { name: "merchantDomains", type: "string" },
    { name: "payees", type: "string" },
    { name: "chains", type: "string" },
    { name: "assets", type: "string" },
    { name: "blocked", type: "string" },
    { name: "expiresAt", type: "string" },
  ],
} as const;

function mandateMessage(mandate: Mandate) {
  return {
    id: mandate.id,
    name: mandate.name,
    mode: mandate.mode,
    perBuyUsd: money(mandate.perBuyUsd),
    windowAmountUsd: money(mandate.window.amountUsd),
    windowPeriod: mandate.window.period,
    askAboveUsd: money(mandate.askAboveUsd),
    merchantMode: mandate.merchants.mode,
    merchantDomains: mandate.merchants.domains.join(","),
    payees: mandate.payees.join(","),
    chains: mandate.chains.join(","),
    assets: mandate.assets.join(","),
    blocked: mandate.categories.block.join(","),
    expiresAt: mandate.expiresAt,
  };
}

export function mandateDigest(mandate: Mandate, chainId: number): Hex {
  return hashTypedData({
    domain: { name: "FindBuyAgent Mandate", version: "1", chainId },
    types: MANDATE_TYPES,
    primaryType: "Mandate",
    message: mandateMessage(mandate),
  });
}

export function mandateSignPayload(mandate: Mandate, chainId: number): string {
  return JSON.stringify({
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
      ],
      Mandate: MANDATE_TYPES.Mandate,
    },
    primaryType: "Mandate",
    domain: { name: "FindBuyAgent Mandate", version: "1", chainId },
    message: mandateMessage(mandate),
  });
}

export function parseMandateImport(text: string): Mandate[] {
  const parsed = JSON.parse(text) as unknown;
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const mandates = rows.map(asMandate);
  if (mandates.some((item) => !item)) throw new Error("That file is not a FindBuyAgent mandate.");
  return mandates as Mandate[];
}

export function canon(value: unknown): string {
  if (typeof value !== "object" || value === null) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canon(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canon(item)}`).join(",")}}`;
}

export function sha256Text(value: string): string {
  return sha256(toBytes(value));
}
