import { createFileRoute } from "@tanstack/react-router";
import { FindBuyApp } from "@/components/findbuy/find-buy-app";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  ORDERS_DESCRIPTION,
  ORDERS_TITLE,
  VAULT_DESCRIPTION,
  VAULT_TITLE,
  pageHead,
} from "@/content/seo";

type HomeSearch = { tab?: "vault" | "orders" };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    if (search.tab === "vault" || search.tab === "orders") return { tab: search.tab };
    return {};
  },
  head: ({ match }) => {
    const tab = (match.search as HomeSearch).tab;
    const page =
      tab === "vault"
        ? { title: VAULT_TITLE, description: VAULT_DESCRIPTION, path: "/?tab=vault" }
        : tab === "orders"
          ? { title: ORDERS_TITLE, description: ORDERS_DESCRIPTION, path: "/?tab=orders" }
          : { title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/" };
    const head = pageHead(page);
    return {
      meta: [...head.meta, { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" }],
      links: head.links,
    };
  },
  component: Home,
});

function Home() {
  const { tab } = Route.useSearch();
  return <FindBuyApp initialTab={tab ?? "shop"} />;
}
