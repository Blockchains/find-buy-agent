import { useMemo, useState } from "react";
import { COMPARE_ROWS, type CompareRow } from "@/content/compare";

const COLS: { key: keyof CompareRow; label: string }[] = [
  { key: "type", label: "Type" },
  { key: "rails", label: "Rails" },
  { key: "keys", label: "Who holds keys" },
  { key: "limits", label: "Spend limits" },
  { key: "approvals", label: "Approvals" },
  { key: "receipts", label: "Receipts" },
  { key: "reach", label: "Merchant reach" },
];

function Cell({ row, field }: { row: CompareRow; field: keyof CompareRow }) {
  const value = String(row[field]);
  return <td data-label={COLS.find((col) => col.key === field)?.label}>{value}</td>;
}

function Source({ row }: { row: CompareRow }) {
  return row.sourceUrl ? <a href={row.sourceUrl}>{row.sourceLabel}</a> : <span>{row.sourceLabel}</span>;
}

export function ComparePage() {
  const [selfCustody, setSelfCustody] = useState(false);
  const [crypto, setCrypto] = useState(false);
  const [limits, setLimits] = useState(false);
  const rows = useMemo(
    () => COMPARE_ROWS.filter((row) => (selfCustody ? row.selfCustody : true) && (crypto ? row.crypto : true) && (limits ? row.hasLimits : true)),
    [selfCustody, crypto, limits],
  );
  const ours = COMPARE_ROWS[0];
  return (
    <article className="wrap section">
      <p className="fine-note">Last reviewed: 1 Nov 2026</p>
      <h1>Agentic commerce, compared</h1>
      <p>Claims below are only the ones listed, each with its source. A cell without a published fact is —. This is not a ranking.</p>
      <div className="chip-row" role="group" aria-label="Filters">
        <Filter pressed={selfCustody} onClick={() => setSelfCustody((value) => !value)} label="Self-custody only" />
        <Filter pressed={crypto} onClick={() => setCrypto((value) => !value)} label="Crypto rails" />
        <Filter pressed={limits} onClick={() => setLimits((value) => !value)} label="Has spend limits" />
      </div>
      <article className="ui-card pin-card">
        <h2>{ours.product}</h2>
        <p>{ours.type}</p>
        <p>{ours.rails}</p>
        <p>Keys: {ours.keys}</p>
        <p>Limits: {ours.limits}</p>
        <p>Approvals: {ours.approvals}</p>
        <p>Receipts: {ours.receipts}</p>
        <p>Reach: {ours.reach}</p>
        <p>
          Source: <Source row={ours} />
        </p>
      </article>
      <div className="compare-scroll">
        <table className="ui-table compare-table">
          <thead>
            <tr>
              <th>Product</th>
              {COLS.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.product}>
                <th scope="row" data-label="Product">
                  {row.product}
                </th>
                {COLS.map((col) => (
                  <Cell key={col.key} row={row} field={col.key} />
                ))}
                <td data-label="Source">
                  <Source row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card-list compare-cards">
        {rows
          .filter((row) => row.product !== ours.product)
          .map((row) => (
            <article key={row.product} className="ui-card">
              <h2>{row.product}</h2>
              {COLS.map((col) => (
                <p key={col.key}>
                  <span className="fine-note">{col.label}. </span>
                  {String(row[col.key])}
                </p>
              ))}
              <p>
                Source: <Source row={row} />
              </p>
            </article>
          ))}
      </div>
      <p>Spot an error? Open an issue</p>
    </article>
  );
}

function Filter({ pressed, onClick, label }: { pressed: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" className="ui-btn secondary" aria-pressed={pressed} onClick={onClick}>
      {label}
    </button>
  );
}
