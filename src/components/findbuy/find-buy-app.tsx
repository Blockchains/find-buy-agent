import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AgentDesk, FulfillmentList } from "./agent-desk";
import { Board } from "./board";
import { labelFromPhoto, money, normalizeLink, type Offer as Card, type Phone, type Tab } from "./model";
import { Orders, Vault } from "./panels";
import { PhoneStage } from "./phone";
import { AppHeader } from "./shell";
import { useDemo } from "./use-desk";
import { listMarket, probeOffer, relayPayment } from "@/lib/market/api";
import { COUNTRIES, deliveryLine, digestOf, loadAgent, rankOffers, saveAgent, spentToday, type Fulfillment } from "@/lib/market/agent";
import { pickPayable, payableAccepts, type Accept, type Offer } from "@/lib/market/catalog";
import { challengeEcho, connectWallet, paymentBundle, signMandate, walletLinks } from "@/lib/market/wallet";
import { ApprovalSheet } from "@/components/mandate/approval-sheet";
import { activeMandate } from "@/lib/mandate";
import { extractTxHash, recordSettled } from "@/lib/receipts";
import { SpendBlocked, SpendNeedsApproval, approveSpend, assertPaymentSignatureAllowed, toSpendOffer } from "@/lib/spend";
import type { Evaluation } from "@/lib/mandate";

type Deal = { offer: Offer; accept: Accept; challenged: boolean };

