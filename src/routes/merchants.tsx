import { createFileRoute } from "@tanstack/react-router";
import { JsonLd } from "@/components/findbuy/shell";
import { MerchantsPage } from "@/components/pages/merchants-page";
import { SiteShell } from "@/components/shell/site-shell";
import { ORIGIN, breadcrumbJsonLd, pageHead } from "@/content/seo";

const TITLE = "Accept Agent Payments with x402 | FindBuyAgent Merchants";
const DESCRIPTION = "Return HTTP 402 on Base, or keep ACP checkout. A read-only 402 check and the live CDP Bazaar list. Nothing on this page pays.";

export const Route = createFileRoute("/merchants")({
  head: () => {
    const head = pageHead({ title: TITLE, description: DESCRIPTION, path: "/merchants" });
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
        { name: "Merchants", path: "/merchants" },
      ]),
      {
        "@type": "TechArticle",
        headline: "Let agents buy from you with x402, and keep your checkout.",
        description: DESCRIPTION,
        dateModified: "2026-11-02",
        url: `${ORIGIN}/merchants`,
        author: { "@type": "Organization", name: "FindBuyAgent", url: `${ORIGIN}/` },
      },
      {
        "@type": "HowTo",
        name: "Accept an x402 payment",
        step: [
          { "@type": "HowToStep", position: 1, text: "Answer an unpaid GET with HTTP 402 and an accepts object on Base mainnet." },
          { "@type": "HowToStep", position: 2, text: "Put your own payTo address, USDC asset, amount, and network eip155:8453 in accepts." },
          { "@type": "HowToStep", position: 3, text: "On the retry, give the payment header to a facilitator and return 200 only after settlement." },
        ],
      },
    ],
  };
  return (
    <SiteShell>
      <JsonLd data={data} />
      <MerchantsPage />
    </SiteShell>
  );
}
