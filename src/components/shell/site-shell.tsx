import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Sheet } from "@/components/ui/kit";
import { JsonLd } from "@/components/findbuy/shell";
import { breadcrumbJsonLd } from "@/content/seo";
import { bindWalletEvents, chainLabel, connectProvider, disconnectWallet, discoverWallets, ensureChain, isBaseMainnet, readPublicWallet, readUsdcBalance, type WalletChoice } from "@/lib/market/wallet";

const LINKS = [
  { to: "/fiat", label: "FIAT" },
  { to: "/", label: "Find" },
  { to: "/mandates", label: "Mandates" },
  { to: "/receipts", label: "Receipts" },
  { to: "/protocols", label: "Protocols" },
  { to: "/compare", label: "Compare" },
  { to: "/merchants", label: "Merchants" },
  { to: "/blog", label: "Blog" },
] as const;

const NAMES: Record<string, string> = {
  "/fiat": "FIAT",
  "/mandates": "Mandates",
  "/receipts": "Receipts",
  "/protocols": "Protocols",
  "/compare": "Compare",
  "/merchants": "Merchants",
  "/blog": "Blog",
  "/faq": "FAQ",
  "/security": "Security",
  "/pricing": "Pricing",
  "/settings": "Settings",
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

function Blockie({ address }: { address: string }) {
  const cells = [];
  let seed = 0;
  for (let index = 2; index < address.length; index += 1) seed = (seed * 33 + address.charCodeAt(index)) >>> 0;
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      if (seed % 2 !== 0) continue;
      cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
      cells.push(<rect key={`m-${x}-${y}`} x={7 - x} y={y} width="1" height="1" />);
    }
  }
  return (
    <svg className="blockie" viewBox="0 0 8 8" aria-hidden="true">
      {cells}
    </svg>
  );
}

const INSTALL = [
  { name: "MetaMask", site: "https://metamask.io/download/", deep: "https://metamask.app.link/dapp/findbuyagent.com" },
  { name: "Coinbase Wallet", site: "https://www.coinbase.com/wallet/downloads", deep: "https://go.cb-w.com/dapp?cb_url=https%3A%2F%2Ffindbuyagent.com" },
  { name: "Rabby", site: "https://rabby.io/", deep: "https://rabby.io/" },
  { name: "Trust", site: "https://trustwallet.com/download", deep: "https://link.trustwallet.com/open_url?coin_id=60&url=https%3A%2F%2Ffindbuyagent.com" },
  { name: "Phantom", site: "https://phantom.com/download", deep: "https://phantom.com/ul/browse/https%3A%2F%2Ffindbuyagent.com" },
];

function applyTheme(mode: "system" | "light" | "dark") {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  localStorage.setItem("fba-theme", mode);
}

export function SiteShell({ children }: { children: ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);
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
    const openConnect = () => {
      setError("");
      void discoverWallets().then((list) => setChoices(list));
    };
    window.addEventListener("fba-connect", openConnect);
    const onReceipt = () => {
      const current = readPublicWallet();
      if (current) void readUsdcBalance(current.address, "8453").then(setUsdc);
    };
    window.addEventListener("fba-receipts", onReceipt);
    const onScroll = () => headerRef.current?.classList.toggle("is-shrunk", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      if (localStorage.getItem("fba-theme") === "system" || !localStorage.getItem("fba-theme")) applyTheme("system");
    };
    query.addEventListener("change", onScheme);
    return () => {
      query.removeEventListener("change", onScheme);
      window.removeEventListener("fba-wallet", onWallet);
      window.removeEventListener("fba-connect", openConnect);
      window.removeEventListener("fba-receipts", onReceipt);
      window.removeEventListener("scroll", onScroll);
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
      <header className="site-header" ref={headerRef}>
        <Link to="/" className="wordmark">
          FindBuyAgent
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {LINKS.map((item) => (
            <Link key={item.to} to={item.to} preload="intent" aria-current={path === item.to ? "page" : undefined}>
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
          <Link to="/settings" aria-label="Settings">
            Settings
          </Link>
          {wallet ? (
            <details className="wallet-menu">
              <summary>
                <Blockie address={wallet.address} />
                {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)} · {isBaseMainnet(wallet.chainId) ? "Base" : chainLabel(wallet.chainId)}
                {usdc !== null ? ` · ${usdc} USDC` : ""}
              </summary>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(wallet.address);
                }}
              >
                Copy
              </button>
              <a href={`https://basescan.org/address/${wallet.address}`}>Basescan</a>
              <button type="button" onClick={() => disconnectWallet()}>
                Disconnect
              </button>
            </details>
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
        <Link to="/fiat" preload="intent" aria-current={path === "/fiat" ? "page" : undefined}>
          FIAT
        </Link>
        <Link to="/" preload="intent" aria-current={path === "/" ? "page" : undefined}>
          Find
        </Link>
        <Link to="/mandates" preload="intent" aria-current={path === "/mandates" ? "page" : undefined}>
          Rules
        </Link>
        <button type="button" onClick={() => setMore((value) => !value)}>
          More
        </button>
      </nav>
      {more ? (
        <div className="more-panel">
          <Link to="/fiat" onClick={() => setMore(false)}>FIAT</Link>
          <Link to="/receipts" onClick={() => setMore(false)}>Receipts</Link>
          <Link to="/protocols" onClick={() => setMore(false)}>Protocols</Link>
          <Link to="/compare" onClick={() => setMore(false)}>Compare</Link>
          <Link to="/merchants" onClick={() => setMore(false)}>Merchants</Link>
          <Link to="/blog" onClick={() => setMore(false)}>Blog</Link>
        </div>
      ) : null}
      {choices ? (
        <Sheet title="Connect a wallet" onClose={() => setChoices(null)}>
          <p>FindBuyAgent asks your wallet to sign. It never sees a seed phrase or a private key.</p>
          {choices.length === 0 ? (
            <div className="card-list">
              <p>No wallet answered in this browser.</p>
              {INSTALL.map((item) => (
                <article key={item.name} className="ui-card">
                  <h3>{item.name}</h3>
                  <p>
                    <a href={item.site}>Install</a>
                    {" · "}
                    <a href={item.deep}>Open in wallet app</a>
                  </p>
                </article>
              ))}
            </div>
          ) : null}
          {error ? <p>{error}</p> : null}
          {choices.map((choice) => (
            <Button
              key={choice.id}
              onClick={() => {
                void connectProvider(choice.provider)
                  .then((next) => {
                    setWallet(next);
                    localStorage.setItem("fba-wallet-name", choice.name);
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
