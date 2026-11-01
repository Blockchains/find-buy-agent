import { useEffect, useState } from "react";
import { listMarket, probeOffer, readBalances, relayPayment } from "@/lib/market/api";
import type { Accept, Offer, SourcePage } from "@/lib/market/catalog";
import { connectWallet, ethereumProvider, signExactPayment, WALLET_LINKS, type ConnectedWallet } from "@/lib/market/wallet";

type PayState = { status: string; detail: string };

export function Market({ seed = "" }: { seed?: string }) {
  const [query, setQuery] = useState(seed);
  const [draft, setDraft] = useState(seed);
  const [pages, setPages] = useState<SourcePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<Offer | null>(null);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [balances, setBalances] = useState<{ baseUsdc: string; monad: string } | null>(null);
  const [pay, setPay] = useState<PayState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!seed) return;
    setDraft(seed);
    setQuery(seed);
  }, [seed]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void listMarket({ data: { source: "all", offset: 0, limit: 24, query } })
      .then((page) => {
        if (cancelled) return;
        setPages(page.sources);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Catalog unavailable");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const more = (source: SourcePage) => {
    void listMarket({ data: { source: source.id, offset: source.offset + source.offers.length, limit: 24, query } }).then((page) => {
      const next = page.sources[0];
      if (!next) return;
      setPages((current) =>
        current.map((item) =>
          item.id === source.id ? { ...next, offers: [...item.offers, ...next.offers], offset: item.offset } : item,
        ),
      );
    });
  };

  const connect = async () => {
    setPay(null);
    try {
      const next = await connectWallet();
      setWallet(next);
      const funds = await readBalances({ data: { address: next.address } });
      setBalances(funds);
    } catch (reason) {
      setPay({ status: "Wallet", detail: reason instanceof Error ? reason.message : "Could not connect" });
    }
  };

  const approve = async (offer: Offer, accept: Accept) => {
    if (!wallet) {
      setPay({ status: "Approve", detail: "Connect the wallet first. Nothing is signed until you do." });
      return;
    }
    setBusy(true);
    setPay({ status: "Checking the merchant", detail: offer.url });
    try {
      const probe = await probeOffer({ data: { url: offer.url } });
      if (probe.status !== 402 && !probe.paymentRequired) {
        setPay({
          status: `Merchant answered ${probe.status}`,
          detail: probe.snippet.slice(0, 280) || "No 402 payment terms came back. The listing may be stale.",
        });
        return;
      }
      setPay({ status: "Sign in your wallet", detail: `${accept.priceLabel} to ${short(accept.payTo)} on ${accept.networkLabel}` });
      const paymentSignature = await signExactPayment(wallet.address, offer.url, offer.description, accept);
      setPay({ status: "Settling", detail: "The signed authorization is going back to the merchant. Your key never left the wallet." });
      const settled = await relayPayment({ data: { url: offer.url, paymentSignature } });
      setPay({
        status: settled.status >= 200 && settled.status < 300 ? "Paid" : `Merchant answered ${settled.status}`,
        detail: settled.snippet.slice(0, 360) || "No body.",
      });
      const funds = await readBalances({ data: { address: wallet.address } });
      setBalances(funds);
    } catch (reason) {
      setPay({ status: "Not paid", detail: reason instanceof Error ? reason.message : "The wallet rejected the signature." });
    } finally {
      setBusy(false);
    }
  };

  const total = pages.reduce((sum, page) => sum + (page.total ?? page.offers.length), 0);
  const shown = pages.reduce((sum, page) => sum + page.offers.length, 0);

  return (
    <section className="market" aria-label="Live x402 market">
      <div className="market-head">
        <div>
          <p className="kicker">Live registries</p>
          <h2>Every listed x402 merchant</h2>
          <p className="quiet">
            Coinbase Bazaar, Circle, and Binance B402, read live. Stablecoin and x402 resources only. Nothing here is a sample product.
          </p>
        </div>
        <WalletChip wallet={wallet} balances={balances} onConnect={connect} injected={Boolean(ethereumProvider())} />
      </div>
      <form
        className="market-search"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(draft.trim());
        }}
      >
        <label className="sr" htmlFor="market-q">
          Search merchants and resources
        </label>
        <input
          id="market-q"
          value={draft}
          placeholder="Search the live catalogs"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <p className="market-count">
        {loading ? "Reading the registries…" : `${shown.toLocaleString("en-US")} showing · ${total.toLocaleString("en-US")} listed`}
        {query ? ` · “${query}”` : ""}
      </p>
      {error ? <p className="link-error">{error}</p> : null}
      <div className="market-cols">
        {pages.map((page) => (
          <SourceColumn key={page.id} page={page} onMore={() => more(page)} onPick={setPicked} pickedId={picked?.id ?? ""} />
        ))}
      </div>
      {picked ? (
        <article className="offer-sheet">
          <p className="kicker">{picked.sourceLabel}</p>
          <h3>{picked.name}</h3>
          <p>{picked.description || "No description filed with the registry."}</p>
          <p className="offer-url">
            <a href={picked.url} target="_blank" rel="noreferrer">
              {picked.url}
            </a>
          </p>
          <ul className="accepts">
            {picked.accepts.map((accept) => (
              <li key={`${accept.network}:${accept.asset}`}>
                <span>
                  <strong>{accept.priceLabel}</strong>
                  <em>
                    {accept.networkLabel} · {accept.assetName || "token"} · {short(accept.payTo)}
                  </em>
                </span>
                <button type="button" disabled={busy || !accept.evm} onClick={() => approve(picked, accept)}>
                  {accept.evm ? "Approve & pay" : "Solana listing"}
                </button>
              </li>
            ))}
          </ul>
          {pay ? (
            <p className="pay-note">
              <strong>{pay.status}.</strong> {pay.detail}
            </p>
          ) : (
            <p className="quiet">Ask first. The wallet signs the exact amount on the listing. Decline by doing nothing.</p>
          )}
        </article>
      ) : null}
    </section>
  );
}

