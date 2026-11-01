import { Link } from "@tanstack/react-router";

type Section = "shop" | "vault" | "orders" | "blog";

export function AppHeader({
  active,
  onTab,
}: {
  active: Section;
  onTab?: (tab: "shop" | "vault" | "orders") => void;
}) {
  return (
    <header className="top">
      <div className="frame top-inner">
        <nav className="tabs" aria-label="Sections">
          <SectionControl id="shop" active={active} onTab={onTab} label="Find & Buy Agent" short="Find" />
          <SectionControl id="vault" active={active} onTab={onTab} label="vault" />
          <SectionControl id="orders" active={active} onTab={onTab} label="orders" />
          <Link
            to="/blog"
            className={active === "blog" ? "tab is-on" : "tab"}
            aria-current={active === "blog" ? "page" : undefined}
          >
            blog
            <span className="sr">: Visa models of Find and Buy Agentics, autonomous buying, and x402</span>
          </Link>
        </nav>
        <div className="who">
          <span className="dot dot-mint" aria-hidden />
          <span className="who-status">connected</span>
          <span className="handle">@0xjmori</span>
        </div>
      </div>
    </header>
  );
}

function SectionControl({
  id,
  active,
  onTab,
  label,
  short,
}: {
  id: "shop" | "vault" | "orders";
  active: Section;
  onTab?: (tab: "shop" | "vault" | "orders") => void;
  label: string;
  short?: string;
}) {
  const on = active === id;
  const className = on ? "tab is-on" : "tab";
  const inner = (
    <>
      {id === "shop" && on ? <span className="dot" aria-hidden /> : null}
      {short ? (
        <>
          <span className="tab-long">{label}</span>
          <span className="tab-short">{short}</span>
        </>
      ) : (
        label
      )}
    </>
  );

  if (onTab) {
    return (
      <button type="button" className={className} aria-current={on ? "page" : undefined} onClick={() => onTab(id)}>
        {inner}
      </button>
    );
  }

  return (
    <Link
      to="/"
      search={id === "shop" ? {} : { tab: id }}
      className={className}
      aria-current={on ? "page" : undefined}
    >
      {inner}
    </Link>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
