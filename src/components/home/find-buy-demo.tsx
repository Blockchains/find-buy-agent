import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Badge, Button, Callout, Card, Chip, CodeBlock, HashPill, Sheet, Stepper, Toast } from "@/components/ui/kit";
import { saveReceipt, type DemoReceipt } from "@/lib/demo/receipts";
import type { Accept } from "@/lib/market/catalog";

const STEPS = ["Ask", "Search", "Compare", "Check rules", "Approve", "Sign", "Receipt"] as const;

type Offer = {
  id: string;
  store: string;
  name: string;
  price: number;
  shipping: number;
  tax: number;
  delivery: string;
  stock: boolean;
  rail: string;
  returns: string;
  allow: boolean;
  x402: boolean;
};

const PROMPTS = [
  '65" OLED TV, cheapest in stock',
  "3 gifts for mom under $50 by Friday",
  "Refill Kirkland coffee every 30 days",
  "Pay for one API call (x402 testnet)",
];

const CAP = 50;
const WEEK = 200;
const ASK_AT = 25;

function offersFor(prompt: string): Offer[] {
  if (/x402/i.test(prompt)) {
    return [
      {
        id: "api",
        store: "Example API",
        name: "One metered API call",
        price: 0.01,
        shipping: 0,
        tax: 0,
        delivery: "Instant",
        stock: true,
        rail: "x402 USDC on Base Sepolia",
        returns: "n/a",
        allow: true,
        x402: true,
      },
    ];
  }
  return [
    {
      id: "market",
      store: "Example Market",
      name: prompt,
      price: 34.99,
      shipping: 0,
      tax: 2.8,
      delivery: "Friday",
      stock: true,
      rail: "card",
      returns: "30 days",
      allow: true,
      x402: false,
    },
    {
      id: "outlet",
      store: "Example Outlet",
      name: prompt,
      price: 41,
      shipping: 5,
      tax: 3.2,
      delivery: "Tomorrow",
      stock: true,
      rail: "x402 USDC on Base",
      returns: "14 days",
      allow: false,
      x402: false,
    },
    {
      id: "stall",
      store: "Example Marketplace",
      name: prompt,
      price: 29.5,
      shipping: 8,
      tax: 2.1,
      delivery: "Next week",
      stock: false,
      rail: "card",
      returns: "No returns",
      allow: true,
      x402: false,
    },
  ];
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function checks(offer: Offer) {
  const total = offer.price + offer.shipping + offer.tax;
  return [
    total <= CAP
      ? { status: "go" as const, text: `✓ ${money(total)} ≤ ${money(CAP)} per-buy cap` }
      : { status: "stop" as const, text: `✕ ${money(total)} is over the ${money(CAP)} per-buy cap → nothing signed` },
    { status: "go" as const, text: `✓ ${money(0)} spent this week, under ${money(WEEK)}` },
    total > ASK_AT
      ? { status: "ask" as const, text: `⚠ Over ${money(ASK_AT)} → needs your approval` }
      : { status: "go" as const, text: `✓ At or under ${money(ASK_AT)}, still shown before signing` },
    offer.allow
      ? { status: "go" as const, text: "✓ Merchant is on the example allowlist" }
      : { status: "stop" as const, text: "✕ Merchant not on allowlist → nothing signed" },
    offer.stock
      ? { status: "go" as const, text: "✓ Marked in stock in this example" }
      : { status: "stop" as const, text: "✕ Out of stock in this example → nothing signed" },
  ];
}

const SEPOLIA: Accept = {
  scheme: "exact",
  network: "eip155:84532",
  networkLabel: "Base Sepolia",
  asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  assetName: "USDC",
  amount: "10000",
  priceLabel: "$0.01",
  payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
  timeoutSeconds: 60,
  evm: true,
  extra: { name: "USDC", version: "2" },
};

export function FindBuyDemo({ initialPrompt = "", initialStep = 0 }: { initialPrompt?: string; initialStep?: number }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(Math.min(STEPS.length - 1, Math.max(0, initialStep)));
  const [mode, setMode] = useState<"type" | "link" | "photo">("type");
  const [prompt, setPrompt] = useState(initialPrompt || PROMPTS[0]);
  const [sort, setSort] = useState<"price" | "delivery">("price");
  const [picked, setPicked] = useState<string>("");
  const [searching, setSearching] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState("");
  const [receipt, setReceipt] = useState<DemoReceipt | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const offers = useMemo(() => offersFor(prompt), [prompt]);
  const ranked = [...offers].sort((a, b) => (sort === "price" ? a.price - b.price : a.delivery.localeCompare(b.delivery)));
  const match = ranked.find((offer) => offer.stock && offer.allow && offer.price + offer.shipping + offer.tax <= CAP);
  const best = match ?? ranked[0];
  const chosen = offers.find((offer) => offer.id === picked) ?? best;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheet(false);
      const tag = (event.target as HTMLElement).tagName;
      if (event.key === "Enter" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "BUTTON" && tag !== "A" && tag !== "SELECT") {
        setStep((value) => Math.min(STEPS.length - 1, value + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const note = (line: string) => setLog((current) => [...current, line]);

  const goSearch = () => {
    setSearching(true);
    note(`findbuy --ask-first ${JSON.stringify(prompt)}`);
    window.setTimeout(() => {
      setSearching(false);
      setPicked(best.id);
      setStep(1);
      note("example results. not a live scrape.");
    }, 700);
  };

  const decline = () => {
    setSheet(false);
    setToast("Declined. Nothing was signed.");
    note("declined. nothing signed.");
  };

  const signDemo = () => {
    if (!chosen.x402) {
      const next: DemoReceipt = {
        id: `${Date.now()}`,
        at: new Date().toISOString(),
        prompt,
        item: chosen.name,
        merchant: chosen.store,
        total: money(chosen.price + chosen.shipping + chosen.tax),
        chain: "none",
        asset: "example",
        payTo: "",
        status: "simulated",
        signature: "Simulated, not a real signature",
        example: true,
      };
      saveReceipt(next);
      setReceipt(next);
      setSheet(false);
      setStep(6);
      note("simulated signature. example merchant, no transaction.");
      return;
    }
    const ok = window.confirm("This signs a real authorization for $0.01 on Base Sepolia. It is not submitted to a merchant.");
    if (!ok) return;
    void (async () => {
      try {
        const { connectWallet, paymentBundle } = await import("@/lib/market/wallet");
        const wallet = await connectWallet();
        const signed = await paymentBundle(wallet.address, "https://example.invalid/x402-demo", "Example x402 testnet call", SEPOLIA);
        const next: DemoReceipt = {
          id: `${Date.now()}`,
          at: new Date().toISOString(),
          prompt,
          item: chosen.name,
          merchant: chosen.store,
          total: "$0.01",
          chain: "eip155:84532",
          asset: "USDC",
          payTo: SEPOLIA.payTo,
          status: "signed",
          signature: signed.v2.slice(0, 42),
          example: true,
        };
        saveReceipt(next);
        setReceipt(next);
        setStep(6);
        note("wallet signed an exact USDC authorization on Base Sepolia. not relayed.");
      } catch (error) {
        setToast(error instanceof Error ? error.message : "The wallet did not sign. Nothing was submitted.");
      }
    })();
  };

  const share = () => {
    const next = { demo: 1 as const, prompt: prompt.slice(0, 180), step };
    void navigate({ to: "/", search: next, replace: true }).then(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("demo", "1");
      url.searchParams.set("prompt", next.prompt);
      url.searchParams.set("step", String(next.step));
      void navigator.clipboard.writeText(url.toString()).catch(() => undefined);
      setToast("Demo link copied. It has the prompt and step only.");
    });
  };

  return (
    <section id="demo" className="section" aria-labelledby="demo-title">
      <h2 id="demo-title">Live demo</h2>
      <div className="chip-row">
        <Chip>Demo wallet (no funds)</Chip>
        <Chip>Example data</Chip>
      </div>
      <Callout>Example results. Nothing here is a live price. Decline means nothing is signed.</Callout>
      <Stepper steps={[...STEPS]} current={step} onStep={setStep} />
      {step === 0 ? (
        <Card>
          <div className="chip-row" role="group" aria-label="Input mode">
            {(["type", "link", "photo"] as const).map((item) => (
              <Button key={item} variant={mode === item ? "primary" : "secondary"} onClick={() => setMode(item)}>
                {item[0].toUpperCase() + item.slice(1)}
              </Button>
            ))}
          </div>
          {mode === "photo" ? (
            <>
              <p>A photo stays in this browser. Only the file name is used as the example prompt. It is not uploaded.</p>
              <input
                type="file"
                accept="image/*"
                aria-label="Example photo"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setPrompt(file.name);
                }}
              />
            </>
          ) : null}
          <label className="ui-field">
            <span>{mode === "link" ? "Example link" : "What should it find?"}</span>
            <input value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          </label>
          <div className="chip-row">
            {PROMPTS.map((item) => (
              <button key={item} type="button" className="ui-chip" onClick={() => setPrompt(item)}>
                {item}
              </button>
            ))}
          </div>
          <Button onClick={goSearch}>Search examples</Button>
        </Card>
      ) : null}
      {step === 1 ? (
        <div className="grid-cards">
          <p>{searching ? "Looking through example stores…" : "Example results"}</p>
          {ranked.map((offer) => (
            <Card key={offer.id} className={offer.id === match?.id ? "best" : ""}>
              <h3>{offer.store}</h3>
              <p className="num">{money(offer.price)}</p>
              <p>{offer.delivery} · {offer.stock ? "In stock" : "Out of stock"}</p>
              <p>Accepts: {offer.rail}</p>
              <Button variant="secondary" onClick={() => { setPicked(offer.id); setStep(2); }}>Compare</Button>
            </Card>
          ))}
          <Button variant="ghost" onClick={() => setStep(2)}>Skip</Button>
        </div>
      ) : null}
      {step === 2 ? (
        <div>
          <label className="ui-field">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as "price" | "delivery")}>
              <option value="price">Price</option>
              <option value="delivery">Delivery</option>
            </select>
          </label>
          <table className="ui-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Price</th>
                <th>Delivery</th>
                <th>Returns</th>
                <th>Rails</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((offer) => (
                <tr key={offer.id} className={offer.id === match?.id ? "best" : ""}>
                  <td data-label="Store">{offer.store}{offer.id === match?.id ? " · lowest in-stock under your cap" : ""}</td>
                  <td data-label="Price" className="num">{money(offer.price)}</td>
                  <td data-label="Delivery">{offer.delivery}</td>
                  <td data-label="Returns">{offer.returns}</td>
                  <td data-label="Rails">{offer.rail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button onClick={() => setStep(3)}>Check rules</Button>
        </div>
      ) : null}
      {step === 3 ? (
        <Card>
          <h3>{chosen.store}</h3>
          <ul>
            {checks(chosen).map((item) => (
              <li key={item.text}>
                <Badge status={item.status}>{item.text}</Badge>
              </li>
            ))}
          </ul>
          <Button onClick={() => { setSheet(true); setStep(4); }} disabled={checks(chosen).some((item) => item.status === "stop")}>
            Continue
          </Button>
        </Card>
      ) : null}
      {step >= 4 && step < 6 ? (
        <Card>
          <h3>{chosen.x402 ? "Wallet can sign this testnet example" : "Example merchant, signing disabled"}</h3>
          <p>Demo mode simulates a signature. A physical example is never sent to a wallet.</p>
          <Button onClick={() => setSheet(true)}>Review</Button>
          {chosen.x402 ? <Button variant="secondary" onClick={signDemo}>Sign on Base Sepolia</Button> : null}
          {!chosen.x402 ? <Button variant="secondary" onClick={signDemo}>Simulate signature</Button> : null}
        </Card>
      ) : null}
      {step === 6 && receipt ? (
        <Card>
          <h3>Receipt</h3>
          <p>{receipt.merchant} · {receipt.total}</p>
          <p>{receipt.signature}</p>
          <Chip href="/receipts">View in Receipts</Chip>
        </Card>
      ) : null}
      <div className="cta-row">
        <Button variant="ghost" onClick={share}>Share this demo</Button>
        <Button variant="ghost" onClick={() => { setStep(0); setReceipt(null); setLog([]); }}>Replay</Button>
      </div>
      <details>
        <summary>Developer view</summary>
        <CodeBlock text={["findbuy --ask-first " + JSON.stringify(prompt), ...log].join("\n")} />
      </details>
      {sheet ? (
        <Sheet title="Approve this example" onClose={() => setSheet(false)}>
          <p>{chosen.name}</p>
          <p>{chosen.store}</p>
          <p>Estimate, including shipping and tax: {money(chosen.price + chosen.shipping + chosen.tax)}</p>
          <p>Chain: {chosen.x402 ? "Base Sepolia (84532)" : "none, example only"}</p>
          <p>Asset: {chosen.x402 ? "USDC" : "example"}</p>
          {chosen.x402 ? <HashPill value={SEPOLIA.payTo} href="https://sepolia.basescan.org/address/0x209693Bc6afc0C5328bA36FaF03C514EF312287C" /> : <p>No payTo. Nothing can be signed for this example merchant.</p>}
          <p>Expiry: 60 seconds on a real signature.</p>
          <div className="cta-row">
            <Button onClick={signDemo}>{chosen.x402 ? "Approve & sign" : "Approve & simulate"}</Button>
            <Button variant="danger" onClick={decline}>Decline</Button>
            <a className="ui-btn secondary" href="/mandates">Change rules</a>
          </div>
        </Sheet>
      ) : null}
      {toast ? <Toast>{toast}</Toast> : null}
    </section>
  );
}
