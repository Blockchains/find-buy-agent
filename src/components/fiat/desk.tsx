import { useEffect, useMemo, useState } from "react";

type Region = {
  id: string;
  label: string;
  currency: string;
  stores: { id: string; name: string; brief: string; href: (query: string) => string }[];
};

const REGIONS: Region[] = [
  {
    id: "GB",
    label: "United Kingdom",
    currency: "£",
    stores: [
      { id: "amazon", name: "Amazon", brief: "Same item, your cap", href: (q) => `https://www.amazon.co.uk/s?k=${q}` },
      { id: "argos", name: "Argos", brief: "Collect or deliver", href: (q) => `https://www.argos.co.uk/search/${q}/` },
      { id: "johnlewis", name: "John Lewis", brief: "The item, not a maze", href: (q) => `https://www.johnlewis.com/search?search-term=${q}` },
      { id: "ebay", name: "eBay", brief: "Another seller, same brief", href: (q) => `https://www.ebay.co.uk/sch/i.html?_nkw=${q}` },
      { id: "etsy", name: "Etsy", brief: "Makers, under your cap", href: (q) => `https://www.etsy.com/search?q=${q}&ship_to=GB` },
      { id: "nike", name: "Nike", brief: "Size and colour in the note", href: (q) => `https://www.nike.com/gb/w?q=${q}` },
    ],
  },
  {
    id: "US",
    label: "United States",
    currency: "$",
    stores: [
      { id: "amazon", name: "Amazon", brief: "Same item, your cap", href: (q) => `https://www.amazon.com/s?k=${q}` },
      { id: "walmart", name: "Walmart", brief: "Another store, your cap", href: (q) => `https://www.walmart.com/search?q=${q}` },
      { id: "bestbuy", name: "Best Buy", brief: "The exact model", href: (q) => `https://www.bestbuy.com/site/searchpage.jsp?st=${q}` },
      { id: "target", name: "Target", brief: "In stock, your cap", href: (q) => `https://www.target.com/s?searchTerm=${q}` },
      { id: "etsy", name: "Etsy", brief: "Makers, under your cap", href: (q) => `https://www.etsy.com/search?q=${q}&ship_to=US` },
      { id: "nike", name: "Nike", brief: "Size and colour in the note", href: (q) => `https://www.nike.com/w?q=${q}` },
    ],
  },
  {
    id: "DE",
    label: "Germany",
    currency: "€",
    stores: [
      { id: "amazon", name: "Amazon", brief: "Same item, your cap", href: (q) => `https://www.amazon.de/s?k=${q}` },
      { id: "otto", name: "Otto", brief: "Deliver to you", href: (q) => `https://www.otto.de/suche/${q}/` },
      { id: "ebay", name: "eBay", brief: "Another seller", href: (q) => `https://www.ebay.de/sch/i.html?_nkw=${q}` },
      { id: "zalando", name: "Zalando", brief: "Size in the note", href: (q) => `https://www.zalando.de/katalog/?q=${q}` },
    ],
  },
  {
    id: "AE",
    label: "United Arab Emirates",
    currency: "AED ",
    stores: [
      { id: "amazon", name: "Amazon", brief: "Same item, your cap", href: (q) => `https://www.amazon.ae/s?k=${q}` },
      { id: "noon", name: "noon", brief: "Deliver in the UAE", href: (q) => `https://www.noon.com/uae-en/search/?q=${q}` },
      { id: "namshi", name: "Namshi", brief: "Size in the note", href: (q) => `https://www.namshi.com/uae-en/search/?q=${q}` },
    ],
  },
];

const HINTS = [
  "65 inch OLED, another store, under my cap",
  "Trainers, size 10, under 80",
  "Coffee beans, ask me before it repeats",
  "Headphones, only if they are under my cap",
];

type Auth = {
  id: string;
  at: string;
  query: string;
  store: string;
  href: string;
  cap: number;
  note: string;
  country: string;
};

type Phase = "ask" | "checking" | "authorise" | "sent";

const KEY = "fba-fiat-v1";

function loadAuths(): Auth[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as Auth[];
    return Array.isArray(raw) ? raw.filter((row) => row && row.href && row.query) : [];
  } catch {
    return [];
  }
}

