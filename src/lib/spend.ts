import type { Accept, Offer } from "@/lib/market/catalog";
import { activeMandate, evaluate, ruleLabel, spentInWindow, type Evaluation, type Mandate, type SpendOffer } from "@/lib/mandate";
import { loadReceipts, recordAudit } from "@/lib/receipts";

export class SpendNeedsApproval extends Error {
  verdict: Evaluation;
  constructor(verdict: Evaluation) {
    super("This buy waits for you. Nothing was signed.");
    this.name = "SpendNeedsApproval";
    this.verdict = verdict;
  }
}

export class SpendBlocked extends Error {
  verdict: Evaluation;
  constructor(verdict: Evaluation) {
    super(`Blocked by ${ruleLabel(verdict.reason)}. Nothing was signed.`);
    this.name = "SpendBlocked";
    this.verdict = verdict;
  }
}

const approved = new Set<string>();
let signatureRequests = 0;
const recentBlocks = new Map<string, number>();

export function signatureRequestCount(): number {
  return signatureRequests;
}

export function noteSignatureRequest() {
  signatureRequests += 1;
}

export function spendKey(offer: SpendOffer): string {
  return [offer.merchant, (offer.payTo || "").toLowerCase(), offer.chainId, offer.asset.toUpperCase(), offer.amountUsd ?? "?", offer.item ?? ""].join("|");
}

export function approveSpend(offer: SpendOffer) {
  approved.add(spendKey(offer));
}

export function isSpendApproved(offer: SpendOffer): boolean {
  return approved.has(spendKey(offer));
}

export function toSpendOffer(offer: Offer, accept: Accept): SpendOffer {
  let merchant = "";
  try {
    merchant = new URL(offer.url).hostname.replace(/^www\./, "");
  } catch {
    merchant = "";
  }
  const priced = accept.priceLabel.startsWith("$") ? Number(accept.priceLabel.slice(1)) : Number.NaN;
  const chainId = Number(accept.network.split(":")[1]);
  const asset = /usdc/i.test(`${accept.assetName} ${accept.asset}`) ? "USDC" : accept.assetName || accept.asset;
  return {
    amountUsd: Number.isFinite(priced) ? priced : null,
    merchant,
    payTo: accept.payTo,
    chainId: Number.isFinite(chainId) ? chainId : 0,
    asset,
    category: `${offer.name} ${offer.description} ${offer.tags.join(" ")}`,
    item: offer.name,
  };
}

export function reviewSpend(mandate: Mandate, offer: SpendOffer, spent: number, isApproved: boolean): { verdict: Evaluation; sign: boolean } {
  const verdict = evaluate(mandate, offer, spent);
  if (mandate.mode === "suggest" || mandate.revokedAt || verdict.decision === "block") return { verdict, sign: false };
  if (verdict.decision === "ask") return { verdict, sign: isApproved };
  return { verdict, sign: true };
}

/** Pure stand-in for the wallet call. Suggest and block never increment the counter. */
export function attemptSign(mandate: Mandate, offer: SpendOffer, spent: number, isApproved: boolean): "signed" | "refused" {
  const review = reviewSpend(mandate, offer, spent, isApproved);
  if (!review.sign) return "refused";
  noteSignatureRequest();
  return "signed";
}

export function assertPaymentSignatureAllowed(offer: SpendOffer): Evaluation {
  const mandate = activeMandate();
  const review = reviewSpend(mandate, offer, spentInWindow(mandate, loadReceipts()), approved.has(spendKey(offer)));
  if (!review.sign) {
    if (review.verdict.decision !== "ask") {
      const key = `${spendKey(offer)}:${review.verdict.reason}`;
      const now = Date.now();
      if ((recentBlocks.get(key) ?? 0) < now - 2000) {
        recentBlocks.set(key, now);
        recordAudit({ mandate, offer, status: "blocked", checks: review.verdict.checks });
      }
      throw new SpendBlocked(review.verdict);
    }
    throw new SpendNeedsApproval(review.verdict);
  }
  return review.verdict;
}
