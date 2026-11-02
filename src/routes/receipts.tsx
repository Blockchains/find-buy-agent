import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { JsonLd } from "@/components/findbuy/shell";
import { WindowWarning } from "@/components/mandate/window-warning";
import { SiteShell } from "@/components/shell/site-shell";
import { Badge, Button, EmptyState, Field, HashPill, Sheet } from "@/components/ui/kit";
import { ORIGIN, pageHead } from "@/content/seo";
import { activeMandate, chainName, ruleLabel, spentInWindow, type Mandate } from "@/lib/mandate";
import {
  clearReceipts,
  loadReceipts,
  receiptsCsv,
  receiptsJson,
  txUrl,
  verifyChain,
  type Receipt,
  type ReceiptStatus,
} from "@/lib/receipts";

const TITLE = "Agent Purchase Receipts & Audit Trail | FindBuyAgent";
const DESCRIPTION = "Receipts stay in this browser. A purchase receipt is written only after a Base mainnet transaction hash comes back.";

type ReceiptSearch = { id?: string };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FindBuyAgent Receipts",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  url: `${ORIGIN}/receipts`,
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export const Route = createFileRoute("/receipts")({
  validateSearch: (search: Record<string, unknown>): ReceiptSearch => ({
    id: typeof search.id === "string" ? search.id.slice(0, 80) : undefined,
  }),
  head: ({ match }) => {
    const id = (match.search as ReceiptSearch).id;
    const head = pageHead({ title: TITLE, description: DESCRIPTION, path: id ? `/receipts?id=${encodeURIComponent(id)}` : "/receipts" });
    return {
      meta: [...head.meta, { name: "robots", content: id ? "noindex, follow" : "index, follow, max-image-preview:large" }],
      links: head.links,
    };
  },
  component: Page,
});

function when(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `${date.toLocaleString(undefined, { timeZoneName: "short" })} · ${zone}`;
}

function badge(status: ReceiptStatus): "go" | "ask" | "stop" | "info" {
  if (status === "settled" || status === "signed") return "go";
  if (status === "declined") return "ask";
  return "stop";
}