function money(currency: string, value: number) {
  return `${currency}${value.toLocaleString(undefined, { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function FiatDesk({ initialQuery = "" }: { initialQuery?: string }) {
  const [regionId, setRegionId] = useState("GB");
  const [query, setQuery] = useState(initialQuery);
  const [cap, setCap] = useState("80");
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("ask");
  const [seen, setSeen] = useState(0);
  const [storeId, setStoreId] = useState("");
  const [auths, setAuths] = useState<Auth[]>([]);
  const [hint, setHint] = useState(0);
  const [notice, setNotice] = useState("");
  const region = REGIONS.find((item) => item.id === regionId) ?? REGIONS[0];
  const capNumber = Number(cap);
  const capOk = Number.isFinite(capNumber) && capNumber > 0;
  const store = region.stores.find((item) => item.id === storeId) ?? region.stores[0];
  const encoded = encodeURIComponent(query.trim());
  const href = query.trim() ? store.href(encoded) : "";

  useEffect(() => {
    setAuths(loadAuths());
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setHint((value) => (value + 1) % HINTS.length), 4200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (phase !== "checking") return;
    setSeen(0);
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setSeen(step);
      if (step >= region.stores.length) {
        window.clearInterval(timer);
        setStoreId(region.stores[0].id);
        setPhase("authorise");
      }
    }, 280);
    return () => window.clearInterval(timer);
  }, [phase, region]);

  const checked = phase === "ask" ? 0 : phase === "checking" ? seen : region.stores.length;
  const status = phase === "checking" ? "Checking" : phase === "authorise" ? "Your turn" : phase === "sent" ? "At the store" : "Ask first";

  const start = () => {
    if (!query.trim()) {
      setNotice("Say what to find.");
      return;
    }
    if (!capOk) {
      setNotice("Set the most you will authorise.");
      return;
    }
    setNotice("");
    setPhase("checking");
  };

  const authorise = () => {
    if (!href || !capOk) return;
    const row: Auth = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      query: query.trim(),
      store: store.name,
      href,
      cap: capNumber,
      note: note.trim(),
      country: region.label,
    };
    const next = [row, ...auths].slice(0, 20);
    setAuths(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    const opened = window.open(href, "_blank", "noopener,noreferrer");
    setPhase("sent");
    setNotice(opened ? "" : "The store tab was blocked. Use the link below. You still pay there.");
  };

  const reset = () => {
    setPhase("ask");
    setSeen(0);
    setNotice("");
  };

  const jobs = useMemo(
    () =>
      region.stores.map((item, index) => {
        let state = "Queued";
        if (phase === "checking") state = index < seen ? "Ready" : index === seen ? "Checking" : "Queued";
        else if (phase === "authorise" || phase === "sent") state = item.id === store.id ? "This one" : "Ready";
        return { ...item, state };
      }),
    [region.stores, phase, seen, store.id],
  );

  return (
    <div className="fiat">
      <div className="fiat-phone" aria-live="polite">
        <div className="fiat-top">
          <span>FindBuyAgent</span>
          <span className={`fiat-pill${phase === "authorise" ? " is-hot" : ""}`}>{status}</span>
        </div>
        {phase === "ask" || phase === "checking" ? (
          <form
            className="fiat-ask"
            onSubmit={(event) => {
              event.preventDefault();
              start();
            }}
          >
            <p className="fiat-kicker">One line</p>
            <label>
              <span className="sr">What should the agent find</span>
              <textarea
                value={query}
                rows={3}
                placeholder={HINTS[hint]}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="fiat-conds">
              <label>
                <span>Authorise only under</span>
                <input inputMode="decimal" value={cap} onChange={(event) => setCap(event.target.value.replace(/[^0-9.]/g, ""))} aria-label="Maximum you will authorise" />
              </label>
              <label>
                <span>Note</span>
                <input value={note} placeholder="Size, colour, deliver by Friday" onChange={(event) => setNote(event.target.value)} />
              </label>
            </div>
            <button type="submit" className="fiat-go" disabled={phase === "checking"}>
              {phase === "checking" ? `Checking ${seen} of ${region.stores.length}` : "Find it"}
            </button>
          </form>
        ) : null}
        {phase === "authorise" || phase === "sent" ? (
          <div className="fiat-card">
            <p className="fiat-kicker">{phase === "sent" ? "Opened" : "One question"}</p>
            <h2>{phase === "sent" ? `Finish paying ${store.name}` : `Authorise this at ${store.name}?`}</h2>
            <p className="fiat-amount">{capOk ? money(region.currency, capNumber) : "Set a cap"}</p>
            <p className="fiat-quiet">Only if the store total is at or under this. The price on the store is the price.</p>
            <dl>
              <div><dt>Item</dt><dd>{query.trim()}</dd></div>
              <div><dt>Store</dt><dd>{store.name}</dd></div>
              <div><dt>Note</dt><dd>{note.trim() || "None"}</dd></div>
              <div><dt>You pay</dt><dd>{store.name}. Not FindBuyAgent.</dd></div>
            </dl>
            {phase === "authorise" ? (
              <div className="fiat-actions">
                <button type="button" className="fiat-ghost" onClick={reset}>Not now</button>
                <button type="button" className="fiat-go" onClick={authorise}>Authorise payment</button>
              </div>
            ) : (
              <div className="fiat-actions">
                <a className="fiat-go" href={href} target="_blank" rel="noopener noreferrer">Open {store.name}</a>
                <button type="button" className="fiat-ghost" onClick={reset}>Find something else</button>
              </div>
            )}
          </div>
        ) : null}
        {notice ? <p className="fiat-notice" role="status">{notice}</p> : null}
      </div>
      <aside className="fiat-side">
        <div className="fiat-stats">
          <p><strong>{checked}/{region.stores.length}</strong><span>Stores checked</span></p>
          <p><strong>{capOk ? money(region.currency, capNumber) : "—"}</strong><span>Your cap</span></p>
          <p><strong>{auths.length}</strong><span>Authorised by you</span></p>
        </div>
        <label className="fiat-region">
          <span>Deliver to</span>
          <select
            value={regionId}
            onChange={(event) => {
              setRegionId(event.target.value);
              setPhase("ask");
              setSeen(0);
            }}
          >
            {REGIONS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <ol className="fiat-jobs">
          {jobs.map((job) => (
            <li key={job.id}>
              <button
                type="button"
                disabled={phase === "ask" || phase === "checking"}
                className={job.id === store.id && phase !== "ask" && phase !== "checking" ? "is-on" : ""}
                onClick={() => {
                  setStoreId(job.id);
                  if (phase === "sent") setPhase("authorise");
                }}
              >
                <span className="fiat-letter" aria-hidden>{job.name.slice(0, 1)}</span>
                <span>
                  <strong>{job.name}</strong>
                  <em>{job.brief}</em>
                </span>
                <span className={`fiat-badge${job.state === "This one" ? " is-hot" : ""}`}>{job.state}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="fiat-rule">Never pay without your authorisation. <span>{auths.length} opened by you.</span></p>
        {auths[0] ? (
          <p className="fiat-last">
            Last: {auths[0].store} · {auths[0].query} · {new Date(auths[0].at).toLocaleString()}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
