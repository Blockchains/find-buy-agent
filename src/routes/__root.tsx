import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteShell } from "@/components/shell/site-shell";
import { siteJsonLd } from "@/content/seo";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import appCss from "../styles.css?url";
import "../styles/tokens.css";
import "../styles/site.css";

const jsonLd = JSON.stringify(siteJsonLd());

const themeBoot = `(function(){try{var m=localStorage.getItem("fba-theme");var dark=m==="dark"||(m!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",dark?"dark":"light");}catch(e){}})();`;

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#FAFAF7" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "icon", type: "image/png", href: "/icon-192.png", sizes: "192x192" },
      { rel: "icon", type: "image/png", href: "/icon-512.png", sizes: "512x512" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <HeadContent />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

function NotFound() {
  useEffect(() => {
    document.title = "Page not found | FindBuyAgent";
  }, []);
  return (
    <SiteShell>
      <title>Page not found | FindBuyAgent</title>
      <article className="wrap section">
        <h1>Page not found</h1>
        <p>That address is not on FindBuyAgent.</p>
        <ul>
          <li><Link to="/">Find</Link></li>
          <li><Link to="/merchants">Merchants</Link></li>
          <li><Link to="/mandates">Mandates</Link></li>
          <li><Link to="/protocols">Protocols</Link></li>
          <li><Link to="/compare">Compare</Link></li>
          <li><Link to="/blog">Blog</Link></li>
          <li><Link to="/faq">FAQ</Link></li>
        </ul>
      </article>
    </SiteShell>
  );
}
