import type { Check, Evaluation, Mandate, SpendOffer } from "@/lib/mandate";
import { canon, sha256Text } from "@/lib/mandate";

export type ReceiptStatus = "signed" | "settled" | "declined" | "blocked";

export type Receipt = {
  id: string;
  mandateId: string;
  createdAt: string;
  item: string;
  merchant: string;
  merchantOfRecord: string;
  amountUsd: number;
  asset: string;
  chainId: number;
  payTo?: string;
  authorizationNonce?: string;
  signature?: string;
  txHash?: string;
  status: ReceiptStatus;
  checks: Check[];
  prevHash: string;
  hash: string;
};

const KEY = "fba-receipts-v1";
const GENESIS = sha256Text("findbuyagent-receipts-v1");
const BASE_MAINNET = 8453;

export function genesisHash(): string {
  return GENESIS;
}

export function hashReceipt(body: Omit<Receipt, "hash">): string {
  return sha256Text(canon(body));
}

export function loadReceipts(): Receipt[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as Receipt[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row) => row && typeof row.hash === "string" && typeof row.prevHash === "string" && row.status !== ("simulated" as ReceiptStatus));
  } catch {
    return [];
  }
}

export function verifyChain(rows: Receipt[]): { ok: true } | { ok: false; index: number } {
  let prev = GENESIS;
  for (let index = 0; index < rows.length; index += 1) {
    const { hash, ...body } = rows[index];
    if (body.prevHash !== prev || hashReceipt(body) !== hash) return { ok: false, index };
    prev = hash;
  }
  return { ok: true };
}

function write(rows: Receipt[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event("fba-receipts"));
}

function append(body: Omit<Receipt, "prevHash" | "hash">): Receipt {
  const rows = loadReceipts();
  const prevHash = rows.length ? rows[rows.length - 1].hash : GENESIS;
  const nextBody = { ...body, prevHash };
  const receipt = { ...nextBody, hash: hashReceipt(nextBody) };
  write([...rows, receipt]);
  return receipt;
}

export function recordAudit(input: {
  mandate: Mandate;
  offer: SpendOffer;
  status: "blocked" | "declined";
  checks: Check[];
}): Receipt | null {
  if (typeof localStorage === "undefined") return null;
  return append({
    id: crypto.randomUUID(),
    mandateId: input.mandate.id,
    createdAt: new Date().toISOString(),
    item: input.offer.item || input.offer.merchant || "Buy",
    merchant: input.offer.merchant,
    merchantOfRecord: input.offer.merchant,
    amountUsd: input.offer.amountUsd ?? 0,
    asset: input.offer.asset || "USDC",
    chainId: input.offer.chainId,
    payTo: input.offer.payTo,
    status: input.status,
    checks: input.checks,
  });
}

export function recordSettled(input: {
  mandate: Mandate;
  offer: SpendOffer;
  evaluation: Evaluation;
  signature?: string;
  nonce?: string;
  txHash: string;
}): Receipt | null {
  if (input.offer.chainId !== BASE_MAINNET) return null;
  if (!/^0x[a-fA-F0-9]{64}$/.test(input.txHash)) return null;
  if (typeof localStorage === "undefined") return null;
  return append({
    id: crypto.randomUUID(),
    mandateId: input.mandate.id,
    createdAt: new Date().toISOString(),
    item: input.offer.item || input.offer.merchant || "Buy",
    merchant: input.offer.merchant,
    merchantOfRecord: input.offer.merchant,
    amountUsd: input.offer.amountUsd ?? 0,
    asset: input.offer.asset || "USDC",
    chainId: BASE_MAINNET,
    payTo: input.offer.payTo,
    authorizationNonce: input.nonce,
    signature: input.signature,
    txHash: input.txHash,
    status: "settled",
    checks: input.evaluation.checks,
  });
}

export function extractTxHash(...blobs: string[]): string | null {
  for (const blob of blobs) {
    if (!blob) continue;
    const pieces = [blob];
    try {
      pieces.push(atob(blob));
    } catch {
      /* not base64 */
    }
    for (const piece of pieces) {
      const match = piece.match(/0x[a-fA-F0-9]{64}/);
      if (match) return match[0];
    }
  }
  return null;
}

export function clearReceipts() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("fba-receipts"));
}

export function receiptsJson(rows: Receipt[]): string {
  return JSON.stringify(rows, null, 2);
}

export function receiptsCsv(rows: Receipt[]): string {
  const header = ["createdAt", "status", "item", "merchant", "amountUsd", "asset", "chainId", "txHash", "hash"];
  const lines = rows.map((row) => header.map((key) => JSON.stringify(row[key as keyof Receipt] ?? "")).join(","));
  return [header.join(","), ...lines].join("\n");
}

const EXPLORERS: Record<number, string> = {
  8453: "https://basescan.org/tx/",
  1: "https://etherscan.io/tx/",
  137: "https://polygonscan.com/tx/",
  42161: "https://arbiscan.io/tx/",
  10: "https://optimistic.etherscan.io/tx/",
  43114: "https://snowtrace.io/tx/",
  56: "https://bscscan.com/tx/",
};

export function txUrl(chainId: number, hash: string): string | undefined {
  const base = EXPLORERS[chainId];
  return base ? `${base}${hash}` : undefined;
}
