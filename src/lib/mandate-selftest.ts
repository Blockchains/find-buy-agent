import { blankMandate, evaluate, type Mandate, type SpendOffer } from "@/lib/mandate";
import { genesisHash, hashReceipt, verifyChain, type Receipt } from "@/lib/receipts";
import { attemptSign, signatureRequestCount } from "@/lib/spend";

export type SelfCheck = { name: string; pass: boolean; detail: string };

const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const past = new Date(Date.now() - 60_000).toISOString();

function mandate(partial: Partial<Mandate> = {}): Mandate {
  return blankMandate({
    id: "selftest",
    mode: "auto",
    perBuyUsd: 50,
    window: { amountUsd: 200, period: "week" },
    askAboveUsd: 25,
    merchants: { mode: "allowlist", domains: ["amazon.com", "bestbuy.com"] },
    chains: [8453],
    assets: ["USDC"],
    categories: { block: ["gift cards"] },
    expiresAt: future,
    ...partial,
  });
}

const offer: SpendOffer = {
  amountUsd: 10,
  merchant: "amazon.com",
  payTo: "0x0000000000000000000000000000000000000001",
  chainId: 8453,
  asset: "USDC",
  category: "books",
  item: "Notebook",
};

function row(name: string, pass: boolean, detail: string): SelfCheck {
  return { name, pass, detail };
}

function receipt(prevHash: string, amount: number, id: string): Receipt {
  const body = {
    id,
    mandateId: "selftest",
    createdAt: "2026-11-02T00:00:00.000Z",
    item: "Notebook",
    merchant: "amazon.com",
    merchantOfRecord: "amazon.com",
    amountUsd: amount,
    asset: "USDC",
    chainId: 8453,
    txHash: `0x${"ab".repeat(32)}`,
    status: "settled" as const,
    checks: [],
    prevHash,
  };
  return { ...body, hash: hashReceipt(body) };
}

export function runMandateSelfTest(): SelfCheck[] {
  const open = mandate();
  const pay = evaluate(open, offer, 0);
  const ask = evaluate(open, { ...offer, amountUsd: 30 }, 0);
  const cap = evaluate(open, { ...offer, amountUsd: 60 }, 0);
  const windowCap = evaluate(open, { ...offer, amountUsd: 20 }, 190);
  const merchant = evaluate(open, { ...offer, merchant: "ebay.com" }, 0);
  const payee = evaluate(mandate({ payees: ["0x0000000000000000000000000000000000000002"] }), offer, 0);
  const chain = evaluate(open, { ...offer, chainId: 137 }, 0);
  const asset = evaluate(open, { ...offer, asset: "DAI" }, 0);
  const category = evaluate(open, { ...offer, category: "gift cards for a friend" }, 0);
  const expired = evaluate(mandate({ expiresAt: past }), offer, 0);
  const suggest = mandate({ mode: "suggest" });
  const suggestVerdict = evaluate(suggest, offer, 0);
  const before = signatureRequestCount();
  const suggestSign = attemptSign(suggest, offer, 0, true);
  const blockedSign = attemptSign(open, { ...offer, amountUsd: 80 }, 0, true);
  const always = evaluate(mandate({ mode: "ask" }), offer, 0);
  const revoked = evaluate(mandate({ revokedAt: new Date().toISOString() }), offer, 0);
  const left = receipt(genesisHash(), 10, "a");
  const right = receipt(left.hash, 12, "b");
  const intact = verifyChain([left, right]);
  const tampered = verifyChain([left, { ...right, amountUsd: 99 }]);
  return [
    row("Inside the caps, auto pays", pay.decision === "pay", pay.decision),
    row("Above the ask-first line waits", ask.decision === "ask" && ask.reason === "per_buy_cap", ask.reason),
    row("Over the per-buy cap blocks", cap.decision === "block" && cap.reason === "per_buy_cap", cap.reason),
    row("Over the window cap blocks", windowCap.decision === "block" && windowCap.reason === "window_cap", windowCap.reason),
    row("Merchant off the list blocks", merchant.decision === "block" && merchant.reason === "merchant_not_allowed", merchant.reason),
    row("Payee off the list blocks", payee.decision === "block" && payee.reason === "payee_not_allowed", payee.reason),
    row("Chain off the list blocks", chain.decision === "block" && chain.reason === "chain_not_allowed", chain.reason),
    row("Asset off the list blocks", asset.decision === "block" && asset.reason === "asset_not_allowed", asset.reason),
    row("Blocked category blocks", category.decision === "block" && category.reason === "category_blocked", category.reason),
    row("Expired mandate blocks", expired.decision === "block" && expired.reason === "expired", expired.reason),
    row(
      "Suggest only never calls a signing method",
      suggestVerdict.decision === "block" &&
        suggestVerdict.reason === "suggest_only" &&
        suggestSign === "refused" &&
        blockedSign === "refused" &&
        signatureRequestCount() === before,
      `${suggestVerdict.reason}; counter ${signatureRequestCount() - before}`,
    ),
    row("Ask every time waits even inside the caps", always.decision === "ask" && always.reason === "ask_every_time", always.reason),
    row("A revoked mandate blocks", revoked.decision === "block" && revoked.reason === "revoked", revoked.reason),
    row(
      "Hash chain verifies, then shows tampering",
      intact.ok === true && tampered.ok === false,
      intact.ok ? "intact, then tampered" : "chain did not verify",
    ),
  ];
}
