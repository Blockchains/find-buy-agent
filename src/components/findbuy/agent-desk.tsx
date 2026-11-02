import { useEffect, useMemo, useState } from "react";
import { listMarket, probeOffer, readBalances, relayPayment } from "@/lib/market/api";
import {
  defaultRules,
  deliveryLine,
  deliveryReady,
  digestOf,
  emptyDelivery,
  loadAgent,
  rankOffers,
  rulesText,
  saveAgent,
  spentToday,
  type Delivery,
  type Fulfillment,
  type Mandate,
  type Rules,
} from "@/lib/market/agent";
import { pickPayable, type Accept, type Offer } from "@/lib/market/catalog";
import { challengeEcho, connectWallet, paymentBundle, signMandate, walletLinks, type ConnectedWallet } from "@/lib/market/wallet";
import { ApprovalSheet } from "@/components/mandate/approval-sheet";
import { activeMandate, type Evaluation } from "@/lib/mandate";
import { extractTxHash, recordSettled } from "@/lib/receipts";
import { SpendBlocked, SpendNeedsApproval, approveSpend, assertPaymentSignatureAllowed, toSpendOffer } from "@/lib/spend";

const CAPS = [5, 20, 50, 100];
const DAYS = [20, 50, 200];
const PROMPTS = ["USDC price", "weather", "flight status"];
type Step = "wallet" | "rules" | "deliver" | "find";

