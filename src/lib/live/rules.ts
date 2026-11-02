import { blankMandate, evaluate, type Evaluation, type SpendOffer } from "@/lib/mandate";
import { loadReceipts } from "@/lib/receipts";
import { BASE_USDC, loadSettings, type Settings } from "@/lib/settings";

export const USDC = BASE_USDC.toLowerCase();

export type LiveItem = {
  id: string;
  title: string;
  url: string;
  knownPayTo?: string;
  payers?: number;
  discovered?: boolean;
};

export const SEEDS: LiveItem[] = [
  {
    id: "xpay-quote",
    title: "Payment quote (X Pay)",
    url: "https://www.api-xpay.com/x402/quote",
    knownPayTo: "0x589a2314a2E05f45e40C4823Da3Ba58D421dB3d8",
  },
  {
    id: "onesource-block",
    title: "Latest block height (OneSource)",
    url: "https://api.onesource.io/api/chain/block-number",
    knownPayTo: "0x52E29e0d2Aa49bfBfC548C0A9F2196F4aa51f3ea",
  },
  {
    id: "onesource-balance",
    title: "ERC-20 balance lookup (OneSource)",
    url: "https://api.onesource.io/api/chain/erc20-balance",
    knownPayTo: "0x52E29e0d2Aa49bfBfC548C0A9F2196F4aa51f3ea",
  },
  {
    id: "blockrun-chat",
    title: "AI chat completion (BlockRun)",
    url: "https://blockrun.ai/api/v1/chat/completions",
    knownPayTo: "0xe9030014F5DAe217d0A152f02A043567b16c1aBf",
  },
];

export const INTENT_EXAMPLES = [
  "Get Base's latest block number",
  "Check a wallet's USDC balance",
  "Ask an AI model one question",
  "Get a payment quote",
];

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function spentLastDay(now = Date.now()): number {
  const cutoff = now - 24 * 60 * 60 * 1000;
  return loadReceipts().reduce((sum, row) => {
    const at = new Date(row.createdAt).getTime();
    if (!Number.isFinite(at) || at < cutoff) return sum;
    return sum + (Number.isFinite(row.amountUsd) ? row.amountUsd : 0);
  }, 0);
}

export function rankItems(items: LiveItem[], query: string): LiveItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const score = (item: LiveItem) => {
    const hay = `${item.title} ${item.url}`.toLowerCase();
    if (hay.includes(q)) return 3;
    const words = q.split(/\s+/).filter((word) => word.length > 2);
    return words.reduce((total, word) => total + (hay.includes(word) ? 1 : 0), 0);
  };
  return [...items].sort((a, b) => score(b) - score(a) || a.title.localeCompare(b.title));
}

export function reviewLive(item: LiveItem, amountUsd: number, payTo: string, settings: Settings = loadSettings(), spent = spentLastDay()): Evaluation & { payeeChanged: boolean } {
  const host = hostOf(item.url);
  const payeeChanged = Boolean(item.knownPayTo && payTo && item.knownPayTo.toLowerCase() !== payTo.toLowerCase());
  const mandate = blankMandate({
    id: "live-rules",
    name: "Live rules",
    mode: "ask",
    perBuyUsd: settings.perPaymentUsd,
    window: { amountUsd: settings.perDayUsd, period: "day" },
    askAboveUsd: 0,
    merchants: { mode: "allowlist", domains: settings.hosts },
    payees: settings.payees,
    chains: [8453],
    assets: ["USDC"],
    categories: { block: [] },
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const offer: SpendOffer = {
    amountUsd,
    merchant: host,
    payTo,
    chainId: 8453,
    asset: "USDC",
    item: item.title,
    category: item.title,
  };
  const verdict = evaluate(mandate, offer, spent);
  return { ...verdict, payeeChanged };
}

export function amountUsd(amount: string): number | null {
  if (!/^\d+$/.test(amount)) return null;
  const value = Number(BigInt(amount)) / 1_000_000;
  return Number.isFinite(value) ? value : null;
}

export function isBaseUsdc(accept: { scheme?: string; network?: string; asset?: string }): boolean {
  return accept.scheme === "exact" && accept.network === "eip155:8453" && (accept.asset || "").toLowerCase() === USDC;
}
