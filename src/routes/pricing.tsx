import { createFileRoute } from "@tanstack/react-router";
import { Doc, docHead } from "@/components/pages/doc";

export const Route = createFileRoute("/pricing")({
  head: () => docHead("Pricing | FindBuyAgent", "FindBuyAgent does not charge a subscription. You pay merchants from your own wallet.", "/pricing"),
  component: Page,
});

function Page() {
  return (
    <Doc title="Pricing">
      <p>FindBuyAgent does not charge a subscription. You pay a merchant, if you choose to, from your own wallet at the price that merchant asks.</p>
      <p>The demo is free because it does not buy anything.</p>
    </Doc>
  );
}