function SourceColumn({
  page,
  onMore,
  onPick,
  pickedId,
}: {
  page: SourcePage;
  onMore: () => void;
  onPick: (offer: Offer) => void;
  pickedId: string;
}) {
  const moreLeft = page.total !== null && page.offers.length < page.total && !page.error;
  return (
    <section aria-label={page.label}>
      <header>
        <h3>{page.label}</h3>
        <span>{page.total === null ? page.offers.length : page.total.toLocaleString("en-US")}</span>
      </header>
      {page.error ? <p className="link-error">{page.error}</p> : null}
      <ul>
        {page.offers.map((offer) => (
          <li key={offer.id}>
            <button type="button" className={offer.id === pickedId ? "is-on" : ""} onClick={() => onPick(offer)}>
              <strong>{offer.name}</strong>
              <em>{offer.accepts[0]?.priceLabel}</em>
              <span>{offer.accepts.map((accept) => accept.networkLabel).filter(unique).slice(0, 3).join(" · ")}</span>
            </button>
          </li>
        ))}
      </ul>
      {moreLeft ? (
        <button type="button" className="more" onClick={onMore}>
          More from {page.label}
        </button>
      ) : null}
    </section>
  );
}

function WalletChip({
  wallet,
  balances,
  onConnect,
  injected,
}: {
  wallet: ConnectedWallet | null;
  balances: { baseUsdc: string; monad: string } | null;
  onConnect: () => void;
  injected: boolean;
}) {
  if (!wallet) {
    return (
      <div className="wallet-chip">
        {injected ? (
          <button type="button" onClick={onConnect}>
            Connect wallet
          </button>
        ) : (
          <p>Open this page in a wallet. Same pattern as monaf: the wallet holds the key.</p>
        )}
        <div className="wallet-links">
          {WALLET_LINKS.map((link) => (
            <a key={link.name} href={link.href} target="_blank" rel="noreferrer">
              {link.name}
            </a>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="wallet-chip is-on">
      <p>
        <strong>{short(wallet.address)}</strong>
        <span>{balances ? `${balances.baseUsdc} USDC on Base · ${balances.monad} MON` : "Reading balances…"}</span>
      </p>
      <a href="https://monaf.ai/" target="_blank" rel="noreferrer">
        Open monaf
      </a>
    </div>
  );
}

function short(value: string): string {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

function unique(value: string, index: number, list: string[]): boolean {
  return list.indexOf(value) === index;
}
