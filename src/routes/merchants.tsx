import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { docHead } from "@/components/pages/doc";
import { SiteShell } from "@/components/shell/site-shell";

const DevApp = lazy(() => import("@/components/findbuy/find-buy-app").then((mod) => ({ default: mod.FindBuyApp })));

export const Route = createFileRoute("/merchants")({
  head: () => docHead("Merchants | FindBuyAgent", "Live x402 merchants you can pay from your own wallet. Prices come from the public registries.", "/merchants"),
  component: Page,
});

function Page() {
  return (
    <SiteShell>
      <div className="wrap section">
        <h1>Merchants</h1>
        <p>Live x402 merchants from the public registries. Prices are whatever the merchant asks. Example data is labelled in the demo, not here.</p>
      </div>
      <Suspense fallback={<p className="wrap">Loading merchants…</p>}>
        <DevApp embedded />
      </Suspense>
    </SiteShell>
  );
}
