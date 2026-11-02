import { createFileRoute } from "@tanstack/react-router";
import { JsonLd } from "@/components/findbuy/shell";
import { WaitlistForm } from "@/components/pages/waitlist-form";
import { SiteShell } from "@/components/shell/site-shell";
import { ORIGIN, breadcrumbJsonLd, pageHead } from "@/content/seo";

const TITLE = "Pricing: Free Preview | FindBuyAgent";
const DESCRIPTION = "FindBuyAgent charges no fee during this preview. Network gas and the merchant price still apply. Future pricing will be announced first.";

export const Route = createFileRoute("/pricing")({
  head: () => {
    const head = pageHead({ title: TITLE, description: DESCRIPTION, path: "/pricing" });
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
        { name: "Pricing", path: "/pricing" },
      ]),
      {
        "@type": "WebPage",
        name: TITLE,
        description: DESCRIPTION,
        url: `${ORIGIN}/pricing`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  };
  return (
    <SiteShell>
      <JsonLd data={data} />
      <article className="wrap section">
        <h1>Pricing</h1>
        <article className="ui-card">
          <h2>Free</h2>
          <p>FindBuyAgent charges no fee. You pay the merchant’s listed USDC price. An EIP-3009 authorization is settled by the facilitator, so you do not send a separate gas transaction for that transfer.</p>
          <p>Future pricing will be announced before any fee applies.</p>
        </article>
        <h2>Tell me when that changes</h2>
        <WaitlistForm />
      </article>
    </SiteShell>
  );
}
