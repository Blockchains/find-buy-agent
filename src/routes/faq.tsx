import { createFileRoute } from "@tanstack/react-router";
import { Doc, docHead } from "@/components/pages/doc";

export const Route = createFileRoute("/faq")({
  head: () => docHead("FAQ | FindBuyAgent", "Keys, the demo, mandates, and declining a buy. No savings or return promises.", "/faq"),
  component: Page,
});

const QA = [
  ["Does FindBuyAgent hold my keys?", "No. There is no seed phrase field and no key import. Your wallet signs."],
  ["Does the demo move funds?", "The example stores do not. If you confirm the x402 testnet step, your wallet may sign a $0.01 Base Sepolia authorization. The demo does not submit it."],
  ["What gets saved in the browser?", "A public address, chain id, rules, signatures you already made, and demo receipts. Not a key."],
  ["What if a rule fails?", "The buy stops. The label says nothing was signed."],
  ["Is a lower price guaranteed?", "No. Example prices are examples. Live merchant prices are whatever that merchant asks at the time."],
];

function Page() {
  return (
    <Doc title="FAQ">
      {QA.map(([q, a]) => (
        <section key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </section>
      ))}
    </Doc>
  );
}
