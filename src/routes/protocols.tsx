import { createFileRoute } from "@tanstack/react-router";
import { Doc, docHead } from "@/components/pages/doc";

export const Route = createFileRoute("/protocols")({
  head: () => docHead("Protocols | FindBuyAgent", "Short notes on x402, AP2, ACP, Visa TAP, and Mastercard Agent Pay. No partnerships are claimed.", "/protocols"),
  component: Page,
});

function Page() {
  return (
    <Doc title="Protocols">
      <section id="x402">
        <h2>x402</h2>
        <p>HTTP can answer 402 Payment Required. x402 is a way for the client to sign a payment and retry. A facilitator checks the signature and settles it. FindBuyAgent uses that path only from your wallet.</p>
        <p><a href="/blog/what-is-x402">Essay: what is x402</a></p>
      </section>
      <section id="ap2">
        <h2>AP2</h2>
        <p>Google has described an Agent Payments Protocol for payment intents between agents. This page is a pointer, not an integration.</p>
      </section>
      <section id="acp">
        <h2>ACP</h2>
        <p>The Agentic Commerce Protocol is a published checkout-intent format for an agent to hand a merchant what the person asked to buy. FindBuyAgent does not claim to speak it yet.</p>
      </section>
      <section id="visa-tap">
        <h2>Visa TAP</h2>
        <p>Visa’s Trusted Agent Protocol is the merchant-facing check described alongside Visa Intelligent Commerce: is this agent still inside the instruction it was given?</p>
        <p><a href="/blog/trusted-agent-protocol">Essay: Trusted Agent Protocol</a></p>
      </section>
      <section id="mastercard-agent-pay">
        <h2>Mastercard Agent Pay</h2>
        <p>Mastercard has described Agent Pay for Machines as a voucher inside a limit, in the same family as an x402 payment. This site does not settle those vouchers.</p>
        <p><a href="/blog/what-is-x402">Where the blog discusses it</a></p>
      </section>
    </Doc>
  );
}
