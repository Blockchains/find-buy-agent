import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAddress, isAddress } from "viem";
import { Badge, Button, CodeBlock, Field } from "@/components/ui/kit";
import { WaitlistForm } from "@/components/pages/waitlist-form";
import { listMarket, probeOffer } from "@/lib/market/api";
import type { Accept, Offer } from "@/lib/market/catalog";

const HANDLER = `app.get("/resource", async (c) => {
  const paid = c.req.header("payment-signature");
  if (!paid) {
    return c.json({
      x402Version: 2,
      accepts: [{
        scheme: "exact",
        network: "eip155:8453",
        asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        amount: "10000",
        payTo: "<your Base address>",
        maxTimeoutSeconds: 60,
        extra: { name: "USD Coin", version: "2" }
      }]
    }, 402);
  }
  // Hand the header to a facilitator. Return 200 only after it settles.
  return c.json({ ok: true });
});`;

const FEED = `{
  "id": "sku-1",
  "title": "Resource name",
  "price": "0.01",
  "currency": "USD",
  "availability": "in_stock",
  "url": "https://shop.invalid/resource",
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:8453",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "payTo": "<your Base address>"
  }]
}`;

function payeeOk(value: string): boolean {
  if (!isAddress(value)) return false;
  if (value === value.toLowerCase()) return true;
  try {
    return value === getAddress(value);
  } catch {
    return false;
  }
}

function marks(accept: Accept) {
  let amount = false;
  try {
    amount = /^\d+$/.test(accept.amount) && BigInt(accept.amount) > 0n;
  } catch {
    amount = false;
  }
  return [
    { name: "amount", ok: amount },
    { name: "network", ok: /^eip155:\d+$/.test(accept.network) },
    { name: "asset", ok: isAddress(accept.asset) },
    { name: "payTo", ok: payeeOk(accept.payTo) },
  ];
}

export function MerchantsPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [probe, setProbe] = useState<{ status: number; accepts: Accept[] } | null>(null);
  const [probeError, setProbeError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listMarket({ data: { source: "coinbase", offset: 0, limit: 24 } })
      .then((page) => {
        if (cancelled) return;
        const source = page.sources.find((item) => item.id === "coinbase");
        setOffers(source?.offers ?? []);
        setError(source?.error ?? "");
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "The Bazaar did not answer.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <article className="wrap section">
      <h1>Let agents buy from you with x402, and keep your checkout.</h1>
      <p>Three ways to be payable. The list under them is the live Coinbase CDP Bazaar discovery response. Nothing on this page pays.</p>
      <section>
        <h2>1. x402 endpoint</h2>
        <p>Return 402 with an accepts object on Base mainnet (eip155:8453). Replace payTo with your address. A facilitator checks the signature and settles. This handler never spends.</p>
        <CodeBlock text={HANDLER} />
      </section>
      <section>
        <h2>2. ACP checkout sessions</h2>
        <ul>
          <li>POST /checkout_sessions</li>
          <li>Update the session</li>
          <li>POST /checkout_sessions/{"{id}"}/complete</li>
          <li>POST /checkout_sessions/{"{id}"}/cancel</li>
          <li>Order webhooks</li>
          <li>A delegated payment token with a max amount and an expiry</li>
        </ul>
        <p>The merchant stays merchant of record. See the <Link to="/protocols">ACP tab</Link>.</p>
      </section>
      <section>
        <h2>3. Product feed</h2>
        <p>Proposed format, not a standard: publish findbuyagent.json at /.well-known/findbuyagent.json.</p>
        <CodeBlock text={FEED} />
      </section>
      <section>
        <h2>402 self-test</h2>
        <p>This reads the URL and shows the 402. It does not sign and it does not pay.</p>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            setBusy(true);
            setProbe(null);
            setProbeError("");
            void probeOffer({ data: { url } })
              .then((result) => setProbe({ status: result.status, accepts: result.accepts }))
              .catch((reason: unknown) => setProbeError(reason instanceof Error ? reason.message : "The URL could not be read."))
              .finally(() => setBusy(false));
          }}
        >
          <Field label="Resource URL">
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" inputMode="url" required />
          </Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Reading…" : "Read 402"}
          </Button>
        </form>
        {probeError ? <p role="alert">{probeError}</p> : null}
        {probe ? (
          <div role="status">
            <p>Status {probe.status}</p>
            {probe.accepts.length === 0 ? <p>No accepts were parsed.</p> : null}
            {probe.accepts.map((accept) => (
              <article key={`${accept.network}:${accept.asset}:${accept.payTo}`} className="ui-card">
                <p>
                  {accept.networkLabel} · {accept.assetName || accept.asset} · {accept.priceLabel}
                </p>
                <ul className="check-list">
                  {marks(accept).map((mark) => (
                    <li key={mark.name}>
                      <Badge status={mark.ok ? "go" : "stop"}>{mark.ok ? "✓" : "✕"}</Badge> {mark.name}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : null}
      </section>
      <section>
        <h2>CDP Bazaar</h2>
        {error ? <p role="status">{error}</p> : null}
        {offers.length === 0 && !error ? (
          <div className="card-list" aria-hidden="true">
            <div className="skel" />
            <div className="skel" />
            <div className="skel" />
            <div className="skel" />
          </div>
        ) : null}
        <div className="card-list">
          {offers.map((offer) => {
            const accept = offer.accepts[0];
            return (
              <article key={offer.id} className="ui-card">
                <h3>{offer.name}</h3>
                <p>{offer.description}</p>
                <p>
                  {accept ? `${accept.priceLabel} · ${accept.networkLabel} · ${accept.assetName || "token"}` : "No parsed price"}
                </p>
                <p>
                  <a href={offer.url}>{offer.url.replace(/^https:\/\//, "")}</a>
                </p>
              </article>
            );
          })}
        </div>
      </section>
      <section>
        <h2>Merchant of record</h2>
        <p>
          Taking a payment does not decide who owes the refund. <Link to="/blog/$slug" params={{ slug: "merchant-of-record" }}>The merchant-of-record essay</Link> is the longer version.
        </p>
      </section>
      <section>
        <h2>Join the merchant list</h2>
        <WaitlistForm />
      </section>
    </article>
  );
}
