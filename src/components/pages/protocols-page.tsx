import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CodeBlock } from "@/components/ui/kit";
import { Sequence, type SeqStep } from "@/components/pages/sequence";

const TABS = [
  { id: "x402", label: "x402" },
  { id: "ap2", label: "AP2" },
  { id: "acp", label: "ACP" },
  { id: "visa-tap", label: "Visa TAP" },
  { id: "mastercard-agent-pay", label: "Mastercard Agent Pay" },
  { id: "fit", label: "How they fit" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const X402 = `{
  "scheme": "exact",
  "network": "eip155:8453",
  "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "amount": "10000",
  "payTo": "<merchant address>",
  "maxTimeoutSeconds": 60,
  "extra": { "name": "USD Coin", "version": "2" }
}`;

const AP2 = `Checkout Mandate (open): constraints, not one cart
Payment Mandate: who pays, on which rail
Payment Receipt: signed after settlement
x402 can be the rail inside the payment mandate`;

const ACP = `POST /checkout_sessions
POST /checkout_sessions/{id}
POST /checkout_sessions/{id}/complete
POST /checkout_sessions/{id}/cancel
Delegated payment token: max amount + expiry`;

const TAP = `Signature-Input: web-bot-auth; alg="ed25519"
tag: browse | pay
nonce: one-time
payment: agentic network token`;

function Sources({ links }: { links: { href: string; label: string }[] }) {
  return (
    <p>
      Sources:{" "}
      {links.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? " · " : ""}
          <a href={link.href}>{link.label}</a>
        </span>
      ))}
    </p>
  );
}

