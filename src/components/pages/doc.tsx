import type { ReactNode } from "react";
import { SiteShell } from "@/components/shell/site-shell";
import { pageHead } from "@/content/seo";

export function docHead(title: string, description: string, path: string) {
  const head = pageHead({ title, description, path });
  return {
    meta: [...head.meta, { name: "robots", content: "index, follow, max-image-preview:large" }],
    links: head.links,
  };
}

export function Doc({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SiteShell>
      <article className="wrap section">
        <h1>{title}</h1>
        {children}
      </article>
    </SiteShell>
  );
}
