import { lazy, Suspense, useState } from "react";
import { Link } from "@tanstack/react-router";
import { listings } from "@/content/posts";
import { Card, Chip } from "@/components/ui/kit";

const DevApp = lazy(() => import("@/components/findbuy/find-buy-app").then((mod) => ({ default: mod.FindBuyApp })));

const FAQ = [
  ["Does FindBuyAgent hold my keys?", "No. Signing stays in your injected wallet. This site stores only public data such as an address, chain id, rules, and receipts."],
  ["Does a signature move funds?", "Only when you approve a live x402 payment in your wallet. A receipt is saved only after a Base mainnet transaction hash comes back."],
  ["What is a mandate?", "Rules a buy is checked against before a signature: a per-buy cap, a window, and an ask-first line."],
  ["Can I say no?", "Yes. Decline stops the step. Nothing is signed."],
];

export function HomePage({ prompt = "", step = 0, demo = false }: { prompt?: string; step?: number; demo?: boolean }) {
  const posts = listings().slice(0, 3);
  const [dev, setDev] = useState(false);
  void prompt;
  void step;
  void demo;
  return (
    <div className="wrap">
      <section className="hero" aria-labelledby="home-title">
        <p className="fine-note">FindBuyAgent</p>
        <h1 id="home-title">An agent that finds it, asks first, and lets you sign.</h1>
        <p className="lede">FindBuyAgent compares stores, checks every buy against rules you set, and settles with x402 from your own wallet. No keys leave your wallet.</p>
        <div className="cta-row">
          <Link className="ui-btn primary" to="/merchants">See live merchants</Link>
          <Link className="ui-btn secondary" to="/mandates">Build a mandate</Link>
        </div>
        <p className="fine-note">You sign in your own wallet. FindBuyAgent does not hold funds.</p>
      </section>
      <section className="section" aria-labelledby="routes">
        <h2 id="routes">On this site</h2>
        <div className="chip-row">
          <Chip href="/mandates">Mandates</Chip>
          <Chip href="/receipts">Receipts</Chip>
          <Chip href="/protocols">Protocols</Chip>
          <Chip href="/compare">Compare</Chip>
          <Chip href="/merchants">Merchants</Chip>
          <Chip href="/security">Security</Chip>
          <Chip href="/faq">FAQ</Chip>
          <Chip href="/pricing">Pricing</Chip>
          <Chip href="/blog">Blog</Chip>
        </div>
      </section>
      <section className="section" aria-labelledby="how">
        <h2 id="how">How it works</h2>
        <div className="grid-3">
          <Card><h3>Find</h3><p>Type it, paste a link, or use a photo name. Live prices are whatever the merchant asks in the 402.</p></Card>
          <Card><h3>Ask</h3><p>Every buy is checked against your mandate. Anything outside it waits for you.</p></Card>
          <Card><h3>Sign</h3><p>Your wallet signs an exact-amount authorization. You get a receipt. FindBuyAgent does not hold the funds.</p></Card>
        </div>
      </section>
      <section className="section" aria-labelledby="why">
        <h2 id="why">Why self-custody</h2>
        <table className="ui-table">
          <thead>
            <tr>
              <th></th>
              <th>Custodial agent wallet</th>
              <th>Card token</th>
              <th>FindBuyAgent (your wallet)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Question">Who holds keys</td>
              <td data-label="Custodial">The service</td>
              <td data-label="Card token">The issuer holds the card credential</td>
              <td data-label="FindBuyAgent">You. This site never holds them</td>
            </tr>
            <tr>
              <td data-label="Question">Where limits are enforced</td>
              <td data-label="Custodial">In the service</td>
              <td data-label="Card token">On the token, if a mandate was issued</td>
              <td data-label="FindBuyAgent">In rules you set, then in the signature you make</td>
            </tr>
            <tr>
              <td data-label="Question">Who can change limits</td>
              <td data-label="Custodial">The service</td>
              <td data-label="Card token">You and the issuer, depending on the product</td>
              <td data-label="FindBuyAgent">You. A new signature is required</td>
            </tr>
          </tbody>
        </table>
        <p><Link to="/compare">Full comparison</Link></p>
      </section>
      <section className="section" aria-labelledby="protocols">
        <h2 id="protocols">Protocols</h2>
        <div className="chip-row">
          <Chip href="/protocols#x402">x402</Chip>
          <Chip href="/protocols#ap2">AP2</Chip>
          <Chip href="/protocols#acp">ACP</Chip>
          <Chip href="/protocols#visa-tap">Visa TAP</Chip>
          <Chip href="/protocols#mastercard-agent-pay">Mastercard Agent Pay</Chip>
        </div>
      </section>
      <section className="section" aria-labelledby="latest">
        <h2 id="latest">Latest from the blog</h2>
        <div className="grid-3">
          {posts.map((post) => (
            <Card key={post.path}>
              <p>{post.kicker}</p>
              <h3><a href={post.path}>{post.title}</a></h3>
              <p>{post.description}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="section" aria-labelledby="faq-teaser">
        <h2 id="faq-teaser">FAQ</h2>
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
        <p><Link to="/faq">All questions</Link></p>
      </section>
      <details className="section" onToggle={(event) => setDev((event.target as HTMLDetailsElement).open)}>
        <summary>Developer view</summary>
        <p className="fine-note">The existing find, vault, and orders tools. Same signing code.</p>
        {dev ? (
          <Suspense fallback={<p>Loading the developer view…</p>}>
            <DevApp embedded />
          </Suspense>
        ) : null}
      </details>
    </div>
  );
}
