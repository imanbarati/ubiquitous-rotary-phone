import type { CSSProperties } from "react";
import type { PublicSoulPage } from "../lib/public-seo.functions";

type Props = { locale: "fa" | "en"; page: PublicSoulPage; slug: string };
const labels = {
  fa: {
    dashboard: "فضای شخصی", kicker: "منابعی که صریحاً برای انتشار انتخاب شده‌اند",
    privateNote: "فقط منابع دارای برچسب انتشار عمومی در این صفحه قرار می‌گیرند.",
    categories: { writings: "نوشته‌ها", interviews: "مصاحبه‌ها", technical: "یادداشت‌های فنی", audio: "صوت و گفتار", other: "سایر منابع" },
    language: { fa: "فارسی", en: "انگلیسی", both: "فارسی و انگلیسی" }
  },
  en: {
    dashboard: "Private workspace", kicker: "Sources explicitly approved for public release",
    privateNote: "Only sources explicitly tagged public appear on this page.",
    categories: { writings: "Writing", interviews: "Interviews", technical: "Technical notes", audio: "Audio & speech", other: "Other sources" },
    language: { fa: "Persian", en: "English", both: "Persian & English" }
  }
};
export function PublicSourcePage({ locale, page, slug }: Props) {
  const t = labels[locale], prefix = locale === "en" ? "/en" : "";
  return <main className={"shell share-page locale-" + locale} dir={locale === "fa" ? "rtl" : "ltr"} lang={locale}>
    <header className="top animate-in">
      <a className="brand" href={prefix || "/"}><b>e✳</b> Enagram<span>.</span></a>
      <nav className="catalog-nav">
        {page.language === "both" && <a className="button language-switch" href={(locale === "fa" ? "/en" : "") + "/s/" + encodeURIComponent(slug)} lang={locale === "fa" ? "en" : "fa"}>{locale === "fa" ? "English" : "فارسی"}</a>}
        <a className="button ghost" href="/dashboard">{t.dashboard}</a>
      </nav>
    </header>
    <article className="panel share source-detail animate-in">
      <small>{t.kicker}</small><div className="big-e">e</div><h1>{page.title}</h1>
      {page.description && <p className="source-intro">{page.description}</p>}
      <div className="public-source-list">{page.sources.map((source, index) => <section className="public-source" style={{ "--card-index": index % 8 } as CSSProperties} key={source.title + "-" + index}>
        <div className="public-source-top"><span>{t.categories[source.category]}</span><span>{t.language[source.language]}</span></div>
        <h2>{source.title}</h2>{source.summary && <p>{source.summary}</p>}
        {source.content && <pre className="source-content">{source.content}</pre>}
      </section>)}</div>
      <small className="share-note">{t.privateNote}</small>
    </article>
    <footer className="foot"><b>Enagram<span>.</span></b><span>{locale === "fa" ? "بازتابی از سوابق ثبت‌شده، نه خودِ شخص." : "A reflection of recorded sources, not the person."}</span></footer>
  </main>;
}
