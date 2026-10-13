import { createFileRoute, notFound } from "@tanstack/react-router";
import { PublicSourcePage } from "../components/public-source-page";
import { getPublicSoulPage } from "../lib/public-seo.functions";
import { absoluteUrl, SITE_NAME } from "../lib/seo";

export const Route = createFileRoute("/en/s/$slug")({
  loader: async ({ params }) => {
    const page = await getPublicSoulPage({ data: { slug: params.slug, locale: "en" } });
    if (!page) throw notFound();
    return page;
  },
  head: ({ params, loaderData }) => {
    const canonical = absoluteUrl("/en/s/" + encodeURIComponent(params.slug));
    const alternates = loaderData.language === "both" ? [
      { rel: "alternate", hrefLang: "en", href: canonical },
      { rel: "alternate", hrefLang: "fa", href: absoluteUrl("/s/" + encodeURIComponent(params.slug)) }
    ] : [{ rel: "alternate", hrefLang: "en", href: canonical }];
    return {
      meta: [
        { title: loaderData.title + " | Enagram" },
        { name: "description", content: loaderData.description || ("Public sources for the Enagram “" + loaderData.title + "” with attributable source material.") },
        { name: "robots", content: "index,follow,max-snippet:-1,max-image-preview:large" },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:locale", content: "en_US" },
        { property: "og:title", content: loaderData.title + " | Enagram" },
        { property: "og:description", content: loaderData.description },
        { name: "twitter:card", content: "summary" }
      ],
      links: [{ rel: "canonical", href: canonical }, ...alternates],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org", "@type": "CreativeWork",
          name: loaderData.title, description: loaderData.description,
          url: canonical, inLanguage: "en", dateModified: loaderData.updatedAt,
          isAccessibleForFree: true, isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/en") }
        })
      }]
    };
  },
  component: EnglishPublicSource
});
function EnglishPublicSource() {
  const { slug } = Route.useParams();
  const page = Route.useLoaderData();
  return <PublicSourcePage locale="en" page={page} slug={slug} />;
}
