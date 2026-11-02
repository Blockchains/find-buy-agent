import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Badge, Button, Callout, HashPill, Sheet } from "@/components/ui/kit";
import { chainName, ruleLabel, type Evaluation, type Mandate } from "@/lib/mandate";
import type { SpendOffer } from "@/lib/mandate";
import { recordAudit } from "@/lib/receipts";

export function ApprovalSheet({
  mandate,
  offer,
  verdict,
  onApprove,
  onDecline,
  onClose,
}: {
  mandate: Mandate;
  offer: SpendOffer;
  verdict: Evaluation;
  onApprove: () => void;
  onDecline: () => void;
  onClose: () => void;
}) {
  const ask = verdict.checks.find((check) => check.result === "ask");
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      new Notification("FindBuyAgent is waiting", { body: ask?.detail || "A buy needs your approval. Nothing has been signed." });
    } catch {
      /* the page is already showing the sheet */
    }
  }, [ask?.detail]);
  return (
    <Sheet title="Approve this buy?" onClose={onClose}>
      <p role="status">Why you're seeing this: {ask?.detail || ruleLabel(verdict.reason)}.</p>
      <table className="ui-table">
        <thead>
          <tr>
            <th>Check</th>
            <th>Requested</th>
            <th>Your rule</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-label="Check">Amount</td>
            <td data-label="Requested">{offer.amountUsd === null ? "Not in USD" : `$${offer.amountUsd}`}</td>
            <td data-label="Your rule">${mandate.perBuyUsd} per buy. Ask above ${mandate.askAboveUsd}.</td>
          </tr>
          <tr>
            <td data-label="Check">Window</td>
            <td data-label="Requested">This buy</td>
            <td data-label="Your rule">${mandate.window.amountUsd} per {mandate.window.period}</td>
          </tr>
          <tr>
            <td data-label="Check">Merchant</td>
            <td data-label="Requested">{offer.merchant || "Unknown"}</td>
            <td data-label="Your rule">{mandate.merchants.mode === "any" ? "Any merchant" : mandate.merchants.domains.join(", ") || "None yet"}</td>
          </tr>
          <tr>
            <td data-label="Check">Chain</td>
            <td data-label="Requested">{chainName(offer.chainId)}</td>
            <td data-label="Your rule">{mandate.chains.map(chainName).join(", ")}</td>
          </tr>
          <tr>
            <td data-label="Check">Asset</td>
            <td data-label="Requested">{offer.asset}</td>
            <td data-label="Your rule">{mandate.assets.join(", ")}</td>
          </tr>
          <tr>
            <td data-label="Check">Payee</td>
            <td data-label="Requested">{offer.payTo ? <HashPill value={offer.payTo} /> : "None"}</td>
            <td data-label="Your rule">{mandate.payees.length ? mandate.payees.length : "Any payee"}</td>
          </tr>
          <tr>
            <td data-label="Check">Expiry</td>
            <td data-label="Requested">This signature</td>
            <td data-label="Your rule">{new Date(mandate.expiresAt).toLocaleDateString()}</td>
          </tr>
        </tbody>
      </table>
      <p>
        <Badge status="ask">{offer.item || "Buy"}</Badge> {offer.merchant}
      </p>
      <div className="cta-row">
        <Button
          onClick={() => {
            onApprove();
          }}
        >
          Approve & sign
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            recordAudit({ mandate, offer, status: "declined", checks: verdict.checks });
            onDecline();
          }}
        >
          Decline
        </Button>
        <Link className="ui-btn ghost" to="/mandates" search={{ raise: offer.merchant || undefined }}>
          Raise cap for this merchant…
        </Link>
      </div>
      <p className="fine-note">Decline writes an audit note. Nothing was signed.</p>
    </Sheet>
  );
}

export function BlockedCard({ verdict }: { verdict: Evaluation }) {
  const failed = verdict.checks.find((check) => check.result === "fail");
  return (
    <Callout tone="warn">
      <span role="alert">Blocked by {ruleLabel(verdict.reason)}. Nothing was signed.</span>
      {failed ? ` ${failed.detail}` : ""}
    </Callout>
  );
}

export function enableApprovalNotifications() {
  if (typeof Notification === "undefined") return;
  void Notification.requestPermission();
}
