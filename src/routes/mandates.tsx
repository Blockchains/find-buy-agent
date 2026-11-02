import { createFileRoute } from "@tanstack/react-router";
import { JsonLd } from "@/components/findbuy/shell";
import { MandateBuilder } from "@/components/mandate/builder";
import { SiteShell } from "@/components/shell/site-shell";
import { ORIGIN, pageHead } from "@/content/seo";

const TITLE = "Agent Spending Mandate Builder | FindBuyAgent";
const DESCRIPTION = "Set per-buy and window caps, merchants, chains, and USDC before a wallet signs. Signing records rules and does not move funds.";

type MandateSearch = { selftest?: 1; raise?: string };

const howto = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "FindBuyAgent Mandate Builder",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: `${ORIGIN}/mandates`,
      description: DESCRIPTION,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "HowTo",
      name: "Set a FindBuyAgent spending mandate",
      description: DESCRIPTION,
      step: [
        "Choose suggest only, ask every time, or auto inside rules.",
        "Set the per-buy cap.",
        "Set the day, week, or month window.",
        "Set the ask-first threshold.",
        "Allow merchant domains, or any merchant.",
        "Optionally allow x402 payee addresses.",
        "Choose chains. USDC is the asset.",
        "Block categories and set an expiry.",
        "Read the plain-English mandate. Sign only if you want an off-chain record of the rules.",
      ].map((text, index) => ({ "@type": "HowToStep", position: index + 1, text })),
    },
  ],
};

export const Route = createFileRoute("/mandates")({
  validateSearch: (search: Record<string, unknown>): MandateSearch => {
    const next: MandateSearch = {};
    if (search.selftest === 1 || search.selftest === "1") next.selftest = 1;
    if (typeof search.raise === "string") next.raise = search.raise.slice(0, 80);
    return next;
  },
  head: () => {
    const head = pageHead({ title: TITLE, description: DESCRIPTION, path: "/mandates" });
    return {
      meta: [...head.meta, { name: "robots", content: "index, follow, max-image-preview:large" }],
      links: head.links,
    };
  },
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  return (
    <SiteShell>
      <JsonLd data={howto} />
      <article className="wrap section">
        <h1>Agent spending mandate</h1>
        <p>One active mandate. The wallet still shows the exact amount, and you can refuse.</p>
        <MandateBuilder selftest={search.selftest === 1} raise={search.raise ?? ""} />
      </article>
    </SiteShell>
  );
}
