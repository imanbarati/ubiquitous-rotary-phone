import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type PublicSource = { title: string; summary: string; category: string; language: string; content: string };
type SharedSoul = { title: string; description: string; data: { sources: PublicSource[] }; visibility: "public" };
const categoryLabels: Record<string, string> = { writings: "نوشته‌ها", interviews: "مصاحبه‌ها", technical: "یادداشت‌های فنی", audio: "صوت و گفتار", other: "سایر منابع" };
export const Route = createFileRoute("/s/$slug")({ component: Shared });
function Shared() {
  const { slug } = useParams({ from: "/s/$slug" });
  const [soul, setSoul] = useState<SharedSoul | null>(null), [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/public/souls/" + encodeURIComponent(slug)).then(async response => {
      const payload = await response.json() as { soul?: SharedSoul };
      if (!response.ok || !payload.soul) throw new Error();
      if (active) setSoul(payload.soul);
    }).catch(() => { if (active) setSoul(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);
  return <main className="shell share-page" dir="rtl">
    <header className="top"><a className="brand" href="/"><b>e✳</b> انگرام<span>.</span></a><a className="button ghost" href="/dashboard">فضای شخصی ↗</a></header>
    {loading ? <p className="loading">در حال بازکردن منابع عمومی…</p> :
      soul ? <article className="panel share"><small>منابعی که صریحاً برای انتشار انتخاب شده‌اند</small><div className="big-e">e</div>
        <h1>{soul.title}</h1>{soul.description && <p>{soul.description}</p>}
        <div className="public-source-list">{soul.data.sources.map((source, index) => <section className="public-source" key={source.title + "-" + index}>
          <div className="public-source-top"><span>{categoryLabels[source.category] || "منبع"}</span><span>{source.language === "both" ? "فارسی و انگلیسی" : source.language === "en" ? "انگلیسی" : "فارسی"}</span></div>
          <h2>{source.title}</h2>{source.summary && <p>{source.summary}</p>}{source.content && <pre className="source-content">{source.content}</pre>}
        </section>)}</div>
        <small className="share-note">فقط منابع دارای برچسب انتشار عمومی در این صفحه قرار می‌گیرند.</small>
      </article> :
      <article className="panel share"><small>منبع در دسترس نیست</small><h1>این منبع عمومی نیست.</h1><p>ممکن است برچسب انتشار آن برداشته شده یا منبع حذف شده باشد.</p><a className="button primary" href="/">بازگشت به کاتالوگ</a></article>}
    <footer className="foot"><b>انگرام<span>.</span></b><span>بازتابی از سوابق ثبت‌شده، نه خودِ شخص.</span></footer>
  </main>;
}
