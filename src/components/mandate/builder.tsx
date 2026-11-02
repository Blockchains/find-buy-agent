import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge, Button, Callout, CodeBlock, Field, Slider, Toggle } from "@/components/ui/kit";
import { enableApprovalNotifications } from "@/components/mandate/approval-sheet";
import { WindowWarning } from "@/components/mandate/window-warning";
import { runMandateSelfTest } from "@/lib/mandate-selftest";
import {
  MANDATE_CHAINS,
  blankMandate,
  chainName,
  loadMandates,
  mandateDigest,
  mandateSignPayload,
  normalizeDomain,
  parseMandateImport,
  plainEnglish,
  saveMandates,
  setActiveMandate,
  upsertMandate,
  validPayee,
  type Mandate,
  type MandateMode,
} from "@/lib/mandate";
import { connectWallet, ethereumProvider } from "@/lib/market/wallet";

const MODES: { id: MandateMode; title: string; body: string }[] = [
  { id: "suggest", title: "Suggest only", body: "Finds and compares. Never pays." },
  { id: "ask", title: "Ask every time", body: "Every buy waits for you, inside the caps." },
  { id: "auto", title: "Auto inside rules", body: "Pays only inside the caps below. Anything else waits for you." },
];

const CATEGORIES = ["gift cards", "crypto", "alcohol"];

