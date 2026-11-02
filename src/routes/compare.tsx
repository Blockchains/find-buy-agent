import { createFileRoute } from "@tanstack/react-router";
import { JsonLd } from "@/components/findbuy/shell";
import { ComparePage } from "@/components/pages/compare-page";
import { SiteShell } from "@/components/shell/site-shell";
import { COMPARE_ROWS } from "@/content/compare";
import { ORIGIN, breadcrumbJsonLd, pageHead } from "@/content/seo";

const TITLE = "Agentic Commerce Comparison: Wallets & Checkout | FindBuyAgent";
const DESCRIPTION = "A sourced matrix of agent checkout and wallets: rails, keys, limits, and approvals. Unsourced cells stay blank.";

export const Route = createFileRoute("/compare")({
  head: () => {
    const head = pageHead({ title: TITLE, description: DESCRIPTION, path: "/compare" });
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
        { name: "Compare", path: "/compare" },
      ]),
      {
        "@type": "Article",
        headline: TITLE,
        description: DESCRIPTION,
        datePublished: "2026-11-01",
        dateModified: "2026-11-02",
        url: `${ORIGIN}/compare`,
        author: { "@type": "Organization", name: "FindBuyAgent", url: `${ORIGIN}/` },
        citation: COMPARE_ROWS.map((row) => row.sourceUrl).filter(Boolean),
      },
    ],
  };
  return (
    <SiteShell>
      <JsonLd data={data} />
      <ComparePage />
    </SiteShell>
  );
}