export function FindBuyApp({ initialTab = "shop", embedded = false }: { initialTab?: Tab; embedded?: boolean }) {
  const desk = useDemo(initialTab);
  const navigate = useNavigate();
  const { state } = desk;
  const deal = useRef<Deal | null>(null);
  const shelf = useRef<Offer[]>([]);
  const listed = useRef(false);
  const [busy, setBusy] = useState(false);
  const [country, setCountry] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [payNet, setPayNet] = useState("All");
  const [pending, setPending] = useState<{ offer: Offer; accept: Accept; verdict: Evaluation } | null>(null);

  useEffect(() => {
    setCountry(loadAgent().delivery.country);
  }, []);

  useEffect(() => {
    if (listed.current || busy || !state.booted || state.phase === "cinema") return;
    if (state.phone.view !== "blank" && state.phone.view !== "held") return;
    listed.current = true;
    void loadShelf();
  }, [state.booted, state.phase, state.phone.view, busy]);
  const line = state.typing ? state.typed : state.command;
  const showSkip = state.run === "film" && state.phase === "cinema";
  const live =
    state.phone.view === "ask"
      ? `Approval needed. ${state.phone.title} ${state.phone.priceLine}`
      : state.booted
        ? state.pill
        : "Ready";

  const choose = (tab: Tab) => {
    desk.setTab(tab);
    void navigate({
      to: "/",
      search: tab === "shop" ? {} : { tab },
      replace: true,
    });
  };

  const sheet = (offer: Offer, accept: Accept, sub: string): Extract<Phone, { view: "ask" }> => ({
    view: "ask",
    kicker: "Live · x402",
    title: offer.name,
    priceLine: accept.priceLabel,
    sub,
    rows: [
      { k: "Registry", v: offer.sourceLabel },
      { k: "Network", v: accept.networkLabel },
      { k: "Pays", v: short(accept.payTo) },
      { k: "Window", v: accept.timeoutSeconds > 0 && accept.timeoutSeconds < 3600 ? `${accept.timeoutSeconds}s` : "open" },
      { k: "Deliver", v: loadAgent().delivery.country || "Choose a country" },
    ],
    pending: {
      tag: "custom",
      question: offer.name,
      sub,
      title: offer.name,
      store: offer.sourceLabel,
      price: Math.round((Number(accept.priceLabel.replace(/[^0-9.]/g, "")) || 0) * 100),
      note: offer.url,
      mode: "paid",
      when: "now",
    },
  });

  const chooseCountry = (next: string) => {
    setCountry(next);
    const stored = loadAgent();
    const delivery = { ...stored.delivery, country: next };
    const digest = digestOf({ ...stored.rules, auto: true }, delivery);
    const mandate = stored.mandate && stored.mandate.digest === digest ? stored.mandate : null;
    saveAgent({ ...stored, delivery, rules: { ...stored.rules, auto: true }, mandate });
  };

  const publishList = (offers: Offer[], note: string) => {
    shelf.current = offers;
    desk.focus({
      phase: "live",
      run: "side",
      pill: "shopping",
      pillTone: "fill",
      checked: offers.length,
      goal: Math.max(offers.length, 1),
      phone: {
        view: "picks",
        kicker: "Shop",
        title: "Find",
        sub: note,
        items: offers.filter((offer) => payableAccepts(offer.accepts).length > 0).map((offer) => {
          const payable = payableAccepts(offer.accepts);
          const accept = pickPayable(payable) ?? payable[0];
          const networks = [...new Set(payable.map((item) => item.networkLabel))];
          return {
            id: offer.id,
            name: offer.name,
            meta: `${networks.slice(0, 3).join(" · ")} · ${offer.sourceLabel}`,
            price: accept?.priceLabel ?? "",
            rating: "x402",
            detail: offer.description,
            how: offer.usage.call,
            inputs: offer.usage.inputs,
            returns: offer.usage.returns,
            docs: offer.usage.docs,
          };
        }),
      },
    });
  };

  const loadShelf = async (query = "") => {
    const empty: Extract<Phone, { view: "picks" }> = {
      view: "picks",
      kicker: "Shop",
      title: "Find",
      sub: query ? `Searching “${query}”.` : "Loading every network.",
      items: [],
    };
    desk.focus({ phase: "live", run: "side", pill: "searching", pillTone: "line", phone: empty });
    try {
      const offsets = query ? [0] : Array.from({ length: 60 }, (_, index) => index * 100);
      const seen = new Set<string>();
      const offers: Offer[] = [];
      for (let start = 0; start < offsets.length; start += 6) {
        const batch = offsets.slice(start, start + 6);
        const pages = await Promise.all(batch.map((offset) => listMarket({ data: { source: "all", offset, limit: 100, query } })));
        let added = 0;
        for (const page of pages) {
          for (const source of page.sources) {
            for (const offer of source.offers) {
              if (seen.has(offer.url) || offer.accepts.length === 0) continue;
              seen.add(offer.url);
              offers.push(offer);
              added += 1;
            }
          }
        }
        const ranked = offers
          .filter((offer) => payableAccepts(offer.accepts).length > 0)
          .sort((a, b) => a.name.localeCompare(b.name));
        const beyond = ranked.filter((offer) => payableAccepts(offer.accepts).some((accept) => accept.network !== "eip155:8453")).length;
        publishList(
          ranked,
          ranked.length
            ? `${ranked.length} products · ${beyond} also on Polygon, Arbitrum, Ethereum, Optimism, BNB, or Avalanche${start + 6 < offsets.length ? " · still loading" : ""}`
            : "Nothing matched.",
        );
        if (!query && added === 0) break;
      }
    } catch (error) {
      desk.focus({
        pill: "held",
        pillTone: "ghost",
        phone: { view: "picks", kicker: "Shop", title: "Find", sub: error instanceof Error ? error.message : "The registries did not answer.", items: [] },
      });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 720px)").matches) return;
    if (listed.current) return;
    listed.current = true;
    desk.focus({
      phase: "live",
      run: "side",
      command: "shop",
      typed: "shop",
      pill: "shopping",
      pillTone: "fill",
      phone: { view: "note", kicker: "Shop", title: "Choose one.", sub: "Loading what you can buy with crypto.", rows: [] },
    });
    void loadShelf();
  }, [desk]);

  const buyOffer = async (offer: Offer, accept: Accept) => {
    if (busy) return;
    const stored = loadAgent();
    stored.rules = { ...stored.rules, auto: true };
    if (!stored.delivery.country) {
      if (state.phone.view === "picks") {
        desk.focus({ pill: "needs you", pillTone: "fill", phone: { ...state.phone, sub: "Choose a country, then buy." } });
      }
      document.getElementById("deliver-country")?.focus();
      return;
    }
    deal.current = { offer, accept, challenged: true };
    setBusy(true);
    try {
      const probe = await probeOffer({ data: { url: offer.url } });
      const live = pickPayable(probe.accepts.length ? probe.accepts : offer.accepts, payNet) ?? (payNet === "All" ? pickPayable(offer.accepts) : null);
      if (!live) {
        deal.current = null;
        publishList(shelf.current, `${offer.name}. Not on a chain this wallet can settle. Nothing was signed.`);
        return;
      }
      if (probe.status !== 402 && !probe.paymentRequired && probe.accepts.length === 0) {
        deal.current = null;
        desk.focus({
          pill: "held",
          pillTone: "ghost",
          phone: { view: "note", kicker: "Not for sale", title: offer.name, sub: `Merchant answered ${probe.status}. Nothing was signed.`, rows: [] },
        });
        return;
      }
      const price = usd(live.priceLabel);
      if (price !== null && price > stored.rules.maxUsd) {
        desk.focus({ phase: "ask", pill: "needs you", pillTone: "fill", phone: sheet(offer, live, `${live.priceLabel} is over the $${stored.rules.maxUsd} cap. Nothing was signed.`) });
        return;
      }
      if (price !== null && spentToday(stored.orders) + price > stored.rules.dailyUsd) {
        desk.focus({ phase: "ask", pill: "needs you", pillTone: "fill", phone: sheet(offer, live, `This would pass the $${stored.rules.dailyUsd} daily cap. Nothing was signed.`) });
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
          desk.focus({
            phase: "ask",
            pill: "needs you",
            pillTone: "fill",
            phone: sheet(offer, live, error.message),
          });
          return;
        }
        throw error;
      }
      desk.focus({
        pill: "paying",
        pillTone: "line",
        phone: { view: "note", kicker: "Wallet", title: "Connect once.", sub: `Then the agent is signed to spend, delivered to ${stored.delivery.country}.`, rows: [] },
      });
      const wallet = await connectWallet();
      const digest = digestOf(stored.rules, stored.delivery);
      const already = stored.mandate && stored.mandate.address.toLowerCase() === wallet.address.toLowerCase() && stored.mandate.digest === digest;
      if (!already) {
        desk.focus({
          pill: "paying",
          pillTone: "line",
          phone: {
            view: "note",
            kicker: "Agent",
            title: "Sign to spend.",
            sub: `Up to $${stored.rules.maxUsd} an order. Deliver to ${stored.delivery.country}.`,
            rows: [{ k: "Wallet", v: short(wallet.address) }],
          },
        });
        const signature = await signMandate(wallet.address, wallet.chainId || "0x2105", digest);
        stored.mandate = { signature, address: wallet.address, signedAt: new Date().toISOString(), digest };
        saveAgent(stored);
      }
      desk.focus({
        pill: "paying",
        pillTone: "line",
        phone: { view: "note", kicker: "Pay", title: live.priceLabel, sub: `Sign the USDC spend on ${live.networkLabel}.`, rows: [{ k: "Deliver", v: stored.delivery.country }] },
      });
      const signed = await paymentBundle(wallet.address, offer.url, offer.description, live, challengeEcho(probe.paymentRequired, live));
      const settled = await relayPayment({ data: { url: offer.url, paymentSignature: signed.v2, legacyPayment: signed.v1 } });
      const txHash = extractTxHash(settled.paymentResponse, settled.snippet);
      if (txHash && live.network.endsWith(":8453")) {
        recordSettled({ mandate: activeMandate(), offer: spend, evaluation: verdict, signature: signed.signature, nonce: signed.nonce, txHash });
      }
      const ok = settled.status >= 200 && settled.status < 300;
      const order: Fulfillment = {
        id: `${Date.now()}`,
        at: new Date().toISOString(),
        title: offer.name,
        url: offer.url,
        price: live.priceLabel,
        payTo: live.payTo,
        status: ok ? "paid" : "unconfirmed",
        detail: merchantLine(ok, settled.status, settled.snippet),
        deliverTo: stored.delivery.country,
      };
      saveAgent({ ...stored, orders: [order, ...stored.orders].slice(0, 20) });
      deal.current = null;
      publishList(shelf.current, `${offer.name}. ${order.detail}`);
      desk.focus({
        pill: ok ? "ordered" : "held",
        pillTone: ok ? "mint" : "ghost",
        approved: state.approved + (ok ? 1 : 0),
      });
    } catch (error) {
      desk.focus({
        phase: "ask",
        pill: "needs you",
        pillTone: "fill",
        phone: {
          ...sheet(offer, accept, error instanceof Error ? error.message : "The wallet did not sign."),
          links: walletLinks(),
          approveLabel: "Try again",
        },
      });
    } finally {
      setBusy(false);
    }
  };

  const findLive = async (raw: string) => {
    const query = raw.trim();
    if (!query) return;
    if (/\btv\b|oled|exact item/i.test(query)) {
      deal.current = null;
      desk.submit(query);
      return;
    }
    setBusy(true);
    desk.focus({
      phase: "live",
      run: "side",
      command: `find ${query}`,
      typed: `find ${query}`,
      pill: "searching",
      pillTone: "line",
      checked: 1,
      goal: 3,
      phone: { view: "note", kicker: "Find & Buy Agent", title: query, sub: "Checking the live registries.", rows: [] },
    });
    try {
      const link = normalizeLink(query);
      if (link) {
        const probe = await probeOffer({ data: { url: link } });
        const accept = pickPayable(probe.accepts);
        if (!accept) {
          desk.focus({
            pill: "held",
            pillTone: "ghost",
            phone: {
              view: "note",
              kicker: "Link",
              title: new URL(link).hostname.replace(/^www\./, ""),
              sub: probe.status === 402 ? "This merchant did not offer an EVM stablecoin price." : `That address answered ${probe.status}. It is not asking to be paid.`,
              rows: [],
            },
          });
          return;
        }
        const offer = offerFromLink(link, accept);
        deal.current = { offer, accept, challenged: true };
        desk.focus({ phase: "ask", pill: "needs you", pillTone: "fill", phone: sheet(offer, accept, "The merchant is asking for payment. Approve to sign it.") });
        return;
      }
      const page = await listMarket({ data: { source: "all", offset: 0, limit: 24, query } });
      const ranked = rankOffers(page.sources.flatMap((source) => source.offers), loadAgent().rules).filter((row) => pickPayable(row.offer.accepts));
      const best = ranked[0];
      if (!best) {
        desk.focus({
          pill: "held",
          pillTone: "ghost",
          phone: { view: "note", kicker: "Nothing payable", title: query, sub: "No EVM stablecoin price matched these rules.", rows: [] },
        });
        return;
      }
      const accept = pickPayable(best.offer.accepts);
      if (!accept) return;
      deal.current = { offer: best.offer, accept, challenged: false };
      const cards: Card[] = ranked.slice(0, 4).map((row, index) => {
        const price = pickPayable(row.offer.accepts);
        return {
          id: row.offer.id,
          store: row.offer.sourceLabel,
          name: row.offer.name,
          rating: null,
          price: Math.round((usd(price?.priceLabel ?? "") ?? 0) * 100),
          lowest: index === 0,
          ribbon: "Lowest",
          art: "letter" as const,
        };
      });
      desk.focus({
        phase: "live",
        pill: "shopping",
        pillTone: "fill",
        checked: 3,
        goal: 3,
        phone: {
          view: "found",
          bubble: query,
          offers: cards,
          sub: `${ranked.length} live prices. Buy now asks you before anything is signed.`,
          showBuy: true,
          pending: sheet(best.offer, accept, "").pending,
        },
      });
    } catch (error) {
      desk.focus({
        pill: "held",
        pillTone: "ghost",
        phone: {
          view: "note",
          kicker: "Registries",
          title: "Could not check.",
          sub: error instanceof Error ? error.message : "The registries did not answer.",
          rows: [],
        },
      });
    } finally {
      setBusy(false);
    }
  };

  const openDeal = () => {
    const current = deal.current;
    if (!current) {
      desk.buy();
      return;
    }
    desk.focus({
      phase: "ask",
      pill: "needs you",
      pillTone: "fill",
      phone: sheet(current.offer, current.accept, "Approve to sign this exact price in your wallet."),
    });
  };

  const approve = async () => {
    const current = deal.current;
    if (!current || busy) {
      if (!current) desk.approve();
      return;
    }
    await buyOffer(current.offer, current.accept);
  };

  const selected = shelf.current.find((item) => item.id === selectedId);
  const selectedPrice = selected ? pickPayable(selected.accepts, payNet)?.priceLabel : "";
  const chainLabel = payNet === "All" ? pickPayable(selected?.accepts ?? [])?.networkLabel ?? "Base" : payNet;
  const buyLabel = !selected ? "" : !country ? "Choose a country" : selectedPrice ? `Buy on ${chainLabel} · ${selectedPrice} · ${country}` : `Not on ${payNet}`;

  const Frame = embedded ? "div" : "main";

  return (
    <div className={embedded ? "app embedded" : "app"}>
      {embedded ? null : <h1 className="sr">Find & Buy Agent</h1>}
      <p className="sr" aria-live="polite">
        {live}
      </p>
      <AppHeader active={state.tab} onTab={choose} />
      <Frame className="frame">
        <div className="cmdbar">
          <div className="cmd">
            <span className="prompt">~/agent</span>
            <span className="chev" aria-hidden>
              ›
            </span>
            <span className="cmdtext">{line}</span>
            {state.typing ? <span className="caret" aria-hidden /> : null}
          </div>
          <div className="cmdmeta">
            {showSkip ? (
              <button type="button" className="linkish" onClick={desk.skip}>
                skip
              </button>
            ) : (
              <button type="button" className="linkish" onClick={desk.replay}>
                replay
              </button>
            )}
            <span className="ver">v0.78.1 · Oct 28, 2026</span>
          </div>
        </div>
        {state.booted ? (
          <section className="stats" aria-label="Run">
            <div className="stat">
              <p className="stat-num">
                {state.checked}
                <span className="stat-den">/{state.goal}</span>
              </p>
              <p className="stat-label">
                Stores
                <br />
                checked
              </p>
            </div>
            <div className="stat">
              <p className="stat-num">{money(state.savings)}</p>
              <p className="stat-label">
                Less than
                <br />
                Amazon
              </p>
            </div>
            <div className="stat">
              <p className="stat-num">
                {state.approved}
                <span className="stat-den">/{state.asked}</span>
              </p>
              <p className="stat-label">
                Orders
                <br />
                approved by you
              </p>
            </div>
          </section>
        ) : (
          <div className="void" />
        )}
        {state.booted && state.tab === "shop" ? (
          <section className="stage">
            <PhoneStage
              state={state}
              onApprove={() => void approve()}
              onDecline={() => {
                deal.current = null;
                desk.decline();
              }}
              onBuy={openDeal}
              onAskAgain={desk.askAgain}
              onWeek={desk.showDigest}
              onAskText={(text) => void findLive(text)}
              onAskLink={(url) => void findLive(url)}
              onAskPhoto={(photo) => void findLive(labelFromPhoto(photo.name))}
              onInput={desk.setInput}
              onReplay={desk.replay}
              onPick={setSelectedId}
              selectedId={selectedId}
              buyLabel={buyLabel}
              onBuySelected={() => {
                if (!country) {
                  document.getElementById("deliver-country")?.focus();
                  return;
                }
                const offer = shelf.current.find((item) => item.id === selectedId);
                const accept = offer ? pickPayable(offer.accepts, payNet) : null;
                if (offer && accept) void buyOffer(offer, accept);
                else if (offer) publishList(shelf.current, `${offer.name} does not settle on ${payNet}. Nothing was signed.`);
              }}
              country={country}
              onCountry={chooseCountry}
              countries={COUNTRIES}
              onShelf={() => {
                listed.current = false;
                setSelectedId("");
                void loadShelf("");
              }}
              onSearch={(query) => {
                setSelectedId("");
                void loadShelf(query);
              }}
              payNet={payNet}
              onPayNet={setPayNet}
            />
            <Board state={state} />
          </section>
        ) : null}
        {state.tab === "vault" ? (
          <>
            <Vault state={state} />
            <AgentDesk openWallet />
          </>
        ) : null}
        {state.tab === "orders" ? (
          <>
            <FulfillmentList />
            <Orders state={state} />
          </>
        ) : null}
      </Frame>
      {pending ? (
        <ApprovalSheet
          mandate={activeMandate()}
          offer={toSpendOffer(pending.offer, pending.accept)}
          verdict={pending.verdict}
          onApprove={() => {
            const next = pending;
            approveSpend(toSpendOffer(next.offer, next.accept));
            setPending(null);
            void buyOffer(next.offer, next.accept);
          }}
          onDecline={() => {
            setPending(null);
            desk.focus({
              phase: "ask",
              pill: "held",
              pillTone: "ghost",
              phone: sheet(pending.offer, pending.accept, "Declined. Nothing was signed."),
            });
          }}
          onClose={() => setPending(null)}
        />
      ) : null}
    </div>
  );
}

function merchantLine(ok: boolean, status: number, snippet: string): string {
  const text = snippet.toLowerCase();
  if (ok) return "Paid. The merchant accepted it.";
  if (text.includes("insufficient_funds")) return "Signed, but this wallet does not hold enough USDC on that chain. Add USDC and buy again. Nothing was delivered.";
  if (text.includes("invalid_exact_evm_payload_signature") || text.includes("signature")) return "The wallet signed, but that signature did not match this chain's USDC. Nothing was spent.";
  if (status === 400) return "The merchant refused the payment file. Nothing was spent.";
  return `The merchant answered ${status}. Nothing was delivered.`;
}

function short(value: string): string {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

function usd(label: string): number | null {
  if (!label.startsWith("$")) return null;
  const value = Number(label.slice(1));
  return Number.isFinite(value) ? value : null;
}

function offerFromLink(url: string, accept: Accept): Offer {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    host = url;
  }
  return {
    id: `link:${url}`,
    source: "coinbase",
    sourceLabel: host,
    name: host,
    description: url,
    url,
    tags: [],
    updated: "",
    payers: 0,
    calls: 0,
    accepts: [accept],
    usage: { method: "GET", call: `GET ${url}`, inputs: "", returns: "", docs: "" },
  };
}
