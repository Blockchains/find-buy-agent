import { createFileRoute } from "@tanstack/react-router";
import { FiatDesk } from "@/components/fiat/desk";
import { SiteShell } from "@/components/shell/site-shell";
import { pageHead } from "@/content/seo";

const TITLE = "FIAT Agent: You Authorise the Payment | FindBuyAgent";
const DESCRIPTION = "The agent finds it under your cap. You authorise the payment on the store’s own page. FindBuyAgent never sees your card.";

type FiatSearch = { q?: string };

export const Route = createFileRoute("/fiat")({
  validateSearch: (search: Record<string, unknown>): FiatSearch => {
    const q = typeof search.q === "string" ? search.q.trim().slice(0, 180) : "";
    return q ? { q } : {};
  },
  head: () => {
    const head = pageHead({ title: TITLE, description: DESCRIPTION, path: "/fiat" });
    return { meta: [...head.meta, { name: "robots", content: "index, follow, max-image-preview:large" }], links: head.links };
  },
  component: Page,
});

function Page() {
  const { q } = Route.useSearch();
  return (
    <SiteShell>
      <div className="wrap fiat-page">
        <p className="fine-note">FIAT</p>
        <h1>Tell it what to find. You authorise the payment.</h1>
        <p className="lede">It checks the stores, against your cap and your note. The last screen is the only one that spends, and the store takes the payment. No card is entered here.</p>
        <FiatDesk initialQuery={q ?? ""} />
      </div>
    </SiteShell>
  );
}