function SelfTest({ checks }: { checks: { name: string; pass: boolean; detail: string }[] }) {
  return (
    <section aria-live="polite">
      <h2>Self-test</h2>
      <ul className="check-list">
        {checks.map((item) => (
          <li key={item.name}>
            <Badge status={item.pass ? "go" : "stop"}>{item.pass ? "Pass" : "Fail"}</Badge> {item.name}
            <span className="fine-note"> {item.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function patchSigned(current: Mandate, partial: Partial<Mandate>): Mandate {
  return { ...current, ...partial, owner: undefined, signature: undefined, digest: undefined };
}

export function MandateBuilder({ selftest = false, raise = "" }: { selftest?: boolean; raise?: string }) {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState<Mandate | null>(null);
  const [domain, setDomain] = useState("");
  const [payee, setPayee] = useState("");
  const [category, setCategory] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const checks = selftest ? runMandateSelfTest() : [];

  useEffect(() => {
    const store = loadMandates();
    setMandates(store.mandates);
    setActiveId(store.activeId);
    const current = store.mandates.find((item) => item.id === store.activeId) ?? store.mandates[0];
    const host = normalizeDomain(raise);
    if (host && current && !current.merchants.domains.includes(host)) {
      setDraft({
        ...current,
        merchants: { mode: "allowlist", domains: [...current.merchants.domains, host] },
        owner: undefined,
        signature: undefined,
        digest: undefined,
      });
      setNotice(`${host} is in the form only. Save to keep it. Rules were not changed yet.`);
      return;
    }
    setDraft(current);
  }, [raise]);

  if (!draft) {
    return (
      <div className="mandate">
        {selftest ? <SelfTest checks={checks} /> : null}
        <p>Loading mandate…</p>
      </div>
    );
  }

  const refresh = (next = loadMandates()) => {
    setMandates(next.mandates);
    setActiveId(next.activeId);
  };

  const update = (partial: Partial<Mandate>) => {
    setDraft((current) => (current ? patchSigned(current, partial) : current));
    setNotice("");
  };

  const save = () => {
    const next = upsertMandate(draft, draft.id === activeId || mandates.length === 0);
    refresh(next);
    setNotice("Saved in this browser.");
  };

  const sign = async () => {
    setError("");
    try {
      const wallet = await connectWallet();
      const chainId = Number(wallet.chainId.startsWith("0x") ? BigInt(wallet.chainId) : wallet.chainId);
      const provider = ethereumProvider();
      if (!provider) throw new Error("No wallet is connected.");
      const digest = mandateDigest(draft, chainId);
      const signature = (await provider.request({
        method: "eth_signTypedData_v4",
        params: [wallet.address, mandateSignPayload(draft, chainId)],
      })) as string;
      if (!signature) throw new Error("The wallet did not return a signature.");
      const signed = { ...draft, owner: wallet.address, signature, digest };
      setDraft(signed);
      refresh(upsertMandate(signed, signed.id === activeId));
      setNotice("Signing records your rules. It does not move funds or grant an on-chain allowance.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The wallet did not sign.");
    }
  };

  return (
    <div className="mandate">
      {selftest ? <SelfTest checks={checks} /> : null}
      <div className="mandate-list">
        {mandates.map((item) => (
          <article key={item.id} className="ui-card">
            <button type="button" className="text-button" onClick={() => setDraft(item)}>
              <strong>{item.name}</strong>
            </button>
            <p>{item.mode === "suggest" ? "Suggest only" : item.mode === "ask" ? "Ask every time" : "Auto inside rules"}</p>
            {item.revokedAt ? <Badge status="stop">Revoked</Badge> : null}
            {item.signature ? <Badge status="go">Signed by {item.owner?.slice(0, 6)}…{item.owner?.slice(-4)}</Badge> : null}
            <Toggle
              pressed={item.id === activeId && !item.revokedAt}
              label={item.id === activeId ? "Active" : "Make active"}
              onToggle={() => {
                refresh(setActiveMandate(item.id));
                setNotice("One mandate is active at a time.");
              }}
            />
          </article>
        ))}
        <Button
          variant="secondary"
          onClick={() => {
            const created = blankMandate({ name: "New mandate" });
            setDraft(created);
            setNotice("Not saved yet.");
          }}
        >
          New mandate
        </Button>
      </div>
      <div className="mandate-layout">
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <WindowWarning />
          <Field label="Name">
            <input value={draft.name} maxLength={80} onChange={(event) => update({ name: event.target.value })} />
          </Field>
          <div className="mode-cards" role="radiogroup" aria-label="Mode">
            {MODES.map((mode, index) => (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={draft.mode === mode.id}
                className={draft.mode === mode.id ? "is-on" : ""}
                onClick={() => update({ mode: mode.id })}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                  event.preventDefault();
                  const next = event.key === "ArrowRight" ? (index + 1) % MODES.length : (index + MODES.length - 1) % MODES.length;
                  update({ mode: MODES[next].id });
                }}
              >
                <strong>{mode.title}</strong>
                <span>{mode.body}</span>
              </button>
            ))}
          </div>
          <Slider label="Per buy (USD)" min={1} max={500} value={draft.perBuyUsd} onChange={(perBuyUsd) => update({ perBuyUsd })} />
          <div className="chip-row">
            {[5, 20, 50, 100].map((value) => (
              <Button key={value} type="button" variant="ghost" onClick={() => update({ perBuyUsd: value })}>
                ${value}
              </Button>
            ))}
          </div>
          <Slider
            label={`Window (USD per ${draft.window.period})`}
            min={1}
            max={2000}
            value={draft.window.amountUsd}
            onChange={(amountUsd) => update({ window: { ...draft.window, amountUsd } })}
          />
          <div className="chip-row" role="group" aria-label="Window period">
            {(["day", "week", "month"] as const).map((period) => (
              <Button key={period} type="button" variant={draft.window.period === period ? "primary" : "ghost"} onClick={() => update({ window: { ...draft.window, period } })}>
                {period}
              </Button>
            ))}
            {[20, 50, 200].map((value) => (
              <Button key={value} type="button" variant="ghost" onClick={() => update({ window: { ...draft.window, amountUsd: value } })}>
                ${value}
              </Button>
            ))}
          </div>
          <Slider label="Ask first above (USD)" min={0} max={500} value={draft.askAboveUsd} onChange={(askAboveUsd) => update({ askAboveUsd })} />
          <Toggle
            pressed={draft.merchants.mode === "any"}
            label="Any merchant"
            onToggle={(next) => update({ merchants: { ...draft.merchants, mode: next ? "any" : "allowlist" } })}
          />
          {draft.merchants.mode === "any" ? <Callout tone="warn">Any merchant can be paid, up to your caps. An allowlist is tighter.</Callout> : null}
          <Field label="Allow a domain">
            <input value={domain} placeholder="amazon.com" onChange={(event) => setDomain(event.target.value)} />
          </Field>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const host = normalizeDomain(domain);
              if (!host) {
                setError("Enter a hostname such as amazon.com.");
                return;
              }
              setError("");
              update({ merchants: { mode: "allowlist", domains: [...new Set([...draft.merchants.domains, host])] } });
              setDomain("");
            }}
          >
            Add domain
          </Button>
          <div className="chip-row">
            {draft.merchants.domains.map((host) => (
              <button
                key={host}
                type="button"
                className="ui-chip"
                onClick={() => update({ merchants: { ...draft.merchants, domains: draft.merchants.domains.filter((item) => item !== host) } })}
              >
                {host} ×
              </button>
            ))}
          </div>
          <Field label="x402 payee (optional)">
            <input value={payee} placeholder="0x…" onChange={(event) => setPayee(event.target.value)} />
          </Field>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!validPayee(payee)) {
                setError("That is not a checksummed 0x address. Lowercase is accepted.");
                return;
              }
              setError("");
              update({ payees: [...new Set([...draft.payees, payee])] });
              setPayee("");
            }}
          >
            Add payee
          </Button>
          <div className="chip-row">
            {draft.payees.map((item) => (
              <button key={item} type="button" className="ui-chip" onClick={() => update({ payees: draft.payees.filter((pay) => pay !== item) })}>
                {item.slice(0, 6)}…{item.slice(-4)} ×
              </button>
            ))}
          </div>
          <fieldset>
            <legend>Chains</legend>
            {MANDATE_CHAINS.map((chain) => (
              <label key={chain.id} className="check-line">
                <input
                  type="checkbox"
                  checked={draft.chains.includes(chain.id)}
                  onChange={(event) => {
                    const chains = event.target.checked ? [...draft.chains, chain.id] : draft.chains.filter((id) => id !== chain.id);
                    update({ chains });
                  }}
                />
                {chain.name}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Assets</legend>
            <label className="check-line">
              <input type="checkbox" checked readOnly /> USDC
            </label>
            <p className="fine-note">Other assets are coming later.</p>
          </fieldset>
          <div className="chip-row">
            {CATEGORIES.map((item) => {
              const on = draft.categories.block.includes(item);
              return (
                <Button
                  key={item}
                  type="button"
                  variant={on ? "primary" : "ghost"}
                  onClick={() =>
                    update({
                      categories: {
                        block: on ? draft.categories.block.filter((entry) => entry !== item) : [...draft.categories.block, item],
                      },
                    })
                  }
                >
                  {item}
                </Button>
              );
            })}
          </div>
          <Field label="Block another category">
            <input value={category} onChange={(event) => setCategory(event.target.value)} />
          </Field>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const value = category.trim().toLowerCase();
              if (!value) return;
              update({ categories: { block: [...new Set([...draft.categories.block, value])] } });
              setCategory("");
            }}
          >
            Block category
          </Button>
          <div className="chip-row" role="group" aria-label="Expiry">
            {[7, 30, 90].map((days) => (
              <Button key={days} type="button" variant="ghost" onClick={() => update({ expiresAt: new Date(Date.now() + days * 86400000).toISOString() })}>
                {days} days
              </Button>
            ))}
          </div>
          <Field label="Custom expiry">
            <input
              type="date"
              value={draft.expiresAt.slice(0, 10)}
              onChange={(event) => {
                if (!event.target.value) return;
                update({ expiresAt: new Date(`${event.target.value}T23:59:59.000Z`).toISOString() });
              }}
            />
          </Field>
          <Callout>
            In this preview, rules are enforced by FindBuyAgent before it asks your wallet to sign. Your wallet always shows the exact amount, and you can refuse. On-chain allowances (ERC-7715 / Base spend permissions) are on the roadmap.{" "}
            <Link to="/security">Security</Link>
          </Callout>
          <p className="fine-note">Signing records your rules. It does not move funds or grant an on-chain allowance.</p>
          {draft.signature && draft.owner ? (
            <Badge status="go">
              Signed by {draft.owner.slice(0, 6)}…{draft.owner.slice(-4)}
            </Badge>
          ) : null}
          <div className="cta-row">
            <Button type="submit">Save</Button>
            <Button type="button" variant="secondary" onClick={() => void sign()}>
              Sign to commit
            </Button>
            <Button type="button" variant="ghost" onClick={enableApprovalNotifications}>
              Notify me about approvals
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const copy = blankMandate({
                  ...draft,
                  id: crypto.randomUUID(),
                  name: `${draft.name} copy`.slice(0, 80),
                  owner: undefined,
                  signature: undefined,
                  digest: undefined,
                  revokedAt: undefined,
                  createdAt: new Date().toISOString(),
                });
                setDraft(copy);
                refresh(upsertMandate(copy, false));
                setNotice("Duplicated. It is not the active mandate.");
              }}
            >
              Duplicate
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "findbuyagent-mandate.json";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export JSON
            </Button>
            <label className="ui-btn ghost">
              Import JSON
              <input
                className="sr"
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void file.text().then((text) => {
                    try {
                      const imported = parseMandateImport(text).map((item) => ({ ...item, id: crypto.randomUUID(), signature: undefined, digest: undefined, owner: undefined }));
                      const store = loadMandates();
                      const next = { version: 1 as const, activeId: store.activeId, mandates: [...imported, ...store.mandates] };
                      saveMandates(next);
                      refresh(next);
                      setDraft(imported[0]);
                      setError("");
                      setNotice("Imported. Review it, then save or sign.");
                    } catch (reason) {
                      setError(reason instanceof Error ? reason.message : "Import failed.");
                    }
                  });
                }}
              />
            </label>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                const revoked = { ...draft, revokedAt: new Date().toISOString(), signature: undefined, digest: undefined, owner: undefined };
                setDraft(revoked);
                refresh(upsertMandate(revoked, revoked.id === activeId));
                setNotice("Revoked. This mandate now blocks every buy.");
              }}
            >
              Revoke
            </Button>
          </div>
          {error ? (
            <p role="alert">{error}</p>
          ) : null}
          {notice ? (
            <p role="status">{notice}</p>
          ) : null}
        </form>
        <aside className="stack">
          <article className="ui-card">
            <h2>Plain English</h2>
            <p>{plainEnglish(draft)}</p>
            <p className="fine-note">Chains in this mandate: {draft.chains.map(chainName).join(", ") || "none"}.</p>
          </article>
          <CodeBlock text={JSON.stringify(draft, null, 2)} />
        </aside>
      </div>
    </div>
  );
}
