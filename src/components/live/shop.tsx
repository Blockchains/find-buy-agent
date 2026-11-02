import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, HashPill, Sheet } from "@/components/ui/kit";
import { relayPayment } from "@/lib/market/api";
import type { Accept } from "@/lib/market/catalog";
import { ensureChain, paymentBundle, readPublicWallet, readUsdcBalance, type ConnectedWallet } from "@/lib/market/wallet";
import { activeMandate } from "@/lib/mandate";
import { recordSettled } from "@/lib/receipts";
import { INTENT_EXAMPLES, SEEDS, amountUsd, hostOf, isBaseUsdc, rankItems, reviewLive, spentLastDay, type LiveItem } from "@/lib/live/rules";
import { loadSettings, saveSettings, defaultSettings, type Settings } from "@/lib/settings";

type Probe = { status: number; paymentRequired: string; accepts: Accept[]; snippet: string; error?: string };
type Toast = { text: string; fix?: string };

const EMPTY: Probe = { status: 0, paymentRequired: "", accepts: [], snippet: "" };

function money(value: number): string {
  return value >= 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;
}

export function LiveShop() {
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState(0);
  const [items, setItems] = useState<LiveItem[]>(SEEDS);
  const [selected, setSelected] = useState(SEEDS[0].id);
  const [probes, setProbes] = useState<Record<string, Probe>>({});
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [walletName, setWalletName] = useState("wallet");
  const [balance, setBalance] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [signedNote, setSignedNote] = useState("");
  const [payload, setPayload] = useState("");
  const [receipt, setReceipt] = useState<{ hash: string; amount: string; payee: string; host: string; at: string; body: string } | null>(null);
  const [confirm, setConfirm] = useState<"pending" | "confirmed" | "">("");
  const [left, setLeft] = useState(0);
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [developer, setDeveloper] = useState(false);
  const [spent, setSpent] = useState(0);
  const [slow, setSlow] = useState(false);

  const ranked = useMemo(() => rankItems(items, query), [items, query]);
  const current = ranked.find((item) => item.id === selected) ?? ranked[0];
  const probe = current ? probes[current.url] : undefined;
  const accept = probe?.accepts.find(isBaseUsdc);
  const price = accept ? amountUsd(accept.amount) : null;
  const review = current && accept && price !== null ? reviewLive(current, price, accept.payTo, settings, spent) : null;

  useEffect(() => {
    const sync = () => {
      setWallet(readPublicWallet());
      setWalletName(localStorage.getItem("fba-wallet-name") || "wallet");
      setDeveloper(loadSettings().developer);
      setSettingsState(loadSettings());
      setSpent(spentLastDay());
    };
    sync();
    window.addEventListener("fba-wallet", sync);
    window.addEventListener("fba-settings", sync);
    return () => {
      window.removeEventListener("fba-wallet", sync);
      window.removeEventListener("fba-settings", sync);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(min-width: 800px)").matches) document.getElementById("intent")?.focus();
  }, []);

  useEffect(() => {
    if (loadSettings().reducedMotion) return;
    const timer = window.setInterval(() => setHint((value) => (value + 1) % INTENT_EXAMPLES.length), 4000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(SEEDS.map(async (item) => [item.url, await readProbe(item.url)] as const)).then((rows) => {
      if (cancelled) return;
      setProbes(Object.fromEntries(rows));
    });
    const timer = window.setTimeout(() => setSlow(true), 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!wallet) {
      setBalance(null);
      return;
    }
    void readUsdcBalance(wallet.address, "8453").then(setBalance);
  }, [wallet, receipt]);

  useEffect(() => {
    if (!sheet || !accept) return;
    const end = Date.now() + accept.timeoutSeconds * 1000;
    const tick = () => setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [sheet, accept]);

  useEffect(() => {
    if (!receipt) return;
    navigator.vibrate?.(10);
    let stop = false;
    const poll = async () => {
      const response = await fetch("https://mainnet.base.org", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [receipt.hash] }),
      });
      const payload = (await response.json()) as { result?: { status?: string } | null };
      if (stop) return;
      if (payload.result?.status) setConfirm(payload.result.status === "0x1" ? "confirmed" : "pending");
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 4000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [receipt]);

  const priceLabel = price === null ? "" : money(price);
  const blocked = review?.decision === "block";

  async function buy() {
    setToast(null);
    setSignedNote("");
    if (!current || !accept || price === null) {
      setToast({ text: "Unsupported payment terms", fix: "Pick another resource. This one is not exact USDC on Base." });
      return;
    }
    if (!wallet) {
      window.dispatchEvent(new Event("fba-connect"));
      return;
    }
    if (review?.payeeChanged) {
      setToast({ text: "Payee changed", fix: "The live payTo is not the one that was reviewed. Allow it in Settings only if you recognise it." });
      return;
    }
    if (blocked) {
      const reason = review?.reason === "per_buy_cap" || review?.reason === "window_cap" ? "over_cap" : review?.reason === "merchant_not_allowed" || review?.reason === "payee_not_allowed" ? "not_allowlisted" : "over_cap";
      setToast({ text: reason === "not_allowlisted" ? "Not allowlisted" : "Over the cap", fix: reason === "not_allowlisted" ? "Allow this host in Settings." : "Raise cap" });
      return;
    }
    if (left === 0 && sheet) {
      setToast({ text: "Quote expired", fix: "Re-quote" });
      return;
    }
    setSheet(true);
  }

  async function sign() {
    if (!current || !accept || !wallet || price === null) return;
    setPending(true);
    setToast(null);
    try {
      if (!wallet.chainId.endsWith("2105") && wallet.chainId !== "8453" && wallet.chainId !== "0x2105") {
        try {
          await ensureChain("eip155:8453");
        } catch (error) {
          const code = (error as { code?: number }).code;
          if (code === 4001) {
            setToast({ text: "Signature declined", fix: "Try again" });
            return;
          }
          setToast({ text: "Wrong chain", fix: "Switch to Base" });
          return;
        }
      }
      const fresh = await readProbe(current.url);
      setProbes((prev) => ({ ...prev, [current.url]: fresh }));
      const next = fresh.accepts.find(isBaseUsdc);
      if (!next) {
        setToast({ text: "Unsupported payment terms" });
        return;
      }
      if (current.knownPayTo && next.payTo.toLowerCase() !== current.knownPayTo.toLowerCase() && !loadSettings().payees.some((payee) => payee.toLowerCase() === next.payTo.toLowerCase())) {
        setToast({ text: "Payee changed" });
        return;
      }
      const usd = amountUsd(next.amount);
      if (usd === null) {
        setToast({ text: "Unsupported payment terms" });
        return;
      }
      const again = reviewLive(current, usd, next.payTo);
      if (again.decision === "block") {
        setToast({ text: again.reason === "merchant_not_allowed" || again.reason === "payee_not_allowed" ? "Not allowlisted" : "Over the cap", fix: "Raise cap" });
        return;
      }
      const usdc = await readUsdcBalance(wallet.address, "8453");
      if (usdc !== null && Number(usdc) < usd) {
        setToast({ text: `Not enough USDC. Balance ${usdc}.`, fix: "Get USDC" });
        return;
      }
      let echoed: { resource?: unknown; accepted?: unknown; extensions?: unknown } | undefined;
      try {
        const parsed = JSON.parse(fresh.paymentRequired) as { resource?: unknown; accepts?: Record<string, unknown>[]; extensions?: unknown };
        echoed = { resource: parsed.resource, accepted: parsed.accepts?.find((item) => String(item.asset).toLowerCase() === next.asset.toLowerCase()) ?? parsed.accepts?.[0], extensions: parsed.extensions };
      } catch {
        echoed = undefined;
      }
      const signed = await paymentBundle(wallet.address, current.url, current.title, next, echoed);
      setPayload(signed.v2);
      const settled = await relayPayment({ data: { url: current.url, paymentSignature: signed.v2, legacyPayment: "" } });
      let tx = "";
      try {
        const decoded = JSON.parse(atob(settled.paymentResponse)) as { success?: boolean; transaction?: string };
        if (decoded.transaction && /^0x[0-9a-fA-F]{64}$/.test(decoded.transaction)) tx = decoded.transaction;
      } catch {
        tx = "";
      }
      if (!tx) {
        setSignedNote("Signed — settlement not confirmed by merchant");
        setSheet(false);
        return;
      }
      const stored = recordSettled({
        mandate: activeMandate() ?? blankFrom(wallet.address),
        offer: { amountUsd: usd, merchant: hostOf(current.url), payTo: next.payTo, chainId: 8453, asset: "USDC", item: current.title },
        evaluation: again,
        signature: signed.signature,
        nonce: signed.nonce,
        txHash: tx,
      });
      if (!stored) {
        setSignedNote("Signed — settlement not confirmed by merchant");
        return;
      }
      setReceipt({ hash: tx, amount: money(usd), payee: next.payTo, host: hostOf(current.url), at: stored.createdAt, body: settled.snippet });
      setConfirm("pending");
      setSheet(false);
      window.dispatchEvent(new Event("fba-receipts"));
    } catch (error) {
      const code = (error as { code?: number }).code;
      const message = error instanceof Error ? error.message : "The payment did not finish.";
      if (code === 4001 || /reject/i.test(message)) setToast({ text: "Signature declined", fix: "Try again" });
      else if (/chain|switch/i.test(message)) setToast({ text: "Wrong chain", fix: "Switch to Base" });
      else if (/enough|balance|funds/i.test(message)) setToast({ text: message, fix: "Get USDC" });
      else if (/expir/i.test(message)) setToast({ text: "Quote expired", fix: "Re-quote" });
      else if (/settle|facilitator|merchant/i.test(message)) setToast({ text: "Settlement failed", fix: "Try again" });
      else setToast({ text: message || "Merchant error", fix: "Try again" });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section live-shop" aria-labelledby="intent-title">
      <h2 id="intent-title">What should your agent buy?</h2>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (ranked[0]) setSelected(ranked[0].id);
        }}
      >
        <label className="ui-field">
          <span className="sr">Intent</span>
          <input id="intent" value={query} placeholder={INTENT_EXAMPLES[hint]} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </form>
      <div className="catalog-strip">
        {ranked.map((item) => {
          const row = probes[item.url];
          const terms = row?.accepts.find(isBaseUsdc);
          const usd = terms ? amountUsd(terms.amount) : null;
          const on = item.id === current?.id;
          if (!row && !item.discovered) {
            return <div key={item.id} className="skel" aria-hidden="true" />;
          }
          return (
            <button key={item.id} type="button" className={on ? "ui-card pick on" : "ui-card pick"} onClick={() => setSelected(item.id)}>
              <strong>{item.title}</strong>
              <span>
                {usd !== null ? <i className="live-dot" aria-hidden="true" /> : null}
                {row?.error ? row.error : usd === null ? "Reading the live 402…" : `${money(usd)} USDC · Base`}
              </span>
              <Badge status="ask">Unaudited third-party</Badge>
              {item.discovered ? <span className="fine-note">Reported by Coinbase Bazaar{item.payers ? ` · ${item.payers} payers in 30 days` : ""}</span> : null}
            </button>
          );
        })}
      </div>
      {slow && ranked.some((item) => !probes[item.url]) ? <p role="status">Still fetching live prices…</p> : null}
      {current && review && price !== null ? (
        <p className="chip-row" aria-label="Rule checks">
          <Badge status={review.reason === "per_buy_cap" ? "stop" : "go"}>{review.reason === "per_buy_cap" ? "cap ✕" : "cap ✓"}</Badge>
          <Badge status={review.reason === "window_cap" ? "stop" : "go"}>{review.reason === "window_cap" ? "daily ✕" : "daily ✓"}</Badge>
          <Badge status={review.reason === "merchant_not_allowed" || review.reason === "payee_not_allowed" || review.payeeChanged ? "stop" : "go"}>
            {review.payeeChanged ? "payee changed" : "allowlisted ✓"}
          </Badge>
          <Badge status="ask">unaudited ⚠</Badge>
        </p>
      ) : null}
      <div className="buy-bar">
        <Button onClick={() => void buy()} disabled={!accept || price === null}>
          {wallet ? `Buy · ${priceLabel || "…"} USDC` : `Connect wallet to buy${priceLabel ? ` · ${priceLabel}` : ""}`}
        </Button>
        {blocked ? (
          <Link to="/settings">{review?.reason === "merchant_not_allowed" || review?.reason === "payee_not_allowed" ? "Allow this merchant" : "Raise cap"}</Link>
        ) : null}
      </div>
      <div className="cta-row">
        <Button
          variant="secondary"
          onClick={() => {
            void fetch("/api/x402/discover")
              .then((response) => response.json())
              .then(async (body: { items?: { title: string; url: string; payers: number }[]; error?: string }) => {
                if (body.error) setToast({ text: body.error });
                const extra = (body.items ?? [])
                  .filter((item) => !items.some((have) => have.url === item.url))
                  .slice(0, 8)
                  .map((item) => ({ id: item.url, title: item.title, url: item.url, payers: item.payers, discovered: true }));
                setItems((prev) => [...prev, ...extra]);
                const rows = await Promise.all(extra.map(async (item) => [item.url, await readProbe(item.url)] as const));
                setProbes((prev) => ({ ...prev, ...Object.fromEntries(rows.filter((row) => row[1].accepts.some(isBaseUsdc))) }));
              })
              .catch(() => setToast({ text: "The Bazaar did not answer" }));
          }}
        >
          Discover more
        </Button>
        {current?.discovered ? (
          <Button
            variant="ghost"
            onClick={() => {
              const settings = loadSettings();
              const host = hostOf(current.url);
              const payee = accept?.payTo;
              saveSettings({
                ...settings,
                hosts: [...new Set([...settings.hosts, host])],
                payees: payee ? [...new Set([...settings.payees, payee])] : settings.payees,
              });
              setToast({ text: "Allowed. You can buy it after the rules pass." });
            }}
          >
            Allow
          </Button>
        ) : null}
        <Button
          variant="ghost"
          onClick={() => {
            void navigator.clipboard.writeText("https://findbuyagent.com").then(() => setToast({ text: "Link copied." }));
          }}
        >
          Share FindBuyAgent
        </Button>
      </div>
      {signedNote ? <p role="status">{signedNote}</p> : null}
      {toast ? (
        <p className="toast" role="status">
          {toast.text}
          {toast.fix === "Get USDC" ? (
            <>
              {" "}
              <a href="https://www.coinbase.com/how-to-buy/usdc">Get USDC</a>
            </>
          ) : toast.fix === "Raise cap" ? (
            <>
              {" "}
              <Link to="/settings">Raise cap</Link>
            </>
          ) : toast.fix ? (
            ` ${toast.fix}`
          ) : null}
        </p>
      ) : null}
      {receipt ? (
        <article className="ui-card paid stamp">
          <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
            <path className="check-draw" d="M8 18 l7 7 13-14" fill="none" strokeWidth="2.5" />
          </svg>
          <p className="seal">Paid</p>
          <p>
            {receipt.amount} USDC · {receipt.host}
          </p>
          <p>{new Date(receipt.at).toLocaleString()}</p>
          <HashPill value={receipt.payee} href={`https://basescan.org/address/${receipt.payee}`} />
          <p>
            <a href={`https://basescan.org/tx/${receipt.hash}`}>{receipt.hash}</a>
          </p>
          <p>{confirm === "confirmed" ? "Confirmed" : "Pending"}</p>
          <pre>{receipt.body.slice(0, 600)}</pre>
          <Button variant="secondary" onClick={() => void navigator.clipboard.writeText(receipt.body)}>
            Copy
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const blob = new Blob([receipt.body], { type: "application/json" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = "findbuyagent-response.json";
              link.click();
            }}
          >
            Download
          </Button>
        </article>
      ) : null}
      {developer && current ? (
        <details className="section" open>
          <summary>Developer view</summary>
          <pre>{JSON.stringify({ probe: probe ?? EMPTY, payload: payload ? safeDecode(payload) : null }, null, 2)}</pre>
        </details>
      ) : null}
      {sheet && current && accept && price !== null ? (
        <Sheet title="Approve this payment" onClose={() => setSheet(false)}>
          <p className="price-xl">
            {money(price)} USDC <span>{money(price)} USD</span>
          </p>
          <p>Base mainnet · real money</p>
          <p>
            Payee <HashPill value={accept.payTo} href={`https://basescan.org/address/${accept.payTo}`} />
          </p>
          <p>Host {hostOf(current.url)}</p>
          <p>
            <a href={current.url}>{current.url}</a>
          </p>
          <Badge status="ask">Unaudited third-party merchant</Badge>
          <p>Expires in {left}s</p>
          <p>Balance after {balance === null ? "unavailable" : `${Math.max(0, Number(balance) - price).toFixed(4)} USDC`}</p>
          <Button onClick={() => void sign()} disabled={pending || left === 0}>
            {pending ? "Waiting for the wallet…" : `Sign in ${walletName}`}
          </Button>
          <Button variant="ghost" onClick={() => setSheet(false)}>
            Decline
          </Button>
        </Sheet>
      ) : null}
    </section>
  );
}

async function readProbe(url: string): Promise<Probe> {
  const response = await fetch(`/api/x402/probe?url=${encodeURIComponent(url)}`);
  const body = (await response.json()) as Probe & { error?: string };
  if (!response.ok) return { ...EMPTY, error: body.error || `HTTP ${response.status}` };
  return body;
}

function safeDecode(value: string): unknown {
  try {
    return JSON.parse(atob(value));
  } catch {
    return { note: "payload present" };
  }
}

function blankFrom(address: string) {
  return {
    id: "live-rules",
    version: 1 as const,
    name: "Live rules",
    mode: "ask" as const,
    perBuyUsd: loadSettings().perPaymentUsd,
    window: { amountUsd: loadSettings().perDayUsd, period: "day" as const },
    askAboveUsd: 0,
    merchants: { mode: "allowlist" as const, domains: loadSettings().hosts },
    payees: loadSettings().payees,
    chains: [8453],
    assets: ["USDC"],
    categories: { block: [] as string[] },
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    owner: address,
    ap2Type: "open" as const,
  };
}
