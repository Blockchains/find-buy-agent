import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { listings } from "@/content/posts";
import { LiveShop } from "@/components/live/shop";

const ASKS = [
  { label: "65 inch OLED", q: "65 inch OLED television" },
  { label: "Trainers, size 10", q: "trainers size 10" },
  { label: "Coffee beans", q: "coffee beans" },
  { label: "Headphones", q: "wireless headphones" },
  { label: "A gift under 50", q: "gift under 50" },
];

const AISLES = [
  { name: "Wear", line: "Size in the note", q: "trainers", icon: "wear" },
  { name: "Home", line: "Deliver to you", q: "table lamp", icon: "home" },
  { name: "Tech", line: "The exact model", q: "wireless headphones", icon: "tech" },
  { name: "Kitchen", line: "Under your cap", q: "coffee beans", icon: "cup" },
  { name: "Gifts", line: "By a date you set", q: "gift", icon: "gift" },
  { name: "Kids", line: "Ask before it pays", q: "kids trainers", icon: "kite" },
] as const;

const STEPS = [
  { n: "01", title: "Say it", body: "One line. A cap. A note for size, colour, or the day it has to arrive." },
  { n: "02", title: "It checks", body: "The agent walks the stores for your country. You see each one turn ready." },
  { n: "03", title: "You authorise", body: "The last screen opens the store. The store takes the payment. This site never sees the card." },
];

export function HomePage() {
  const posts = listings().slice(0, 3);
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const go = (query: string) => {
    const next = query.trim();
    if (!next) return;
    void navigate({ to: "/fiat", search: { q: next } });
  };

  return (
    <div className="portal">
      <section className="portal-hero" aria-labelledby="home-title">
        <div className="portal-copy">
          <p className="portal-mark">
            <Mark />
            FindBuyAgent
          </p>
          <h1 id="home-title">Say it once. Authorise once.</h1>
          <p className="portal-lede">An agent that finds it under your rules. You pay the store. Nothing here holds your card or your keys.</p>
        </div>
        <form
          className="portal-search"
          onSubmit={(event) => {
            event.preventDefault();
            go(q);
          }}
        >
          <label className="sr" htmlFor="portal-q">
            What should the agent find
          </label>
          <SearchIcon />
          <input
            id="portal-q"
            value={q}
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Find a 65 inch OLED under your cap"
            onChange={(event) => setQ(event.target.value)}
          />
          <button type="submit">Find</button>
        </form>
        <div className="portal-asks" aria-label="Try a search">
          {ASKS.map((ask) => (
            <button key={ask.q} type="button" onClick={() => go(ask.q)}>
              {ask.label}
            </button>
          ))}
        </div>
      </section>

      <section className="portal-stage" aria-label="The payment step">
        <ol className="portal-steps">
          {STEPS.map((step) => (
            <li key={step.n}>
              <span>{step.n}</span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <article className="portal-device">
          <header>
            <span>FindBuyAgent</span>
            <em>Your turn</em>
          </header>
          <p className="portal-kicker">One question</p>
          <h2>Authorise this at the store?</h2>
          <p className="portal-cap">Your cap</p>
          <p className="portal-quiet">The price on the store is the price. Pay only if it is at or under the cap you set.</p>
          <dl>
            <div>
              <dt>You pay</dt>
              <dd>The store</dd>
            </div>
            <div>
              <dt>This site</dt>
              <dd>Never sees the card</dd>
            </div>
          </dl>
          <div className="portal-device-actions">
            <span>Not now</span>
            <Link to="/fiat">Authorise payment</Link>
          </div>
        </article>
      </section>

      <section className="portal-aisles" aria-labelledby="aisles">
        <div className="portal-head">
          <h2 id="aisles">Start from an aisle</h2>
          <Link to="/fiat">Open FIAT</Link>
        </div>
        <div className="aisle-row">
          {AISLES.map((aisle) => (
            <Link key={aisle.name} to="/fiat" search={{ q: aisle.q }} className="aisle">
              <AisleIcon name={aisle.icon} />
              <strong>{aisle.name}</strong>
              <span>{aisle.line}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="portal-rails" aria-labelledby="rails">
        <h2 id="rails" className="sr">
          Two ways to pay
        </h2>
        <Link to="/fiat" className="rail rail-fiat">
          <BagIcon />
          <div>
            <p>FIAT</p>
            <h3>Shops the stores. You authorise.</h3>
            <span>Card stays on the store’s own page.</span>
          </div>
        </Link>
        <a href="#base" className="rail rail-base">
          <CoinIcon />
          <div>
            <p>Base</p>
            <h3>Live USDC, signed in your wallet.</h3>
            <span>A receipt only after a real transaction hash.</span>
          </div>
        </a>
      </section>

      <div id="base" className="portal-base">
        <LiveShop />
      </div>

      <section className="portal-edit" aria-labelledby="latest">
        <div className="portal-head">
          <h2 id="latest">From the desk</h2>
          <Link to="/blog">All essays</Link>
        </div>
        <div className="edit-list">
          {posts.map((post) => (
            <a key={post.path} href={post.path} className="edit-card">
              <span>{post.kicker}</span>
              <h3>{post.title}</h3>
            </a>
          ))}
        </div>
      </section>

      <section className="portal-more" aria-label="More">
        <Link to="/security">Security</Link>
        <Link to="/compare">Compare</Link>
        <Link to="/protocols">Protocols</Link>
        <Link to="/faq">FAQ</Link>
        <Link to="/pricing">Pricing</Link>
      </section>
    </div>
  );
}

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect x="1" y="1" width="20" height="20" rx="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 14.5 11 6l5 8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="11" cy="14.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="portal-search-icon" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12.5 12.5 17 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M8 10h12l-1 12H9L8 10z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 10V8a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 8.5v11M11 11.5h4.2a2 2 0 0 1 0 4H11.6a2 2 0 0 0 0 4H16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function AisleIcon({ name }: { name: string }) {
  const common = { width: 28, height: 28, viewBox: "0 0 28 28", "aria-hidden": true as const };
  const paths: Record<string, ReactNode> = {
    wear: <path d="M9 8.5 14 6l5 2.5V22H9zM9 12h10" fill="none" stroke="currentColor" strokeWidth="1.6" />,
    home: <path d="M6 13 14 6l8 7v9H6z" fill="none" stroke="currentColor" strokeWidth="1.6" />,
    tech: <path d="M8 8h12v9H8zM11 20h6" fill="none" stroke="currentColor" strokeWidth="1.6" />,
    cup: <path d="M9 8h8v8a4 4 0 0 1-8 0zM17 10h2.5a2.5 2.5 0 0 1 0 5H17" fill="none" stroke="currentColor" strokeWidth="1.6" />,
    gift: <path d="M7 12h14v9H7zM7 12V9h14v3M14 9v12M10 9c0-2 2-3 4-1 2-2 4-1 4 1" fill="none" stroke="currentColor" strokeWidth="1.6" />,
    kite: <path d="M14 5 22 14 14 23 6 14zM14 5v18M6 14h16" fill="none" stroke="currentColor" strokeWidth="1.6" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
}