function Page() {
  const search = Route.useSearch();
  const [rows, setRows] = useState<Receipt[]>([]);
  const [status, setStatus] = useState("all");
  const [merchant, setMerchant] = useState("all");
  const [chain, setChain] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [mandate, setMandate] = useState<Mandate | null>(null);

  useEffect(() => {
    const read = () => {
      setRows(loadReceipts());
      setMandate(activeMandate());
    };
    read();
    window.addEventListener("fba-receipts", read);
    return () => window.removeEventListener("fba-receipts", read);
  }, []);

  const spent = mandate ? spentInWindow(mandate, rows) : 0;
  const cap = mandate?.window.amountUsd ?? 0;
  const chainState = verifyChain(rows);
  const merchants = [...new Set(rows.map((row) => row.merchant).filter(Boolean))];
  const chains = [...new Set(rows.map((row) => row.chainId))];
  const filtered = useMemo(
    () =>
      rows
        .slice()
        .reverse()
        .filter((row) => (status === "all" ? true : row.status === status))
        .filter((row) => (merchant === "all" ? true : row.merchant === merchant))
        .filter((row) => (chain === "all" ? true : String(row.chainId) === chain))
        .filter((row) => (from ? row.createdAt.slice(0, 10) >= from : true))
        .filter((row) => (to ? row.createdAt.slice(0, 10) <= to : true))
        .filter((row) => {
          const hay = `${row.item} ${row.merchant} ${row.txHash ?? ""} ${row.status}`.toLowerCase();
          return hay.includes(query.trim().toLowerCase());
        }),
    [rows, status, merchant, chain, from, to, query],
  );
  const open = rows.find((row) => row.id === search.id);
  const approved = rows.filter((row) => row.status === "settled" || row.status === "signed").length;
  const declined = rows.filter((row) => row.status === "declined").length;
  const blocked = rows.filter((row) => row.status === "blocked").length;

  const download = (filename: string, text: string, type: string) => {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SiteShell>
      <JsonLd data={jsonLd} />
      <article className="wrap section">
        <h1>Receipts and audit trail</h1>
        <p>Receipts are stored in this browser only. A purchase receipt is written only after a Base mainnet transaction hash comes back.</p>
        <WindowWarning />
        <div className="summary-bar" aria-live="polite">
          <div>
            <strong>
              ${spent.toFixed(2)} / ${cap.toFixed(2)}
            </strong>
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={cap} aria-valuenow={spent} aria-label="Spent this window">
              <span style={{ width: `${cap > 0 ? Math.min(100, (spent / cap) * 100) : 0}%` }} />
            </div>
            <p className="fine-note">Spent this {mandate?.window.period ?? "window"} against the active cap. Counts settled receipts only.</p>
          </div>
          <p>{approved} approved</p>
          <p>{declined} declined</p>
          <p>{blocked} blocked</p>
          <p role="status">{chainState.ok ? "Chain intact ✓" : `Tampered ✕ at #${chainState.index + 1}`}</p>
        </div>
        <div className="filters">
          <Field label="Status">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All</option>
              <option value="settled">Settled</option>
              <option value="declined">Declined</option>
              <option value="blocked">Blocked</option>
            </select>
          </Field>
          <Field label="Merchant">
            <select value={merchant} onChange={(event) => setMerchant(event.target.value)}>
              <option value="all">All</option>
              {merchants.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Chain">
            <select value={chain} onChange={(event) => setChain(event.target.value)}>
              <option value="all">All</option>
              {chains.map((item) => (
                <option key={item} value={item}>
                  {chainName(item)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="From">
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label="To">
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </Field>
          <Field label="Search">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Item, merchant, or hash" />
          </Field>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No receipts yet">No receipts yet. A receipt appears after a Base mainnet transaction hash comes back.</EmptyState>
        ) : (
          <table className="ui-table audit-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Item</th>
                <th>Merchant</th>
                <th>Amount</th>
                <th>Chain</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td data-label="Status">
                    <Badge status={badge(row.status)}>{row.status}</Badge>
                  </td>
                  <td data-label="Item">
                    <Link to="/receipts" search={{ id: row.id }}>
                      {row.item}
                    </Link>
                  </td>
                  <td data-label="Merchant">{row.merchant}</td>
                  <td data-label="Amount">${row.amountUsd}</td>
                  <td data-label="Chain">{chainName(row.chainId)}</td>
                  <td data-label="Time">
                    <time dateTime={row.createdAt}>{when(row.createdAt)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="cta-row">
          <Button variant="secondary" onClick={() => download("findbuyagent-receipts.json", receiptsJson(rows), "application/json")}>
            Export JSON
          </Button>
          <Button variant="secondary" onClick={() => download("findbuyagent-receipts.csv", receiptsCsv(rows), "text/csv")}>
            Export CSV
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm("Clear receipts stored in this browser?")) clearReceipts();
            }}
          >
            Clear local data
          </Button>
        </div>
      </article>
      {open ? (
        <Sheet title={open.item} onClose={() => window.history.back()}>
          <Badge status={badge(open.status)}>{open.status}</Badge>
          <dl className="detail-list">
            <div>
              <dt>Merchant</dt>
              <dd>{open.merchant}</dd>
            </div>
            <div>
              <dt>Merchant of record</dt>
              <dd>{open.merchantOfRecord}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>
                ${open.amountUsd} {open.asset}
              </dd>
            </div>
            <div>
              <dt>Chain</dt>
              <dd>{chainName(open.chainId)}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{when(open.createdAt)}</dd>
            </div>
            <div>
              <dt>Mandate</dt>
              <dd>
                <Link to="/mandates">{open.mandateId}</Link>
              </dd>
            </div>
            {open.payTo ? (
              <div>
                <dt>Payee</dt>
                <dd>
                  <HashPill value={open.payTo} />
                </dd>
              </div>
            ) : null}
            {open.authorizationNonce ? (
              <div>
                <dt>Nonce</dt>
                <dd>
                  <HashPill value={open.authorizationNonce} />
                </dd>
              </div>
            ) : null}
            {open.signature ? (
              <div>
                <dt>Signature</dt>
                <dd>
                  <HashPill value={open.signature} />
                </dd>
              </div>
            ) : null}
            {open.txHash ? (
              <div>
                <dt>Transaction</dt>
                <dd>
                  <HashPill value={open.txHash} href={txUrl(open.chainId, open.txHash)} />
                </dd>
              </div>
            ) : null}
          </dl>
          <h2>Rules</h2>
          <ul className="check-list">
            {open.checks.map((check) => (
              <li key={`${check.rule}-${check.detail}`}>
                <Badge status={check.result === "pass" ? "go" : check.result === "ask" ? "ask" : "stop"}>{check.result}</Badge> {ruleLabel(check.rule)}. {check.detail}
              </li>
            ))}
          </ul>
          <p role="status">{chainState.ok ? "Chain intact ✓" : `Tampered ✕ at #${chainState.index + 1}`}</p>
          <p className="fine-note">Hash {open.hash}</p>
        </Sheet>
      ) : null}
    </SiteShell>
  );
}
