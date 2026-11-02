import { Link } from "@tanstack/react-router";
import { listings } from "@/content/posts";
import { LiveShop } from "@/components/live/shop";
import { Card, Chip } from "@/components/ui/kit";

const FAQ = [
  ["Does FindBuyAgent hold my keys?", "No. Signing stays in your injected wallet. This site stores only public data such as an address, chain id, rules, and receipts."],
  ["Does a signature move funds?", "Only when you approve a live x402 payment in your wallet. A receipt is saved only after a Base mainnet transaction hash comes back."],
  ["What is a mandate?", "Rules a buy is checked against before a signature: a per-buy cap, a window, and an ask-first line."],
  ["Can I say no?", "Yes. Decline stops the step. Nothing is signed."],
];

export function HomePage() {
  const posts = listings().slice(0, 3);
  return (
    <div className="wrap">
      <section className="hero aurora" aria-labelledby="home-title">
        <p className="fine-note">FindBuyAgent</p>
        <h1 id="home-title">Let your agent buy. You stay in control.</h1>
        <p className="lede">Type what you need. Live prices come from each merchant’s 402. You approve the amount, then your wallet signs on Base.</p>
      </section>
      <LiveShop />
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
          <Chip href="/settings">Settings</Chip>
          <Chip href="/blog">Blog</Chip>
        </div>
      </section>
      <section className="section" aria-labelledby="how">
        <h2 id="how">Ask, approve, paid on Base</h2>
        <div className="grid-3">
          <Card><h3>Ask</h3><p>The intent box ranks live resources. The price is whatever that 402 asks right now.</p></Card>
          <Card><h3>Approve</h3><p>Amount, chain, and payee stay on the sheet. Decline signs nothing.</p></Card>
          <Card><h3>Paid on Base</h3><p>A receipt is stored only after a Base transaction hash comes back.</p></Card>
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
    </div>
  );
}
