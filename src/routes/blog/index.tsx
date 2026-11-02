import { createFileRoute, Link } from "@tanstack/react-router";
import { JsonLd } from "@/components/findbuy/shell";
import { SiteShell } from "@/components/shell/site-shell";
import { featuredListing, listings, listingsIn } from "@/content/posts";
import type { Listing } from "@/content/posts/types";
import { ORIGIN, BLOG_DESCRIPTION, BLOG_TITLE, pageHead } from "@/content/seo";

const SERIES = ["Visa", "x402", "Autonomous buying", "Foundations"] as const;

export const Route = createFileRoute("/blog/")({
  head: () => {
    const head = pageHead({ title: BLOG_TITLE, description: BLOG_DESCRIPTION, path: "/blog" });
    return {
      meta: [...head.meta, { name: "robots", content: "index, follow, max-image-preview:large" }],
      links: head.links,
    };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const lead = featuredListing();
  const rest = listings().filter((item) => !item.featured);
  return (
    <SiteShell>
      <JsonLd data={itemListJsonLd()} />
      <section className="essay blog-index">
          <p className="kicker">FindBuyAgent.com</p>
          <h1>The Visa model, and the buys around it</h1>
          <p className="lede">
            Ten essays. The center of the publication is Visa’s model of Find & Buy Agentics: a trusted
            agent, a token that is not a card number, and a mandate the network can decline. Around it,
            autonomous buying, and x402 for when the purchase is a request rather than an order.
          </p>
          <nav className="series-jump" aria-label="Series">
            {SERIES.map((series) => (
              <a key={series} href={`#${series.toLowerCase().replace(/\s+/g, "-")}`}>
                {series}
              </a>
            ))}
          </nav>
          <Lead item={lead} />
          {SERIES.map((series) => {
            const items = series === "Visa" ? rest.filter((item) => item.series === "Visa") : listingsIn(series);
            if (items.length === 0) return null;
            return (
              <section key={series} id={series.toLowerCase().replace(/\s+/g, "-")} className="series-block">
                <h2>{series}</h2>
                <ol className="post-list post-grid">
                  {items.map((item) => (
                    <li key={item.slug}>
                      <Card item={item} />
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </section>
    </SiteShell>
  );
}

function Cover({ title }: { title: string }) {
  let seed = 0;
  for (const char of title) seed = (seed * 33 + char.charCodeAt(0)) >>> 0;
  const bars = [0, 1, 2, 3, 4].map((index) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return 16 + (seed % 48);
  });
  return (
    <svg className="cover" viewBox="0 0 320 72" aria-hidden="true">
      {bars.map((height, index) => (
        <rect key={index} x={16 + index * 60} y={72 - height} width="36" height={height} rx="8" fill={index % 2 ? "var(--brand)" : "var(--muted)"} opacity={index % 2 ? 0.85 : 0.35} />
      ))}
    </svg>
  );
}

function Lead({ item }: { item: Listing }) {
  return (
    <article className="lead-card">
      <Cover title={item.title} />
      <p className="kicker">{item.kicker}</p>
      <h2>
        <PostLink item={item} />
      </h2>
      <p>{item.description}</p>
      <p className="byline">
        <time dateTime={item.date}>{item.date}</time>
        <span aria-hidden>·</span>
        <span>{item.minutes} min</span>
      </p>
    </article>
  );
}

function Card({ item }: { item: Listing }) {
  return (
    <article>
      <Cover title={item.title} />
      <p className="byline">
        <time dateTime={item.date}>{item.date}</time>
        <span aria-hidden>·</span>
        <span>{item.minutes} min</span>
      </p>
      <h3>
        <PostLink item={item} />
      </h3>
      <p>{item.description}</p>
    </article>
  );
}

function PostLink({ item }: { item: Listing }) {
  if (item.slug === "find-and-buy-agents") {
    return <Link to="/blog/find-and-buy-agents">{item.title}</Link>;
  }
  return (
    <Link to="/blog/$slug" params={{ slug: item.slug }}>
      {item.title}
    </Link>
  );
}

function itemListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "FindBuyAgent.com blog",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: listings().length,
    itemListElement: listings().map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: `${ORIGIN}${item.path}`,
    })),
  };
}
