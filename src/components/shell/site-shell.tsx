import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Button, Sheet } from "@/components/ui/kit";
import { JsonLd } from "@/components/findbuy/shell";
import { breadcrumbJsonLd } from "@/content/seo";
import { bindWalletEvents, chainLabel, connectProvider, disconnectWallet, discoverWallets, ensureChain, isBaseMainnet, readPublicWallet, readUsdcBalance, type WalletChoice } from "@/lib/market/wallet";

const LINKS = [
  { to: "/", label: "Find" },
  { to: "/mandates", label: "Mandates" },
  { to: "/receipts", label: "Receipts" },
  { to: "/protocols", label: "Protocols" },
  { to: "/compare", label: "Compare" },
  { to: "/merchants", label: "Merchants" },
  { to: "/blog", label: "Blog" },
] as const;

const NAMES: Record<string, string> = {
  "/mandates": "Mandates",
  "/receipts": "Receipts",
  "/protocols": "Protocols",
  "/compare": "Compare",
  "/merchants": "Merchants",
  "/blog": "Blog",
  "/faq": "FAQ",
  "/security": "Security",
  "/pricing": "Pricing",
};

function crumbsFor(path: string) {
  if (path.startsWith("/blog/")) {
    return breadcrumbJsonLd([
      { name: "FindBuyAgent", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: "Essay", path },
    ]);
  }
  return breadcrumbJsonLd([
    { name: "FindBuyAgent", path: "/" },
    { name: NAMES[path] ?? "Page", path },
  ]);
}

function applyTheme(mode: "system" | "light" | "dark") {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  localStorage.setItem("fba-theme", mode);
}

export function SiteShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [wallet, setWallet] = useState<{ address: string; chainId: string } | null>(null);
  const [usdc, setUsdc] = useState<string | null>(null);
  const [choices, setChoices] = useState<WalletChoice[] | null>(null);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("fba-theme");
    const mode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setTheme(mode);
    applyTheme(mode);
    setWallet(readPublicWallet());
    bindWalletEvents();
    const onWallet = () => setWallet(readPublicWallet());
    window.addEventListener("fba-wallet", onWallet);
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      if (localStorage.getItem("fba-theme") === "system" || !localStorage.getItem("fba-theme")) applyTheme("system");
    };
    query.addEventListener("change", onScheme);
    return () => {
      query.removeEventListener("change", onScheme);
      window.removeEventListener("fba-wallet", onWallet);
    };
  }, []);

  useEffect(() => {
    if (!wallet) {
      setUsdc(null);
      return;
    }
    let cancelled = false;
    void readUsdcBalance(wallet.address, wallet.chainId).then((value) => {
      if (!cancelled) setUsdc(value);
    });
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  return (
    <div className="site">
      {path !== "/" ? <JsonLd data={{ "@context": "https://schema.org", ...crumbsFor(path) }} /> : null}
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="site-header">
        <Link to="/" className="wordmark">
          FindBuyAgent
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {LINKS.map((item) => (
            <Link key={item.to} to={item.to} aria-current={path === item.to ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <label className="ui-field">
            <span className="sr">Theme</span>
            <select
              aria-label="Theme"
              value={theme}
              onChange={(event) => {
                const mode = event.target.value as "system" | "light" | "dark";
                setTheme(mode);
                applyTheme(mode);
              }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          {wallet ? (
            <>
              <span className="ui-chip hash" title={`${wallet.address} · ${chainLabel(wallet.chainId)}`}>
                {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)} · {chainLabel(wallet.chainId)}
                {usdc !== null ? ` · ${usdc} USDC` : ""}
              </span>
              <Button variant="ghost" onClick={() => disconnectWallet()}>
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <span className="ui-chip">Not connected</span>
              <Button
                variant="secondary"
                onClick={() => {
                  setError("");
                  void discoverWallets().then((list) => setChoices(list));
                }}
              >
                Connect wallet
              </Button>
            </>
          )}
        </div>
      </header>
      {wallet && !isBaseMainnet(wallet.chainId) ? (
        <p className="network-banner" role="status">
          This wallet is on {chainLabel(wallet.chainId)}. A purchase receipt is written only for Base mainnet.
          <Button
            variant="secondary"
            onClick={() => {
              void ensureChain("eip155:8453")
                .then(() => setWallet(readPublicWallet()))
                .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "The wallet did not switch."));
            }}
          >
            Switch to Base
          </Button>
        </p>
      ) : null}
      <main id="content">{children}</main>
      <footer className="site-footer">
        <nav aria-label="Footer">
          <Link to="/security">Security</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/pricing">Pricing</Link>
          <a href="https://github.com/Blockchains/find-buy-agent">GitHub</a>
        </nav>
        <p>FindBuyAgent never holds your keys or funds.</p>
      </footer>
      <nav className="tabbar" aria-label="Mobile">
        <Link to="/" aria-current={path === "/" ? "page" : undefined}>
          Find
        </Link>
        <Link to="/mandates" aria-current={path === "/mandates" ? "page" : undefined}>
          Mandate
        </Link>
        <Link to="/receipts" aria-current={path === "/receipts" ? "page" : undefined}>
          Receipts
        </Link>
        <button type="button" onClick={() => setMore((value) => !value)}>
          More
        </button>
      </nav>
      {more ? (
        <div className="more-panel">
          <Link to="/protocols" onClick={() => setMore(false)}>Protocols</Link>
          <Link to="/compare" onClick={() => setMore(false)}>Compare</Link>
          <Link to="/merchants" onClick={() => setMore(false)}>Merchants</Link>
          <Link to="/blog" onClick={() => setMore(false)}>Blog</Link>
        </div>
      ) : null}
      {choices ? (
        <Sheet title="Connect a wallet" onClose={() => setChoices(null)}>
          <p>FindBuyAgent asks your wallet to sign. It never sees a seed phrase or a private key.</p>
          {choices.length === 0 ? <p>No injected wallet answered. Open this site inside a wallet browser.</p> : null}
          {error ? <p>{error}</p> : null}
          {choices.map((choice) => (
            <Button
              key={choice.id}
              onClick={() => {
                void connectProvider(choice.provider)
                  .then((next) => {
                    setWallet(next);
                    setChoices(null);
                  })
                  .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "The wallet did not connect."));
              }}
            >
              {choice.icon ? <img src={choice.icon} alt="" width={24} height={24} /> : null}
              {choice.name}
            </Button>
          ))}
        </Sheet>
      ) : null}
    </div>
  );
}
