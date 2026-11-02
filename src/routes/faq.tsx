import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { JsonLd } from "@/components/findbuy/shell";
import { SiteShell } from "@/components/shell/site-shell";
import { ORIGIN, breadcrumbJsonLd, pageHead } from "@/content/seo";

const TITLE = "FAQ: Mandates, x402, Receipts | FindBuyAgent";
const DESCRIPTION = "Keys, x402, mandates, chains, and what happens when you decline. FindBuyAgent does not hold funds.";

const QA = [
  ["Does FindBuyAgent hold my money?", "No. USDC stays in your wallet until you sign an exact transfer. This site cannot move it."],
  ["Does FindBuyAgent hold my keys?", "No. There is no seed phrase field and no key import. Your wallet signs."],
  ["What is x402?", "A way for a server to answer HTTP 402 with an exact USDC price. Your wallet signs that amount. A facilitator settles it."],
  ["Is this live?", "Yes, for x402 resources your wallet can settle. A purchase receipt is saved only after a Base mainnet transaction hash comes back."],
  ["What is a mandate?", "Rules checked before a signature: mode, a per-buy cap, a time window, merchant and payee allowlists, chains, and blocked categories."],
  ["Can the agent raise its own limits?", "No. Only you can change them, in the mandate builder. Nothing is raised silently."],
  ["What chains can I pay on?", "Base, Polygon, Arbitrum, Optimism, Ethereum, Avalanche, and BNB, in USDC, when the merchant accepts that chain. Receipts are recorded for Base mainnet transaction hashes."],
  ["What happens if I decline?", "Nothing is signed. Decline can leave a local audit note. No transfer is created."],
  ["Where are receipts stored?", "In this browser only. You can export or clear them. They are not a bank record."],
  ["How is this different from ChatGPT shopping?", "You hold the key, you set standing rules, and a receipt is a hash you can check. ChatGPT commerce uses a delegated card token and an in-chat confirm. See the comparison."],
];

export const Route = createFileRoute("/faq")({
  head: () => {
    const head = pageHead({ title: TITLE, description: DESCRIPTION, path: "/faq" });
    return { meta: [...head.meta, { name: "robots", content: "index, follow, max-image-preview:large" }], links: head.links };
  },
  component: Page,
});

function Page() {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QA;
    return QA.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(q));
  }, [query]);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "FindBuyAgent", path: "/" },
        { name: "FAQ", path: "/faq" },
      ]),
      {
        "@type": "FAQPage",
        url: `${ORIGIN}/faq`,
        mainEntity: QA.map(([name, text]) => ({
          "@type": "Question",
          name,
          acceptedAnswer: { "@type": "Answer", text },
        })),
      },
    ],
  };
  return (
    <SiteShell>
      <JsonLd data={data} />
      <article className="wrap section">
        <h1>FAQ</h1>
        <label className="ui-field">
          <span className="sr">Search questions</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions" />
        </label>
        <div className="faq-list">
        {shown.map(([question, answer]) => (
          <section key={question} id={question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}>
            <h2>{question}</h2>
            <p>{answer}</p>
          </section>
        ))}
        </div>
        {shown.length === 0 ? <p role="status">No question matches that.</p> : null}
        <p>
          <Link to="/compare">Compare</Link>
          {" · "}
          <Link to="/security">Security</Link>
        </p>
      </article>
    </SiteShell>
  );
}