export function AgentDesk({ onReplay, openWallet = false }: { onReplay?: () => void; openWallet?: boolean }) {
  const [ready, setReady] = useState(false);
  const [delivery, setDelivery] = useState<Delivery>(emptyDelivery());
  const [rules, setRules] = useState<Rules>(defaultRules());
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [orders, setOrders] = useState<Fulfillment[]>([]);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [balances, setBalances] = useState<{ baseUsdc: string; monad: string } | null>(null);
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [found, setFound] = useState<ReturnType<typeof rankOffers>>([]);
  const [searching, setSearching] = useState(false);
  const [buying, setBuying] = useState(false);
  const [pending, setPending] = useState<{ offer: Offer; accept: Accept; verdict: Evaluation } | null>(null);
  const [links, setLinks] = useState<{ name: string; href: string }[]>([]);
  const [step, setStep] = useState<Step>("wallet");

  useEffect(() => {
    const stored = loadAgent();
    setDelivery(stored.delivery);
    setRules(stored.rules);
    setMandate(stored.mandate);
    setOrders(stored.orders);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveAgent({ delivery, rules, mandate, orders });
  }, [ready, delivery, rules, mandate, orders]);

  const digest = digestOf(rules, delivery);
  const signed = Boolean(mandate && wallet && mandate.address.toLowerCase() === wallet.address.toLowerCase() && mandate.digest === digest);
  const addressOk = deliveryReady(delivery);
  const spent = spentToday(orders);

  const connect = async () => {
    setNote("");
    try {
      const next = await connectWallet();
      setWallet(next);
      setBalances(await readBalances({ data: { address: next.address } }));
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Wallet did not connect.");
    }
  };

  const sign = async () => {
    if (!wallet) return setNote("Connect the agent wallet first.");
    if (!addressOk) return setNote("Add the delivery address before signing. The agent will not buy without a place to send the order.");
    try {
      const signature = await signMandate(wallet.address, wallet.chainId || "0x2105", digest);
      setMandate({ signature, address: wallet.address, signedAt: new Date().toISOString(), digest });
      setStep("find");
      setNote(rules.auto ? "Signed. The next Find pays the best match inside these rules." : "Signed. The agent will ask before it pays.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "The wallet declined the mandate.");
    }
  };

  const changeRules = (next: Rules) => {
    setRules(next);
    setNote("Rules changed. Sign again before the agent can buy.");
  };

  const pushOrder = (offer: Offer, accept: Accept, status: Fulfillment["status"], detail: string) => {
    const order: Fulfillment = {
      id: `${Date.now()}`,
      at: new Date().toISOString(),
      title: offer.name,
      url: offer.url,
      price: accept.priceLabel,
      payTo: accept.payTo,
      status,
      detail,
      deliverTo: deliveryLine(delivery),
    };
    setOrders((current) => [order, ...current].slice(0, 20));
  };

  const buy = async (offer: Offer, accept: Accept, automatic: boolean) => {
    if (!wallet || !signed) {
      setNote("Sign the agent permissions in the wallet before a purchase.");
      return;
    }
    const price = Number(accept.priceLabel.startsWith("$") ? accept.priceLabel.slice(1) : "");
    if (Number.isFinite(price) && spent + price > rules.dailyUsd) {
      setNote(`Stopped. Today's spend would pass the $${rules.dailyUsd} daily cap.`);
      return;
    }
    if (Number.isFinite(price) && price > rules.maxUsd) {
      setNote(`Stopped. ${accept.priceLabel} is over the $${rules.maxUsd} order cap.`);
      return;
    }
    setBuying(true);
    try {
      const probe = await probeOffer({ data: { url: offer.url } });
      const live = pickPayable(probe.accepts) ?? accept;
      if (probe.status !== 402 && !probe.paymentRequired && probe.accepts.length === 0) {
        pushOrder(offer, accept, "stopped", `Merchant answered ${probe.status}, so nothing was signed.`);
        setNote(`Merchant answered ${probe.status}. Nothing was paid.`);
        return;
      }
      const spend = toSpendOffer(offer, live);
      let verdict: Evaluation;
      try {
        verdict = assertPaymentSignatureAllowed(spend);
      } catch (error) {
        if (error instanceof SpendNeedsApproval) {
          setPending({ offer, accept: live, verdict: error.verdict });
          return;
        }
        if (error instanceof SpendBlocked) {
          pushOrder(offer, live, "stopped", error.message);
          setNote(error.message);
          return;
        }
        throw error;
      }
      const payment = await paymentBundle(wallet.address, offer.url, offer.description, live, challengeEcho(probe.paymentRequired, live));
      const settled = await relayPayment({ data: { url: offer.url, paymentSignature: payment.v2, legacyPayment: payment.v1 } });
      const txHash = extractTxHash(settled.paymentResponse, settled.snippet);
      if (txHash && live.network.endsWith(":8453")) {
        recordSettled({ mandate: activeMandate(), offer: spend, evaluation: verdict, signature: payment.signature, nonce: payment.nonce, txHash });
      }
      const ok = settled.status >= 200 && settled.status < 300;
      pushOrder(
        offer,
        live,
        ok ? "paid" : "unconfirmed",
        ok ? settled.snippet.slice(0, 180) || "Merchant accepted the payment." : `Merchant answered ${settled.status}. ${settled.snippet.slice(0, 180)}`,
      );
      setBalances(await readBalances({ data: { address: wallet.address } }));
      setNote(ok ? `${automatic ? "Agent bought" : "You bought"} ${offer.name}. Deliver to ${deliveryLine(delivery)}.` : "The wallet signed, but the merchant did not confirm delivery.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Payment was not signed.");
    } finally {
      setBuying(false);
    }
  };

  const search = async (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    const q = draft.trim();
    setQuery(q);
    setSearching(true);
    setNote("");
    try {
      const page = await listMarket({ data: { source: "all", offset: 0, limit: 100, query: q } });
      const ranked = rankOffers(page.sources.flatMap((source) => source.offers), rules).slice(0, 12);
      setFound(ranked);
      if (ranked.length === 0) {
        setNote("Nothing in the live registries matched these limits.");
        return;
      }
      if (rules.auto && !signed) {
        setNote("Sign the permissions before auto-buy. Matches are below. Nothing was paid.");
        return;
      }
      if (rules.auto && signed) {
        const accept = ranked.map((row) => row.offer.accepts.find(payable)).find(Boolean);
        const best = ranked.find((row) => row.offer.accepts.some(payable));
        if (!best || !accept) {
          setNote("Matches are not payable from this EVM wallet.");
          return;
        }
        await buy(best.offer, accept, true);
      }
    } catch (error) {
      setNote(error instanceof Error ? error.message : "The registries did not answer.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    setLinks(walletLinks());
    if (openWallet) setStep("wallet");
  }, [openWallet]);

  const summary = useMemo(() => rulesText(rules, delivery), [rules, delivery]);
  const chips = [
    rules.cheaper ? "Cheaper" : "",
    rules.urgent ? "Urgent" : "",
    rules.reputation ? "High reputation" : "",
    `$${rules.maxUsd} max`,
    rules.auto ? "Auto-buy" : "Ask first",
  ].filter(Boolean);

  return (
    <div className="journey">
      {pending ? (
        <ApprovalSheet
          mandate={activeMandate()}
          offer={toSpendOffer(pending.offer, pending.accept)}
          verdict={pending.verdict}
          onApprove={() => {
            const next = pending;
            approveSpend(toSpendOffer(next.offer, next.accept));
            setPending(null);
            void buy(next.offer, next.accept, false);
          }}
          onDecline={() => {
            setPending(null);
            setNote("Declined. Nothing was signed.");
          }}
          onClose={() => setPending(null)}
        />
      ) : null}
      <nav className="rail" aria-label="Find steps">
        {(
          [
            ["wallet", "Wallet"],
            ["rules", "Rules"],
            ["deliver", "Deliver"],
            ["find", "Find"],
          ] as const
        ).map(([id, label], index) => (
          <button key={id} type="button" className={step === id ? "is-on" : done(id, Boolean(wallet), addressOk, signed) ? "is-done" : ""} onClick={() => setStep(id)}>
            <i>{index + 1}</i>
            {label}
          </button>
        ))}
      </nav>

      {step === "wallet" ? (
        <section className="chapter" aria-label="Agent wallet">
          <p className="eyebrow">Agent wallet</p>
          <h2>Find opens in the vault.</h2>
          <p className="lede">This wallet is the only thing that can spend. Nothing is bought until it signs the rules.</p>
          {wallet ? (
            <div className="balance-card">
              <p>
                <span>USDC on Base</span>
                <strong>{balances?.baseUsdc ?? "…"}</strong>
              </p>
              <p>
                <span>MON on Monad</span>
                <strong>{balances?.monad ?? "…"}</strong>
              </p>
              <p className="addr">{short(wallet.address)}</p>
              <a href="https://monaf.ai/" target="_blank" rel="noreferrer">
                Open in monaf
              </a>
            </div>
          ) : (
            <button type="button" className="go" onClick={connect}>
              Connect agent wallet
            </button>
          )}
          {!wallet ? (
            <div className="wallets">
              {links.map((link) => (
                <a key={link.name} href={link.href} target="_blank" rel="noreferrer">
                  {link.name}
                </a>
              ))}
            </div>
          ) : null}
          <div className="dock">
            <button type="button" className="go" onClick={() => setStep("rules")}>
              Set the rules
            </button>
          </div>
        </section>
      ) : null}

      {step === "rules" ? (
        <section className="chapter" aria-label="Find conditions">
          <p className="eyebrow">Rules</p>
          <h2>How it is allowed to choose.</h2>
          <div className="switches">
            <Switch on={rules.cheaper} title="Cheaper than Amazon" detail="Take the lowest price the registries actually return." onClick={() => changeRules({ ...rules, cheaper: !rules.cheaper })} />
            <Switch on={rules.urgent} title="Urgent delivery" detail="Prefer the shortest settlement. Digital goods are instant." onClick={() => changeRules({ ...rules, urgent: !rules.urgent })} />
            <Switch on={rules.reputation} title="High reputation" detail="Prefer listings more paying agents used this month." onClick={() => changeRules({ ...rules, reputation: !rules.reputation })} />
          </div>
          <p className="group-label">Max per order</p>
          <div className="seg">
            {CAPS.map((amount) => (
              <button key={amount} type="button" className={rules.maxUsd === amount ? "is-on" : ""} onClick={() => changeRules({ ...rules, maxUsd: amount })}>
                ${amount}
              </button>
            ))}
          </div>
          <p className="group-label">Daily cap</p>
          <div className="seg seg-3">
            {DAYS.map((amount) => (
              <button key={amount} type="button" className={rules.dailyUsd === amount ? "is-on" : ""} onClick={() => changeRules({ ...rules, dailyUsd: amount })}>
                ${amount}
              </button>
            ))}
          </div>
          <p className="group-label">When it finds a match</p>
          <div className="seg seg-2">
            <button type="button" className={!rules.auto ? "is-on" : ""} onClick={() => changeRules({ ...rules, auto: false })}>
              Ask me
            </button>
            <button type="button" className={rules.auto ? "is-on" : ""} onClick={() => changeRules({ ...rules, auto: true })}>
              Auto-buy
            </button>
          </div>
          <div className="dock">
            <button type="button" className="go" onClick={() => setStep("deliver")}>
              Where to deliver
            </button>
          </div>
        </section>
      ) : null}

      {step === "deliver" ? (
        <section className="chapter" aria-label="Delivery">
          <p className="eyebrow">Deliver to</p>
          <h2>The place every order is sent.</h2>
          <div className="sheet">
            <Field label="Name" value={delivery.name} onChange={(name) => setDelivery({ ...delivery, name })} />
            <Field label="Street" value={delivery.line1} onChange={(line1) => setDelivery({ ...delivery, line1 })} />
            <Field label="Line 2" value={delivery.line2} onChange={(line2) => setDelivery({ ...delivery, line2 })} />
            <div className="pair">
              <Field label="City" value={delivery.city} onChange={(city) => setDelivery({ ...delivery, city })} />
              <Field label="Postcode" value={delivery.postcode} onChange={(postcode) => setDelivery({ ...delivery, postcode })} />
            </div>
            <div className="pair">
              <Field label="Region" value={delivery.region} onChange={(region) => setDelivery({ ...delivery, region })} />
              <Field label="Country" value={delivery.country} onChange={(country) => setDelivery({ ...delivery, country })} />
            </div>
            <Field label="Phone" value={delivery.phone} onChange={(phone) => setDelivery({ ...delivery, phone })} />
            <label className="field">
              <span>Notes</span>
              <textarea value={delivery.notes} placeholder="Leave at reception." onChange={(event) => setDelivery({ ...delivery, notes: event.target.value })} />
            </label>
          </div>
          <p className="fine">{addressOk ? deliveryLine(delivery) : "Name, street, city, postcode, and country are required before a signature."}</p>
          <p className="fine">{summary}</p>
          <div className="dock">
            <button type="button" className="go go-mint" disabled={!wallet || !addressOk || signed} onClick={sign}>
              {signed ? "Permissions signed" : "Sign permissions"}
            </button>
            {signed ? (
              <button type="button" className="go" onClick={() => setStep("find")}>
                Find
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {step === "find" ? (
        <section className="chapter" aria-label="Search">
          <p className="eyebrow">{signed ? (rules.auto ? "Auto-buy armed" : "Asks before it pays") : "Inside your rules"}</p>
          <h2>What should it find?</h2>
          <form className="ask" onSubmit={search}>
            <label className="sr" htmlFor="find-q">
              What should the agent find
            </label>
            <input id="find-q" value={draft} placeholder="A price, a service, a thing" onChange={(event) => setDraft(event.target.value)} />
            <button type="submit" disabled={searching || buying}>
              {searching || buying ? "…" : rules.auto && signed ? "Buy" : "Find"}
            </button>
          </form>
          <div className="pills">
            {chips.map((chip) => (
              <button key={chip} type="button" onClick={() => setStep(chip.startsWith("$") || chip === "Auto-buy" || chip === "Ask first" ? "rules" : "rules")}>
                {chip}
              </button>
            ))}
          </div>
          {!query && found.length === 0 ? (
            <p className="try">
              Try
              {PROMPTS.map((prompt) => (
                <button key={prompt} type="button" onClick={() => setDraft(prompt)}>
                  {prompt}
                </button>
              ))}
            </p>
          ) : null}
          <p className="status">
            {searching ? "Checking the live registries." : query ? `${found.length} inside your rules.` : `$${spent.toFixed(2)} of $${rules.dailyUsd} spent today.`}
          </p>
          {note ? <p className="status is-hot">{note}</p> : null}
          <ul className="results">
            {found.map((row, index) => {
              const accept = row.offer.accepts.find(payable) ?? row.offer.accepts[0];
              return (
                <li key={row.offer.id} className={index === 0 ? "is-best" : ""}>
                  {index === 0 ? <em>Best inside your rules</em> : null}
                  <div className="result-top">
                    <strong>{row.offer.name}</strong>
                    <b>{accept?.priceLabel}</b>
                  </div>
                  <p>{row.offer.description || row.offer.sourceLabel}</p>
                  {row.offer.usage?.call ? <span>{row.offer.usage.call}</span> : null}
                  {row.offer.usage?.inputs ? <span>{row.offer.usage.inputs}</span> : null}
                  <span>{row.reasons.join(" · ") || row.offer.sourceLabel}</span>
                  <button
                    type="button"
                    disabled={buying || !accept?.evm}
                    onClick={() => {
                      if (!signed || !accept) {
                        setStep(wallet ? "deliver" : "wallet");
                        setNote(wallet ? "Sign the delivery and the rules before this can be bought." : "Connect the agent wallet first.");
                        return;
                      }
                      void buy(row.offer, accept, false);
                    }}
                  >
                    {signed ? (index === 0 && rules.auto ? "Best match" : "Buy") : "Sign to buy"}
                  </button>
                </li>
              );
            })}
          </ul>
          <FulfillmentList orders={orders} />
        </section>
      ) : null}

      {note && step !== "find" ? <p className="status is-hot">{note}</p> : null}
      {onReplay ? (
        <button type="button" className="replay" onClick={onReplay}>
          Replay the film
        </button>
      ) : null}
    </div>
  );
}

export function FulfillmentList({ orders }: { orders?: Fulfillment[] }) {
  const [local, setLocal] = useState<Fulfillment[]>([]);
  useEffect(() => {
    if (!orders) setLocal(loadAgent().orders);
  }, [orders]);
  const rows = orders ?? local;
  if (rows.length === 0) return null;
  return (
    <section className="orders-block" aria-label="Fulfillment">
      <p className="eyebrow">Fulfillment</p>
      <h2>Orders placed</h2>
      <ul className="results">
        {rows.map((order) => (
          <li key={order.id}>
            <div className="result-top">
              <strong>{order.title}</strong>
              <b>{order.price}</b>
            </div>
            <p>
              {order.status} · {order.detail}
            </p>
            <span>{order.deliverTo}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Switch({ on, title, detail, onClick }: { on: boolean; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" className={on ? "switch is-on" : "switch"} aria-pressed={on} onClick={onClick}>
      <span>
        <strong>{title}</strong>
        <em>{detail}</em>
      </span>
      <i aria-hidden />
    </button>
  );
}

function done(step: Step, wallet: boolean, addressOk: boolean, signed: boolean) {
  if (step === "find") return false;
  if (signed) return true;
  if (step === "wallet") return wallet;
  if (step === "deliver") return addressOk;
  return false;
}

function payable(accept: Accept): boolean {
  return accept.evm && (accept.scheme === "exact" || accept.scheme === "eip3009");
}

function short(value: string): string {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}
