import { createFileRoute } from "@tanstack/react-router";
import { CataloguePage } from "../components/catalogue-page";
import { getPublicCatalogue } from "../lib/public-seo.functions";
import { absoluteUrl, SITE_NAME, SITE_ORIGIN } from "../lib/seo";

export const Route = createFileRoute("/en")({
  loader: () => getPublicCatalogue({ data: { locale: "en" } }),
  head: () => ({
    meta: [
      { title: "Soul Catalogue | Enagram" },
      { name: "description", content: "Explore Engrams: public writing, interviews, technical notes, and other sources explicitly approved for release." },
      { name: "robots", content: "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" },
      { name: "keywords", content: "Engram, soul catalogue, public archive, interviews, writing, personal knowledge archive" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_US" },
      { property: "og:title", content: "Soul Catalogue | Enagram" },
      { property: "og:description", content: "Explore Engrams and sources explicitly approved for public release." },
      { name: "twitter:card", content: "summary" }
    ],
    links: [
      { rel: "canonical", href: absoluteUrl("/en") },
      { rel: "alternate", hrefLang: "fa", href: absoluteUrl("/") },
      { rel: "alternate", hrefLang: "en", href: absoluteUrl("/en") },
      { rel: "alternate", hrefLang: "x-default", href: SITE_ORIGIN + "/" }
    ],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Soul Catalogue | Enagram",
        description: "A public catalogue of Engrams and sources explicitly approved for release.",
        url: absoluteUrl("/en"),
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_ORIGIN }
      })
    }]
  }),
  component: EnglishCatalogue
});
function EnglishCatalogue() {
  const souls = Route.useLoaderData();
  return <CataloguePage locale="en" souls={souls} />;
}
