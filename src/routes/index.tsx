import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

type CatalogueSoul = { slug: string; title: string; description: string; categories: string[]; language: string; sourceCount: number; updatedAt: string };
const categoryLabels: Record<string, string> = { writings: "نوشته‌ها", interviews: "مصاحبه‌ها", technical: "یادداشت‌های فنی", audio: "صوت و گفتار", other: "سایر منابع" };
function normalizeSearch(value: string) {
  return value.toLocaleLowerCase("fa").replace(/[يى]/g, "ی").replace(/ك/g, "ک")
    .replace(/[\u200c\u200e\u200f\u202a-\u202e]/g, " ").replace(/\s+/g, " ").trim();
}
export const Route = createFileRoute("/")({ component: Catalogue });
function Catalogue() {
  const [souls, setSouls] = useState<CatalogueSoul[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    let active = true;
    fetch("/api/public/souls").then(async response => {
      const payload = await response.json() as { souls?: CatalogueSoul[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "بارگذاری فهرست انجام نشد.");
      if (active) setSouls(payload.souls || []);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : "ارتباط با سرور برقرار نشد.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = normalizeSearch(query);
    return souls.filter(soul => {
      const textMatch = !term || normalizeSearch([soul.title, soul.description, ...soul.categories.map(c => categoryLabels[c] || c)].join(" ")).includes(term);
      return textMatch && (category === "all" || soul.categories.includes(category));
    });
  }, [souls, query, category]);

  return <main className="shell catalogue" dir="rtl">
    <header className="top">
      <a className="brand" href="/"><b>e✳</b> انگرام<span>.</span></a>
      <nav className="catalog-nav" aria-label="ناوبری اصلی">
        <a className="button ghost" href="/dashboard">فضای شخصی</a>
        <a className="button primary" href="/api/auth/github">ورود با گیت‌هاب ↗</a>
      </nav>
    </header>
    <section className="catalog-hero">
      <div className="catalog-orbit" aria-hidden="true"><span>e</span></div>
      <small>آرشیوی برای تجربه‌ها، اندیشه‌ها و صداها</small>
      <h1>هر روح، روایتی<br/><em>از خودش دارد.</em></h1>
      <p>انگرام‌ها بازتابی از نوشته‌ها و خاطرات ثبت‌شده‌اند؛ نه جایگزین شخص واقعی. در این فهرست فقط منابعی دیده می‌شوند که صریحاً برای انتشار عمومی علامت‌گذاری شده‌اند.</p>
      <div className="catalog-count">{souls.length.toLocaleString("fa-IR")} روح منتشرشده <span>·</span> منابع با اجازهٔ روشن</div>
    </section>
    <section className="catalog-section" aria-labelledby="catalog-title">
      <div className="catalog-heading">
        <div><small>کتابخانهٔ عمومی</small><h2 id="catalog-title">کاتالوگ روح‌ها</h2></div>
        <label className="catalog-search"><span className="sr-only">جست‌وجو در منابع عمومی</span><span aria-hidden="true">⌕</span>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="جست‌وجوی نام، توضیح یا دسته…" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="پاک‌کردن جست‌وجو">×</button>}
        </label>
      </div>
      <div className="catalog-filters" aria-label="فیلتر دسته‌ها">
        <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>همهٔ دسته‌ها</button>
        {Object.entries(categoryLabels).map(([key, label]) => <button key={key} className={category === key ? "active" : ""} onClick={() => setCategory(key)}>{label}</button>)}
      </div>
      {error && <div className="message error" role="alert">{error}<button onClick={() => window.location.reload()}>تلاش دوباره</button></div>}
      {loading ? <p className="catalog-status" role="status">در حال بارگذاری فهرست عمومی…</p> :
        filtered.length === 0 ? <div className="catalog-empty panel"><div className="big-e">e</div>
          <h3>{souls.length === 0 ? "هنوز روحی برای نمایش منتشر نشده است." : "نتیجه‌ای پیدا نشد."}</h3>
          <p>{souls.length === 0 ? "وقتی منبعی با برچسب انتشار عمومی ثبت شود، اینجا ظاهر خواهد شد. دادهٔ خصوصی هرگز برای پرکردن فهرست نمایش داده نمی‌شود." : "عبارت جست‌وجو یا دستهٔ انتخاب‌شده را تغییر دهید."}</p>
          {souls.length === 0 && <a className="button ghost" href="/dashboard">ساخت یا مدیریت روح</a>}
        </div> : <div className="catalog-grid">{filtered.map((soul, index) =>
          <article className="catalog-card panel" key={soul.slug}>
            <div className="catalog-card-top"><span className="catalog-index">{String(index + 1).padStart(2, "0")}</span><span className="catalog-public">منتشرشده</span></div>
            <div className="catalog-card-mark" aria-hidden="true">e</div><h3>{soul.title}</h3><p>{soul.description || "منبع عمومی ثبت‌شده برای این روح."}</p>
            <div className="catalog-tags">{soul.categories.map(item => <span key={item}>{categoryLabels[item] || item}</span>)}</div>
            <footer><span>{soul.sourceCount.toLocaleString("fa-IR")} منبع عمومی</span><span>{soul.language === "both" ? "فارسی و انگلیسی" : soul.language === "en" ? "انگلیسی" : "فارسی"}</span></footer>
            <a className="button primary catalog-open" href={"/s/" + encodeURIComponent(soul.slug)}>مشاهدهٔ منابع عمومی ←</a>
          </article>
        )}</div>}
    </section>
    <footer className="foot"><b>انگرام<span>.</span></b><span>بازتابی از سوابق ثبت‌شده، نه خودِ شخص.</span><span>© {new Date().getFullYear()}</span></footer>
  </main>;
}
