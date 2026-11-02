import { createFileRoute } from "@tanstack/react-router";
import { Doc, docHead } from "@/components/pages/doc";

export const Route = createFileRoute("/compare")({
  head: () => docHead("Compare custody | FindBuyAgent", "Who holds keys, where limits live, and who can change them. A generic comparison, not a ranking of brands.", "/compare"),
  component: Page,
});

function Page() {
  return (
    <Doc title="Compare">
      <table className="ui-table">
        <thead>
          <tr>
            <th></th>
            <th>Custodial agent wallet</th>
            <th>Card token</th>
            <th>FindBuyAgent (your wallet)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-label="Question">Who holds keys</td>
            <td data-label="Custodial">The service</td>
            <td data-label="Card token">The issuer holds the card credential</td>
            <td data-label="FindBuyAgent">You</td>
          </tr>
          <tr>
            <td data-label="Question">Where limits are enforced</td>
            <td data-label="Custodial">In the service</td>
            <td data-label="Card token">On the token, if a mandate exists</td>
            <td data-label="FindBuyAgent">In your rules, then in your signature</td>
          </tr>
          <tr>
            <td data-label="Question">Who can change limits</td>
            <td data-label="Custodial">The service</td>
            <td data-label="Card token">You and the issuer</td>
            <td data-label="FindBuyAgent">You, with a new signature</td>
          </tr>
        </tbody>
      </table>
    </Doc>
  );
}
