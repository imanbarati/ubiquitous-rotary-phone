import { createFileRoute, notFound } from "@tanstack/react-router";
import { PublicSourcePage } from "../components/public-source-page";
import { getPublicSoulPage } from "../lib/public-seo.functions";
import { absoluteUrl, SITE_NAME } from "../lib/seo";

export const Route = createFileRoute("/s/$slug")({
  loader: async ({ params }) => {
    const page = await getPublicSoulPage({ data: { slug: params.slug, locale: "fa" } });
    if (!page) throw notFound();
    return page;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ name: "robots", content: "noindex,nofollow" }] };
    const canonical = absoluteUrl("/s/" + encodeURIComponent(params.slug));
    const alternates = loaderData.language === "both" ? [
      { rel: "alternate", hrefLang: "fa", href: canonical },
      { rel: "alternate", hrefLang: "en", href: absoluteUrl("/en/s/" + encodeURIComponent(params.slug)) }
    ] : [{ rel: "alternate", hrefLang: "fa", href: canonical }];
    return {
      meta: [
        { title: loaderData.title + " | انگرام" },
        { name: "description", content: loaderData.description || ("منابع عمومی انگرام «" + loaderData.title + "»؛ ثبت‌شده و قابل ارجاع.") },
        { name: "robots", content: "index,follow,max-snippet:-1,max-image-preview:large" },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:locale", content: "fa_IR" },
        { property: "og:title", content: loaderData.title + " | انگرام" },
        { property: "og:description", content: loaderData.description },
        { name: "twitter:card", content: "summary" }
      ],
      links: [{ rel: "canonical", href: canonical }, ...alternates],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org", "@type": "CreativeWork",
          name: loaderData.title, description: loaderData.description,
          url: canonical, inLanguage: "fa", dateModified: loaderData.updatedAt,
          isAccessibleForFree: true, isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") }
        })
      }]
    };
  },
  component: PersianPublicSource
});
function PersianPublicSource() {
  const { slug } = Route.useParams();
  const page = Route.useLoaderData();
  return <PublicSourcePage locale="fa" page={page} slug={slug} />;
}