export function ProtocolsPage() {
  const [tab, setTab] = useState<TabId>("x402");
  useEffect(() => {
    const read = () => {
      const id = window.location.hash.replace("#", "");
      if (TABS.some((item) => item.id === id)) setTab(id as TabId);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const choose = (id: TabId) => {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
  };
  return (
    <article className="wrap section">
      <p className="fine-note">Last reviewed: 1 Nov 2026</p>
      <h1>Agent payment protocols</h1>
      <p>How x402, AP2, ACP, Visa TAP, and Mastercard Agent Pay divide identity, permission, checkout, and settlement. FindBuyAgent settles x402 from your wallet. It does not speak for the other networks.</p>
      <div className="stepper" role="tablist" aria-label="Protocols">
        {TABS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} aria-current={tab === item.id ? "true" : undefined} onClick={() => choose(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {tab === "x402" ? <X402Panel /> : null}
      {tab === "ap2" ? <Ap2Panel /> : null}
      {tab === "acp" ? <AcpPanel /> : null}
      {tab === "visa-tap" ? <TapPanel /> : null}
      {tab === "mastercard-agent-pay" ? <McPanel /> : null}
      {tab === "fit" ? <FitPanel /> : null}
      <p>
        Essays: <Link to="/blog/$slug" params={{ slug: "what-is-x402" }}>What is x402</Link>
        {" · "}
        <Link to="/blog/$slug" params={{ slug: "visa-or-x402" }}>Visa or x402</Link>
        {" · "}
        <Link to="/blog/$slug" params={{ slug: "trusted-agent-protocol" }}>Trusted Agent Protocol</Link>
      </p>
    </article>
  );
}

function Panel({ title, summary, steps, signs, code, sources }: { title: string; summary: string; steps: SeqStep[]; signs: string; code: string; sources: { href: string; label: string }[] }) {
  return (
    <section>
      <h2>{title}</h2>
      <p>{summary}</p>
      <Sequence title={`${title} sequence`} steps={steps} />
      <aside className="ui-card">
        <h3>Who signs what</h3>
        <p>{signs}</p>
      </aside>
      <CodeBlock text={code} />
      <Sources links={sources} />
    </section>
  );
}

function X402Panel() {
  return (
    <Panel
      title="x402"
      summary="The client requests a resource. The server answers 402 with an accepts array: scheme exact, network, asset, amount, and payTo. The wallet signs an EIP-3009 transferWithAuthorization (EIP-712). The client retries with the payment header. A facilitator verifies and settles. The server then returns 200 and the settlement response. Coinbase’s agent-wallet notes say a wallet can enforce a per-payment cap, a rolling cap, and a payee allowlist. FindBuyAgent enforces those rules in the app before it asks your wallet to sign."
      steps={[
        { from: "Client", to: "Server", label: "GET resource" },
        { from: "Server", to: "Client", label: "402 + accepts" },
        { from: "Wallet", to: "Client", label: "EIP-3009 signature" },
        { from: "Client", to: "Server", label: "Retry with payment header" },
        { from: "Facilitator", to: "Chain", label: "Verify and settle" },
        { from: "Server", to: "Client", label: "200 + settlement" },
      ]}
      signs="Your wallet signs the exact USDC authorization. FindBuyAgent never sees the key. The facilitator broadcasts the settlement. The merchant does not get a standing allowance from this signature."
      code={X402}
      sources={[
        { href: "https://docs.cdp.coinbase.com/x402/core-concepts/cdp-sdk", label: "Coinbase x402 concepts" },
        { href: "https://docs.cdp.coinbase.com/agentic-wallet/cli/welcome", label: "CDP agentic wallet" },
      ]}
    />
  );
}

function Ap2Panel() {
  return (
    <Panel
      title="AP2"
      summary="AP2 uses a Checkout Mandate and a Payment Mandate. Each can be open (constraints for autonomous buys) or closed (an exact cart). They are signed verifiable credentials from a trusted surface, and the flow ends with a signed Payment Receipt. The protocol is rail-agnostic. x402 can be the payment method inside it. FindBuyAgent mandate ≈ AP2 open mandate; the approval sheet ≈ closing it."
      steps={[
        { from: "User", to: "Surface", label: "State the intent" },
        { from: "Surface", to: "Agent", label: "Sign Checkout Mandate" },
        { from: "Surface", to: "Agent", label: "Sign Payment Mandate" },
        { from: "Agent", to: "Rail", label: "x402 or card" },
        { from: "Rail", to: "User", label: "Signed Payment Receipt" },
      ]}
      signs="A trusted surface signs the mandates as verifiable credentials. FindBuyAgent’s in-browser signature records your rules. It is not an AP2 credential, and it does not move funds."
      code={AP2}
      sources={[
        { href: "https://ap2-protocol.org/ap2/specification/", label: "AP2 specification" },
        { href: "https://github.com/google-agentic-commerce/a2a-x402/blob/main/spec/v0.2/spec.md", label: "A2A x402 spec" },
      ]}
    />
  );
}

function AcpPanel() {
  return (
    <Panel
      title="ACP"
      summary="ACP is a merchant checkout. The agent calls POST /checkout_sessions, can update the session, then POST /complete or /cancel. Order webhooks tell the agent what happened. Payment is a delegated token with a max amount and an expiry, such as a Stripe Shared Payment Token. The merchant stays merchant of record. In March 2026 OpenAI said it would deprioritize native Instant Checkout in ChatGPT in favour of merchant checkouts and apps."
      steps={[
        { from: "Agent", to: "Merchant", label: "POST /checkout_sessions" },
        { from: "Merchant", to: "Agent", label: "Session" },
        { from: "Agent", to: "Merchant", label: "Update" },
        { from: "PSP", to: "Agent", label: "Delegated token" },
        { from: "Agent", to: "Merchant", label: "POST /complete" },
        { from: "Merchant", to: "Agent", label: "Order webhook" },
      ]}
      signs="The person confirms in the chat. The payment token is issued by the PSP, capped and expiring. The merchant charges it. FindBuyAgent does not issue ACP tokens."
      code={ACP}
      sources={[
        { href: "https://developers.openai.com/commerce/specs/checkout", label: "ACP checkout spec" },
        { href: "https://developers.openai.com/commerce/guides/key-concepts", label: "ACP key concepts" },
        { href: "https://www.cnbc.com/2026/03/24/openai-revamps-shopping-experience-in-chatgpt-after-instant-checkout.html", label: "CNBC, 24 Mar 2026" },
      ]}
    />
  );
}

function TapPanel() {
  return (
    <Panel
      title="Visa TAP"
      summary="Registered agents sign HTTP requests with Web Bot Auth (RFC 9421). The signature can carry a browse or pay tag and a nonce. Payment uses agentic network tokens rather than a raw card number."
      steps={[
        { from: "Agent", to: "Registry", label: "Register" },
        { from: "Agent", to: "Merchant", label: "Sign HTTP (RFC 9421)" },
        { from: "Agent", to: "Merchant", label: "browse or pay tag + nonce" },
        { from: "Network", to: "Merchant", label: "Agentic token" },
      ]}
      signs="The agent signs the HTTP message, not an EIP-3009 transfer. The network token pays. FindBuyAgent does not register a Visa agent and does not hold a card token."
      code={TAP}
      sources={[
        { href: "https://blog.cloudflare.com/secure-agentic-commerce/", label: "Cloudflare on agentic commerce" },
        { href: "https://www.visa.com/en-us/solutions/intelligent-commerce", label: "Visa Intelligent Commerce" },
      ]}
    />
  );
}

function McPanel() {
  return (
    <Panel
      title="Mastercard Agent Pay"
      summary="Mastercard Agent Pay is in the same family: a registered agent presents a signed request, and an agentic network token pays inside the limits the person set. FindBuyAgent does not settle those tokens."
      steps={[
        { from: "User", to: "Agent", label: "Set the instruction" },
        { from: "Agent", to: "Merchant", label: "Signed request" },
        { from: "Network", to: "Merchant", label: "Agent Pay token" },
      ]}
      signs="The network, not this site, holds the card credential. The person sets the instruction. FindBuyAgent’s path is the opposite shape: you hold the key and sign USDC yourself."
      code={`Agent Pay: registered agent + network token
FindBuyAgent: your wallet + x402 USDC
These are different rails.`}
      sources={[{ href: "https://www.mastercard.com/us/en/business/artificial-intelligence/mastercard-agent-pay.html", label: "Mastercard Agent Pay" }]}
    />
  );
}

function FitPanel() {
  const layers = [
    ["Identity", "TAP, Web Bot Auth, KYA"],
    ["Authorization", "AP2 mandates, FindBuyAgent rules"],
    ["Checkout", "ACP, UCP, merchant site"],
    ["Settlement", "x402 on-chain, card network tokens"],
  ];
  return (
    <section>
      <h2>How they fit</h2>
      <p>The protocols stack. Identity says who is asking. Authorization says what they may do. Checkout builds the order. Settlement moves the money. FindBuyAgent sits in authorization and, when you sign, in x402 settlement.</p>
      <ol className="layer-list">
        {layers.map(([name, body]) => (
          <li key={name}>
            <strong>{name}</strong>
            <span>{body}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export const PROTOCOL_FAQS = [
  ["What is x402?", "An HTTP 402 flow. The server names the exact USDC payment. Your wallet signs it. A facilitator settles it."],
  ["What is an AP2 open mandate?", "Constraints for later buys, rather than one exact cart. FindBuyAgent’s mandate is the same idea, enforced in this app before a signature."],
  ["Does ACP replace the merchant?", "No. The merchant stays merchant of record. The agent drives checkout_sessions and a capped payment token."],
  ["What does Visa TAP sign?", "The HTTP request, with Web Bot Auth (RFC 9421), a browse or pay tag, and a nonce. Payment is a network token."],
  ["Which rail does FindBuyAgent use?", "x402 USDC from your own wallet. A purchase receipt is stored only after a Base mainnet transaction hash comes back."],
];
