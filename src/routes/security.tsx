import { createFileRoute, Link } from "@tanstack/react-router";
import { JsonLd } from "@/components/findbuy/shell";
import { SiteShell } from "@/components/shell/site-shell";
import { Callout, CodeBlock } from "@/components/ui/kit";
import { ORIGIN, breadcrumbJsonLd, pageHead } from "@/content/seo";

const TITLE = "Security: Keys, Signatures, Rules | FindBuyAgent";
const DESCRIPTION = "FindBuyAgent never holds keys or funds. You sign EIP-712 typed data in your wallet. Rules are checked before that signature.";

const TYPED = `{
  "primaryType": "TransferWithAuthorization",
  "domain": { "name": "USD Coin", "version": "2", "chainId": 8453 },
  "message": {
    "from": "<your address>",
    "to": "<merchant payTo>",
    "value": "<exact amount>",
    "validAfter": "<unix>",
    "validBefore": "<unix>",
    "nonce": "<random 32 bytes>"
  }
}`;

export const Route = createFileRoute("/security")({
  head: () => {
    const head = pageHead({ title: TITLE, description: DESCRIPTION, path: "/security" });
    return { meta: [...head.meta, { name: "robots", content: "index, follow, max-image-preview:large" }], links: head.links };
  },
  component: Page,
});

function Page() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "FindBuyAgent", path: "/" },
        { name: "Security", path: "/security" },
      ]),
      { "@type": "WebPage", name: TITLE, description: DESCRIPTION, url: `${ORIGIN}/security` },
    ],
  };
  return (
    <SiteShell>
      <JsonLd data={data} />
      <article className="wrap section">
        <h1>Security</h1>
        <section>
          <h2>Keys</h2>
          <p>Keys never enter this browser. FindBuyAgent does not ask for a seed phrase, and it cannot import or generate one.</p>
          <Callout tone="warn">If anyone claiming to be FindBuyAgent asks for a seed phrase, it is a scam.</Callout>
        </section>
        <section>
          <h2>What you sign</h2>
          <p>A payment is EIP-712 typed data shown by your wallet. For x402 that is an EIP-3009 transferWithAuthorization: an exact amount, a validBefore expiry, and a random nonce. You sign it only after you click Approve.</p>
          <CodeBlock text={TYPED} />
          <p>A mandate signature is a separate EIP-712 message. The copy on that button says it does not move funds and does not grant an on-chain allowance.</p>
        </section>
        <section>
          <h2>Where rules are enforced</h2>
          <p>Today, FindBuyAgent checks the active mandate in the app before it asks the wallet to sign. A blocked buy never opens a signature prompt. On-chain allowances (ERC-7715 / Base spend permissions) are on the roadmap. <Link to="/mandates">Open the mandate builder</Link>.</p>
        </section>
        <section>
          <h2>Data</h2>
          <p>Rules, the public address, signatures you already made, and receipts stay in localStorage on this browser. Export or clear them from <Link to="/receipts">Receipts</Link>. A purchase receipt is written only after a Base mainnet transaction hash comes back.</p>
        </section>
        <section>
          <h2>Disclosure</h2>
          <p>Spot an error? Open an issue</p>
        </section>
      </article>
    </SiteShell>
  );
}
