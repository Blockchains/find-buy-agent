import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { SiteShell } from "@/components/shell/site-shell";
import { HomePage } from "@/components/home/home-page";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  ORDERS_DESCRIPTION,
  ORDERS_TITLE,
  VAULT_DESCRIPTION,
  VAULT_TITLE,
  pageHead,
} from "@/content/seo";

const DevApp = lazy(() => import("@/components/findbuy/find-buy-app").then((mod) => ({ default: mod.FindBuyApp })));

type HomeSearch = { tab?: "vault" | "orders" };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const next: HomeSearch = {};
    if (search.tab === "vault" || search.tab === "orders") next.tab = search.tab;
    return next;
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
  const search = Route.useSearch();
  if (search.tab) {
    return (
      <Suspense fallback={<p className="site">Loading…</p>}>
        <DevApp initialTab={search.tab} />
      </Suspense>
    );
  }
  return (
    <SiteShell>
      <HomePage />
    </SiteShell>
  );
}
