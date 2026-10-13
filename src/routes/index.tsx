import { createFileRoute } from "@tanstack/react-router";
import { CataloguePage } from "../components/catalogue-page";
import { getPublicCatalogue } from "../lib/public-seo.functions";
import { absoluteUrl, SITE_NAME, SITE_ORIGIN } from "../lib/seo";

export const Route = createFileRoute("/")({
  loader: () => getPublicCatalogue({ data: { locale: "fa" } }),
  head: () => ({
    meta: [
      { title: "کاتالوگ روح‌ها | انگرام" },
      { name: "description", content: "کاتالوگ فارسی انگرام‌ها؛ نوشته‌ها، مصاحبه‌ها و منابعی که صریحاً برای انتشار عمومی انتخاب شده‌اند." },
      { name: "robots", content: "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" },
      { name: "keywords", content: "انگرام، کاتالوگ روح‌ها، آرشیو خاطرات، منابع عمومی، مصاحبه، نوشته‌ها، یادداشت‌های فنی" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "fa_IR" },
      { property: "og:title", content: "کاتالوگ روح‌ها | انگرام" },
      { property: "og:description", content: "کاوش در انگرام‌ها و منابعی که صریحاً برای انتشار عمومی انتخاب شده‌اند." },
      { name: "twitter:card", content: "summary" }
    ],
    links: [
      { rel: "canonical", href: absoluteUrl("/") },
      { rel: "alternate", hrefLang: "fa", href: absoluteUrl("/") },
      { rel: "alternate", hrefLang: "en", href: absoluteUrl("/en") },
      { rel: "alternate", hrefLang: "x-default", href: SITE_ORIGIN + "/" }
    ],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "کاتالوگ روح‌ها | انگرام",
        description: "کاتالوگ عمومی انگرام‌ها و منابع منتشرشده با اجازهٔ صریح.",
        url: absoluteUrl("/"),
        inLanguage: "fa",
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_ORIGIN }
      })
    }]
  }),
  component: PersianCatalogue
});
function PersianCatalogue() {
  const souls = Route.useLoaderData();
  return <CataloguePage locale="fa" souls={souls} />;
}
