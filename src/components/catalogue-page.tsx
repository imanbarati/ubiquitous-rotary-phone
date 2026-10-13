import { useMemo, useState, type CSSProperties } from "react";
import type { CatalogueSoul } from "../lib/public-seo.functions";

type Props = { locale: "fa" | "en"; souls: CatalogueSoul[] };
const categoryKeys = ["writings", "interviews", "technical", "audio", "other"] as const;
const labels = {
  fa: { writings: "نوشته‌ها", interviews: "مصاحبه‌ها", technical: "یادداشت‌های فنی", audio: "صوت و گفتار", other: "سایر منابع" },
  en: { writings: "Writing", interviews: "Interviews", technical: "Technical notes", audio: "Audio & speech", other: "Other sources" }
};
const copy = {
  fa: {
    language: "English", home: "انگرام", dashboard: "فضای شخصی", login: "ورود با گیت‌هاب ↗",
    eyebrow: "آرشیوی برای تجربه‌ها، اندیشه‌ها و صداها", titleA: "هر روح، روایتی", titleB: "از خودش دارد.",
    intro: "انگرام‌ها بازتابی از نوشته‌ها و خاطرات ثبت‌شده‌اند؛ نه جایگزین شخص واقعی. اینجا فقط منابعی نمایش داده می‌شوند که صریحاً برای انتشار عمومی علامت‌گذاری شده‌اند.",
    count: "روح در کاتالوگ", countTail: "منابع با اجازهٔ روشن", catalogueEyebrow: "کتابخانهٔ عمومی", catalogueTitle: "کاتالوگ روح‌ها",
    search: "جست‌وجوی نام، توضیح یا دسته…", all: "همهٔ دسته‌ها", published: "منتشرشده",
    open: "مشاهدهٔ منابع عمومی ←", emptyTitle: "هنوز روحی برای نمایش منتشر نشده است.",
    emptyDesc: "وقتی منبعی با برچسب انتشار عمومی ثبت شود، اینجا ظاهر خواهد شد. دادهٔ خصوصی هرگز برای پرکردن فهرست نمایش داده نمی‌شود.",
    emptyButton: "ساخت یا مدیریت روح", noResults: "نتیجه‌ای پیدا نشد.", noResultsDesc: "عبارت جست‌وجو یا دستهٔ انتخاب‌شده را تغییر دهید.",
    clear: "پاک‌کردن جست‌وجو", footer: "بازتابی از سوابق ثبت‌شده، نه خودِ شخص.", publicSourceCount: "منبع عمومی"
  },
  en: {
    language: "فارسی", home: "Enagram", dashboard: "Private workspace", login: "Sign in with GitHub ↗",
    eyebrow: "An archive of experience, ideas, and voices", titleA: "Every soul has", titleB: "a story of its own.",
    intro: "Engrams are reflections of recorded writing and memories—not the real person. Only sources explicitly marked for public release appear here.",
    count: "souls in the catalogue", countTail: "Sources shared with clear permission", catalogueEyebrow: "Public library", catalogueTitle: "Soul catalogue",
    search: "Search names, descriptions, or categories…", all: "All categories", published: "Published",
    open: "Explore public sources →", emptyTitle: "No souls have been published yet.",
    emptyDesc: "A soul appears here after at least one source is explicitly marked public. Private data is never used to fill the catalogue.",
    emptyButton: "Create or manage a soul", noResults: "No results found.", noResultsDesc: "Try another search term or category.",
    clear: "Clear search", footer: "A reflection of recorded sources, not the person.", publicSourceCount: "public sources"
  }
};
function normalizeSearch(value: string) {
  return value.toLocaleLowerCase().replace(/[يى]/g, "ی").replace(/ك/g, "ک")
    .replace(/[\u200c\u200e\u200f\u202a-\u202e]/g, " ").replace(/\s+/g, " ").trim();
}
export function CataloguePage({ locale, souls }: Props) {
  const t = copy[locale], names = labels[locale];
  const [query, setQuery] = useState(""), [category, setCategory] = useState("all");
  const filtered = useMemo(() => {
    const term = normalizeSearch(query);
    return souls.filter(soul => {
      const textMatch = !term || normalizeSearch([soul.title, soul.description, ...soul.categories.map(c => names[c as keyof typeof names] || c)].join(" ")).includes(term);
      return textMatch && (category === "all" || soul.categories.includes(category));
    });
  }, [souls, query, category, names]);
  const prefix = locale === "en" ? "/en" : "";
  return <main className={"shell catalogue locale-" + locale} dir={locale === "fa" ? "rtl" : "ltr"} lang={locale}>
    <header className="top animate-in">
      <a className="brand" href={prefix || "/"}><b>e✳</b> {t.home}<span>.</span></a>
      <nav className="catalog-nav" aria-label={locale === "fa" ? "ناوبری اصلی" : "Main navigation"}>
        <a className="button language-switch" href={locale === "fa" ? "/en" : "/"} lang={locale === "fa" ? "en" : "fa"}>{t.language}</a>
        <a className="button ghost" href="/dashboard">{t.dashboard}</a>
        <a className="button primary" href="/api/auth/github">{t.login}</a>
      </nav>
    </header>
    <section className="catalog-hero">
      <div className="catalog-orbit animated-orbit" aria-hidden="true"><span>e</span></div>
      <small>{t.eyebrow}</small><h1>{t.titleA}<br/><em>{t.titleB}</em></h1><p>{t.intro}</p>
      <div className="catalog-count"><strong>{souls.length.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")}</strong> {t.count} <span>·</span> {t.countTail}</div>
    </section>
    <section className="catalog-section" aria-labelledby="catalog-title">
      <div className="catalog-heading">
        <div><small>{t.catalogueEyebrow}</small><h2 id="catalog-title">{t.catalogueTitle}</h2></div>
        <label className="catalog-search"><span className="sr-only">{t.search}</span><span aria-hidden="true">⌕</span>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={t.search} />
          {query && <button type="button" onClick={() => setQuery("")} aria-label={t.clear}>×</button>}
        </label>
      </div>
      <div className="catalog-filters" aria-label={locale === "fa" ? "فیلتر دسته‌ها" : "Filter by category"}>
        <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>{t.all}</button>
        {categoryKeys.map(key => <button key={key} className={category === key ? "active" : ""} onClick={() => setCategory(key)}>{names[key]}</button>)}
      </div>
      {filtered.length === 0 ? <div className="catalog-empty panel animate-in">
        <div className="big-e">e</div><h3>{souls.length === 0 ? t.emptyTitle : t.noResults}</h3>
        <p>{souls.length === 0 ? t.emptyDesc : t.noResultsDesc}</p>
        {souls.length === 0 && <a className="button ghost" href="/dashboard">{t.emptyButton}</a>}
      </div> : <div className="catalog-grid">{filtered.map((soul, index) =>
        <article className="catalog-card panel" style={{ "--card-index": index % 8 } as CSSProperties} key={soul.slug}>
          <div className="catalog-card-top"><span className="catalog-index">{String(index + 1).padStart(2, "0")}</span><span className="catalog-public">{t.published}</span></div>
          <div className="catalog-card-mark" aria-hidden="true">e</div><h3>{soul.title}</h3><p>{soul.description || t.published}</p>
          <div className="catalog-tags">{soul.categories.map(item => <span key={item}>{names[item as keyof typeof names] || item}</span>)}</div>
          <footer><span>{soul.sourceCount.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")} {t.publicSourceCount}</span><span>{soul.language === "both" ? (locale === "fa" ? "فارسی و انگلیسی" : "Persian & English") : soul.language === "en" ? "English" : "فارسی"}</span></footer>
          <a className="button primary catalog-open" href={prefix + "/s/" + encodeURIComponent(soul.slug)}>{t.open}</a>
        </article>
      )}</div>}
    </section>
    <footer className="foot"><b>{t.home}<span>.</span></b><span>{t.footer}</span><span>© {new Date().getFullYear()}</span></footer>
  </main>;
}
