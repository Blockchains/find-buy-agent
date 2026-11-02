import { createFileRoute } from "@tanstack/react-router";
import { Doc, docHead } from "@/components/pages/doc";

export const Route = createFileRoute("/security")({
  head: () => docHead("Security | FindBuyAgent", "FindBuyAgent never holds your keys or funds. Signing uses your injected wallet.", "/security"),
  component: Page,
});

function Page() {
  return (
    <Doc title="Security">
      <p>
        In this preview, spending rules are enforced by FindBuyAgent before it asks your wallet to sign. Your wallet always shows the exact amount, and you can refuse. On-chain allowances (ERC-7715 / Base spend permissions) are on the roadmap. A purchase receipt is stored in this browser only after a Base mainnet transaction hash comes back.
      </p>
      <ul>
        <li>Wallets are discovered with EIP-6963, or the injected EIP-1193 provider if that is all the browser has.</li>
        <li>The only wallet data kept here is public: address, chain id, rules, signatures, and receipts.</li>
        <li>A seed phrase is never requested, generated, imported, or stored.</li>
        <li>Example merchants in the demo cannot be signed for. The testnet path asks before it signs, and it does not broadcast.</li>
      </ul>
    </Doc>
  );
}
