import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { JsonLd } from "@/components/findbuy/shell";
import { SiteShell } from "@/components/shell/site-shell";
import { Button, Field } from "@/components/ui/kit";
import { ORIGIN, breadcrumbJsonLd, pageHead } from "@/content/seo";
import { clearReceipts, loadReceipts, receiptsJson } from "@/lib/receipts";
import { chainLabel, disconnectWallet, readPublicWallet } from "@/lib/market/wallet";
import { PER_DAY_MAX, PER_PAYMENT_MAX, defaultSettings, loadSettings, saveSettings, type Settings } from "@/lib/settings";

const TITLE = "Settings: Caps, Allowlist, Wallet | FindBuyAgent";
const DESCRIPTION = "Set a per-payment cap and a daily cap, manage the host and payee allowlist, and export receipts. Live Base only.";

export const Route = createFileRoute("/settings")({
  head: () => {
    const head = pageHead({ title: TITLE, description: DESCRIPTION, path: "/settings" });
    return { meta: [...head.meta, { name: "robots", content: "index, follow, max-image-preview:large" }], links: head.links };
  },
  component: Page,
});

function Page() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [wallet, setWallet] = useState("");
  const [count, setCount] = useState(0);
  const [note, setNote] = useState("");
  useEffect(() => {
    setSettings(loadSettings());
    const pub = readPublicWallet();
    setWallet(pub ? `${pub.address} · ${chainLabel(pub.chainId)}` : "Not connected");
    setCount(loadReceipts().length);
  }, []);
  const save = (next: Settings) => {
    const stored = saveSettings(next);
    setSettings(stored);
    document.documentElement.dataset.reduce = stored.reducedMotion ? "1" : "0";
    setNote("Saved on this browser.");
  };
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        { name: "FindBuyAgent", path: "/" },
        { name: "Settings", path: "/settings" },
      ]),
      { "@type": "WebPage", name: TITLE, url: `${ORIGIN}/settings`, description: DESCRIPTION },
    ],
  };
  return (
    <SiteShell>
      <JsonLd data={data} />
      <article className="wrap section">
        <h1>Settings</h1>
        <p>Live is the only mode. Caps are checked before your wallet is asked to sign.</p>
        <Field label={`Per payment, up to $${PER_PAYMENT_MAX}`}>
          <input
            type="number"
            min={0.001}
            max={PER_PAYMENT_MAX}
            step={0.001}
            value={settings.perPaymentUsd}
            onChange={(event) => save({ ...settings, perPaymentUsd: Number(event.target.value) })}
          />
        </Field>
        <Field label={`Per day, rolling 24 hours, up to $${PER_DAY_MAX}`}>
          <input
            type="number"
            min={0.001}
            max={PER_DAY_MAX}
            step={0.01}
            value={settings.perDayUsd}
            onChange={(event) => save({ ...settings, perDayUsd: Number(event.target.value) })}
          />
        </Field>
        <h2>Allowlist</h2>
        <ul className="inset-list">
          {settings.hosts.map((host) => (
            <li key={host}>
              {host}{" "}
              <button type="button" className="ui-btn ghost" onClick={() => save({ ...settings, hosts: settings.hosts.filter((item) => item !== host) })}>
                Remove
              </button>
            </li>
          ))}
          {settings.payees.map((payee) => (
            <li key={payee}>
              <code>{payee}</code>{" "}
              <button type="button" className="ui-btn ghost" onClick={() => save({ ...settings, payees: settings.payees.filter((item) => item !== payee) })}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <h2>Wallet</h2>
        <p>{wallet}</p>
        <Button variant="ghost" onClick={() => disconnectWallet()}>
          Disconnect
        </Button>
        <h2>Appearance</h2>
        <div className="chip-row" role="group" aria-label="Theme">
          {(["system", "light", "dark"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className="ui-btn secondary"
              onClick={() => {
                localStorage.setItem("fba-theme", mode);
                const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
                document.documentElement.dataset.theme = dark ? "dark" : "light";
              }}
            >
              {mode}
            </button>
          ))}
        </div>
        <label className="ui-field">
          <input type="checkbox" checked={settings.reducedMotion} onChange={(event) => save({ ...settings, reducedMotion: event.target.checked })} /> Reduced motion
        </label>
        <label className="ui-field">
          <input type="checkbox" checked={settings.developer} onChange={(event) => save({ ...settings, developer: event.target.checked })} /> Developer view
        </label>
        <h2>Receipts</h2>
        <p>{count} stored on this browser.</p>
        <Button
          variant="secondary"
          onClick={() => {
            const blob = new Blob([receiptsJson(loadReceipts())], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "findbuyagent-receipts.json";
            link.click();
          }}
        >
          Export JSON
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            clearReceipts();
            setCount(0);
            setNote("Receipts cleared.");
          }}
        >
          Clear receipts
        </Button>
        <Field label="WalletConnect project id, optional">
          <input
            value={settings.walletConnectId}
            autoComplete="off"
            placeholder="Leave empty to use the browser wallet"
            onChange={(event) => save({ ...settings, walletConnectId: event.target.value })}
          />
        </Field>
        <p className="fine-note">A project id is stored on this browser only. FindBuyAgent does not ship a key. If this is empty, connection uses the wallets already in the browser.</p>
        {note ? <p role="status">{note}</p> : null}
      </article>
    </SiteShell>
  );
}
