import { Link } from "@tanstack/react-router";
import { relatedListings } from "@/content/posts";
import type { Block, Post } from "@/content/posts/types";
import { ORIGIN } from "@/content/seo";

function rich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return <p>{rich(block.text)}</p>;
    case "h2":
      return <h2 id={block.id}>{block.text}</h2>;
    case "h3":
      return <h3>{block.text}</h3>;
    case "ul":
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{rich(item)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((item) => (
            <li key={item}>{rich(item)}</li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="thesis">
          {block.label ? <p className="thesis-label">{block.label}</p> : null}
          <p>{block.text}</p>
        </blockquote>
      );
    case "table":
      return (
        <div className="table-wrap">
          <table>
            <caption>{block.caption}</caption>
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th key={column || "corner"} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|")}>
                  {row.map((cell, index) =>
                    index === 0 ? (
                      <th key={cell} scope="row">
                        {cell}
                      </th>
                    ) : (
                      <td key={cell}>{cell}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export function PostView({ post }: { post: Post }) {
  const toc = post.blocks.filter((block): block is Extract<Block, { type: "h2" }> => block.type === "h2");
  const related = relatedListings(post.related);
  const url = `${ORIGIN}/blog/${post.slug}`;

  return (
    <article className="essay">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">FindBuyAgent.com</Link>
        <span aria-hidden>/</span>
        <Link to="/blog">Blog</Link>
        <span aria-hidden>/</span>
        <span>{post.series}</span>
      </nav>
      <p className="kicker">{post.kicker}</p>
      <h1>{post.title}</h1>
      <p className="byline">
        <time dateTime={post.date}>
          {new Date(`${post.date}T12:00:00Z`).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        </time>
        <span aria-hidden>·</span>
        <span>{post.series}</span>
        <span aria-hidden>·</span>
        <span>{post.minutes} min read</span>
      </p>
      {toc.length > 0 ? (
        <nav className="toc" aria-label="In this essay">
          <p>In this essay</p>
          <ol>
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      {post.blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
      <aside className="ui-card">
        <h2>Try it</h2>
        <p>
          {post.series === "x402" ? (
            <a href="/protocols#x402">See the x402 sequence</a>
          ) : post.series === "Visa" ? (
            <a href="/protocols#visa-tap">See Visa TAP</a>
          ) : (
            <Link to="/mandates">Build a mandate</Link>
          )}
        </p>
      </aside>
      {related.length > 0 ? (
        <aside className="related">
          <h2>Continue</h2>
          <ul>
            {related.map((item) => (
              <li key={item.slug}>
                <Link to="/blog/$slug" params={{ slug: item.slug }}>
                  {item.title}
                </Link>
                <span>{item.kicker}</span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
      <p className="colophon">
        Published by <a href={ORIGIN}>FindBuyAgent.com</a>. Canonical URL <a href={url}>{url.replace("https://", "")}</a>.
      </p>
    </article>
  );
}
