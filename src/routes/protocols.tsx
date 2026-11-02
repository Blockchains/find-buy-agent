import { createFileRoute } from "@tanstack/react-router";
import { JsonLd } from "@/components/findbuy/shell";
import { ProtocolsPage, PROTOCOL_FAQS } from "@/components/pages/protocols-page";
import { SiteShell } from "@/components/shell/site-shell";
import { ORIGIN, breadcrumbJsonLd, pageHead } from "@/content/seo";

const TITLE = "x402 vs AP2 vs ACP: Agent Payment Protocols | FindBuyAgent";
const DESCRIPTION = "How x402, AP2, ACP, Visa TAP, and Mastercard Agent Pay split identity, checkout, and settlement. Sources are linked.";

export const Route = createFileRoute("/protocols")({
  head: () => {
    const head = pageHead({ title: TITLE, description: DESCRIPTION, path: "/protocols" });
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
        { name: "Protocols", path: "/protocols" },
      ]),
      {
        "@type": "TechArticle",
        headline: TITLE,
        description: DESCRIPTION,
        datePublished: "2026-11-01",
        dateModified: "2026-11-02",
        url: `${ORIGIN}/protocols`,
        author: { "@type": "Organization", name: "FindBuyAgent", url: `${ORIGIN}/` },
      },
      {
        "@type": "FAQPage",
        mainEntity: PROTOCOL_FAQS.map(([name, text]) => ({
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
      <ProtocolsPage />
    </SiteShell>
  );
}
