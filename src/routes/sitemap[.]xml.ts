import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { absoluteUrl, xmlEscape } from "../lib/seo";

type SitemapSource = { public_slug: string; language: "fa" | "en" | "both"; updated_at: string };
export const Route = createFileRoute("/sitemap.xml")({
  server: { handlers: {
    GET: async () => {
      try {
        const rows = await env.DB.prepare(
          "SELECT public_slug,language,updated_at FROM soul_sources " +
          "WHERE publication='public' AND (length(content)>0 OR length(summary)>0) " +
          "AND language IN ('fa','en','both') ORDER BY updated_at DESC"
        ).all<SitemapSource>();
        const faUrl = absoluteUrl("/");
        const enUrl = absoluteUrl("/en");
        const homeAlternates = [
          '<xhtml:link rel="alternate" hreflang="fa" href="' + faUrl + '" />',
          '<xhtml:link rel="alternate" hreflang="en" href="' + enUrl + '" />',
          '<xhtml:link rel="alternate" hreflang="x-default" href="' + faUrl + '" />'
        ].join("");
        const urls = [
          '<url><loc>' + faUrl + '</loc><changefreq>daily</changefreq><priority>1.0</priority>' + homeAlternates + '</url>',
          '<url><loc>' + enUrl + '</loc><changefreq>daily</changefreq><priority>0.9</priority>' + homeAlternates + '</url>'
        ];
        const seen = new Set<string>();
        for (const source of rows.results) {
          const localeUrls: Array<{ locale: "fa" | "en"; path: string }> = [];
          if (source.language === "fa" || source.language === "both") localeUrls.push({ locale: "fa", path: "/s/" + encodeURIComponent(source.public_slug) });
          if (source.language === "en" || source.language === "both") localeUrls.push({ locale: "en", path: "/en/s/" + encodeURIComponent(source.public_slug) });
          for (const item of localeUrls) {
            const url = absoluteUrl(item.path);
            if (seen.has(url)) continue;
            seen.add(url);
            const alternates = source.language === "both"
              ? '<xhtml:link rel="alternate" hreflang="fa" href="' + absoluteUrl("/s/" + encodeURIComponent(source.public_slug)) + '" />' +
                '<xhtml:link rel="alternate" hreflang="en" href="' + absoluteUrl("/en/s/" + encodeURIComponent(source.public_slug)) + '" />'
              : '<xhtml:link rel="alternate" hreflang="' + item.locale + '" href="' + url + '" />';
            const lastmod = Number.isNaN(Date.parse(source.updated_at)) ? "" : '<lastmod>' + xmlEscape(new Date(source.updated_at).toISOString()) + '</lastmod>';
            urls.push('<url><loc>' + xmlEscape(url) + '</loc>' + lastmod + '<changefreq>weekly</changefreq><priority>0.7</priority>' + alternates + '</url>');
          }
        }
        const sitemap = '<?xml version="1.0" encoding="UTF-8"?>' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
          urls.join("") + '</urlset>';
        return new Response(sitemap, {
          status: 200,
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=900", "X-Content-Type-Options": "nosniff" }
        });
      } catch {
        return new Response("Sitemap temporarily unavailable.", {
          status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" }
        });
      }
    }
  } }
});
