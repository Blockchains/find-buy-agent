import { createFileRoute } from "@tanstack/react-router";
import { FindBuyApp } from "@/components/findbuy/find-buy-app";
import { JsonLd } from "@/components/findbuy/shell";
import { HOME_DESCRIPTION, HOME_TITLE, ORIGIN, homeJsonLd } from "@/content/seo";

type HomeSearch = { tab?: "vault" | "orders" };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    if (search.tab === "vault" || search.tab === "orders") return { tab: search.tab };
    return {};
  },
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
    ],
    links: [{ rel: "canonical", href: `${ORIGIN}/` }],
  }),
  component: Home,
});

function Home() {
  const { tab } = Route.useSearch();
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <FindBuyApp initialTab={tab ?? "shop"} />
    </>
  );
}
