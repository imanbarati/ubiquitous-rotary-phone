import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { publicSourceSlug, type SoulInput } from "../lib/domain";

type User = { id: number; githubId: number; username: string; avatarUrl: string | null };
type SourceHint = { id?: string; title?: string; publication?: string };
type Soul = { id: string; slug: string; title: string; description: string; data: Record<string, unknown>; visibility: "private" | "unlisted" | "public"; createdAt: string; updatedAt: string };
function publicSources(soul: Soul): SourceHint[] {
  return Array.isArray(soul.data.sources) ? (soul.data.sources as SourceHint[]).filter(source =>
    source && source.publication === "public" && typeof source.id === "string" && typeof source.title === "string") : [];
}
export const Route = createFileRoute("/dashboard")({ head: () => ({ meta: [{ title: "فضای شخصی | انگرام" }, { name: "robots", content: "noindex,nofollow" }] }), component: Dashboard });
function Dashboard() {
  const [user, setUser] = useState<User | null>(null), [souls, setSouls] = useState<Soul[]>([]);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<string | null>(null), [title, setTitle] = useState("");
  const [description, setDescription] = useState(""), [dataText, setDataText] = useState("{\n  \"sources\": []\n}");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const mr = await fetch("/api/me"), m = await mr.json() as { user?: User | null; error?: string };
      if (!mr.ok) throw new Error(m.error || "حساب کاربری بارگذاری نشد.");
      setUser(m.user ?? null);
      if (m.user) {
        const sr = await fetch("/api/souls"), s = await sr.json() as { souls?: Soul[]; error?: string };
        if (!sr.ok) throw new Error(s.error || "آرشیو بارگذاری نشد.");
        setSouls(s.souls ?? []);
      } else setSouls([]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "ارتباط با سرور برقرار نشد."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const auth = new URLSearchParams(window.location.search).get("auth");
    if (auth) {
      const messages: Record<string, string> = {
        invalid_state: "مهلت ورود تمام شد؛ دوباره تلاش کنید.", cancelled: "ورود با گیت‌هاب لغو شد.",
        configuration: "ورود گیت‌هاب پیکربندی نشده است.", token_exchange: "ورود به گیت‌هاب ناموفق بود.",
        profile: "اطلاعات حساب گیت‌هاب دریافت نشد.", storage: "نشست کاربری ذخیره نشد.", server: "ورود انجام نشد."
      };
      setError(messages[auth] || "ورود کامل نشد.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);
  function reset() { setEditing(null); setTitle(""); setDescription(""); setDataText("{\n  \"sources\": []\n}"); }
  function edit(soul: Soul) {
    setEditing(soul.id); setTitle(soul.title); setDescription(soul.description);
    setDataText(JSON.stringify(soul.data, null, 2)); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setError(""); setNotice("");
    let data: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(dataText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("دادهٔ روح باید یک شیء JSON باشد.");
      data = parsed as Record<string, unknown>;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "ساختار JSON معتبر نیست."); return; }
    const payload: SoulInput = { title, description, data, visibility: "private" };
    setSaving(true);
    try {
      const response = await fetch(editing ? "/api/souls/" + encodeURIComponent(editing) : "/api/souls", {
        method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const result = await response.json() as { soul?: Soul; error?: string };
      if (!response.ok || !result.soul) throw new Error(result.error || "ذخیرهٔ روح انجام نشد.");
      setSouls(old => [result.soul!, ...old.filter(item => item.id !== result.soul!.id)]);
      setNotice("تغییرات ذخیره شد. منابع بدون برچسب عمومی، خصوصی باقی می‌مانند."); reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "ذخیره انجام نشد."); }
    finally { setSaving(false); }
  }
  async function remove(soul: Soul) {
    if (!window.confirm("روح «" + soul.title + "» حذف شود؟")) return;
    const response = await fetch("/api/souls/" + encodeURIComponent(soul.id), { method: "DELETE" });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setError(result.error || "حذف انجام نشد."); return; }
    setSouls(old => old.filter(item => item.id !== soul.id)); if (editing === soul.id) reset(); setNotice("روح حذف شد.");
  }
  async function share(soul: Soul) {
    const source = publicSources(soul)[0];
    if (!source?.id || !source.title) return;
    const url = window.location.origin + "/s/" + encodeURIComponent(publicSourceSlug(soul.id, source.id, source.title));
    try { await navigator.clipboard.writeText(url); setNotice("پیوند منبع عمومی کپی شد."); }
    catch { setNotice("پیوند منبع عمومی: " + url); }
  }

  return <main className="shell dashboard" dir="rtl">
    <header className="top"><a className="brand" href="/"><b>e✳</b> انگرام<span>.</span></a>
      <div className="dashboard-nav"><a className="button ghost" href="/">بازگشت به کاتالوگ</a>
        {user ? <span className="user">{user.avatarUrl && <img src={user.avatarUrl} alt="" />}{user.username}
          <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); setSouls([]); reset(); }}>خروج</button>
        </span> : <a className="button primary" href="/api/auth/github">ورود با گیت‌هاب ↗</a>}
      </div>
    </header>
    <section className="dashboard-intro"><small>فضای شخصی و خصوصی</small><h1>آرشیو روح‌های شما</h1>
      <p>عنوان و توضیح روح فقط برای مدیریت داخلی‌اند. تنها منابعی که مقدار <code>publication</code> آن‌ها دقیقاً <code>public</code> است در کاتالوگ عمومی دیده می‌شوند؛ عنوان و توضیح خصوصی روح منتشر نمی‌شود.</p>
    </section>
    {(error || notice) && <div className={error ? "message error" : "message"} role={error ? "alert" : "status"}>{error || notice}<button onClick={() => { setError(""); setNotice(""); }}>×</button></div>}
    {loading ? <p className="loading">در حال آماده‌سازی فضای شخصی…</p> :
      !user ? <section className="signin panel"><div className="symbol">✳</div><div><small>فضای شخصی شما</small><h2>برای مدیریت روح‌ها وارد شوید.</h2><p>با حساب گیت‌هاب وارد شوید. منابع تا زمانی که برچسب عمومی نداشته باشند در کاتالوگ نمایش داده نمی‌شوند.</p></div><a href="/api/auth/github" className="button primary">ورود با گیت‌هاب ←</a></section> :
      <section className="workspace">
        <div className="heading"><div><small>کتابخانهٔ خصوصی</small><h2>{souls.length ? "روح‌های ذخیره‌شده" : "از اینجا شروع کنید."}</h2></div><span>{souls.length.toLocaleString("fa-IR")} روح</span></div>
        <div className="columns">
          <form className="panel editor" onSubmit={save}>
            <small>{editing ? "ویرایش روح" : "ساخت روح جدید"}</small><h3>{editing ? "اطلاعات روح را ویرایش کنید." : "برای روح نامی انتخاب کنید."}</h3>
            <label>عنوان داخلی<input required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} placeholder="مثلاً: معمار آرام" /></label>
            <label>توضیح داخلی<textarea maxLength={500} rows={2} value={description} onChange={event => setDescription(event.target.value)} placeholder="این توضیح در کاتالوگ عمومی نمایش داده نمی‌شود." /></label>
            <label>داده‌ها و منابع <span>JSON · حداکثر ۲۴ کیلوبایت</span><textarea className="code" rows={10} value={dataText} onChange={event => setDataText(event.target.value)} spellCheck={false} /></label>
            <div className="source-help"><strong>ساختار هر منبع</strong>
              <p>در آرایهٔ <code>sources</code> برای هر منبع عنوان، خلاصه، دسته، زبان و متن بنویسید. فقط مقدار دقیق <code>"publication": "public"</code> آن منبع را عمومی می‌کند؛ نبودن برچسب یا هر مقدار دیگر به معنی خصوصی است.</p>
              <pre>{'{\n  "sources": [\n    {\n      "id": "550e8400-e29b-41d4-a716-446655440000",\n      "title": "عنوان منبع",\n      "summary": "خلاصه‌ای که مجاز به انتشار است",\n      "category": "writings",\n      "language": "fa",\n      "content": "متن منبع",\n      "publication": "private"\n    }\n  ]\n}'}</pre>
              <p>دسته‌ها: <code>writings</code>، <code>interviews</code>، <code>technical</code>، <code>audio</code> و <code>other</code>. پیش از عمومی‌کردن، محتوای همان منبع را بررسی کنید.</p>
            </div>
            <p className="privacy">◈ &nbsp; همهٔ منابع به‌صورت پیش‌فرض خصوصی‌اند. برچسب عمومی فقط همان منبع را منتشر می‌کند؛ سایر منابع و فرادادهٔ داخلی روح پنهان می‌مانند.</p>
            <div className="actions"><button className="button primary" disabled={saving}>{saving ? "در حال ذخیره…" : editing ? "ذخیرهٔ تغییرات" : "ساخت روح"} ←</button>{editing && <button type="button" className="button ghost" onClick={reset}>لغو ویرایش</button>}</div>
          </form>
          <div className="list">
            {souls.length === 0 ? <div className="panel empty"><div className="big-e">e</div><small>آغاز یک آرشیو تازه</small><h3>هنوز روحی نساخته‌اید.</h3><p>اطلاعات این آرشیو در پایگاه دادهٔ خصوصی D1 ذخیره می‌شود.</p></div> :
              souls.map((soul, index) => {
                const count = publicSources(soul).length;
                return <article className="panel card" key={soul.id}>
                  <div className="cardtop"><small>{String(index + 1).padStart(2, "0")}</small><span className={"tag " + (count ? "public" : "private")}>{count ? count.toLocaleString("fa-IR") + " منبع عمومی" : "خصوصی"}</span></div>
                  <h3>{soul.title}</h3><p>{soul.description || "توضیح داخلی ثبت نشده است."}</p>
                  <footer>آخرین ویرایش: {new Date(soul.updatedAt).toLocaleDateString("fa-IR")}</footer>
                  <div className="actions"><button className="button ghost" onClick={() => edit(soul)}>ویرایش</button>{count > 0 && <button className="button ghost" onClick={() => void share(soul)}>کپی پیوند عمومی</button>}<button className="button danger" onClick={() => void remove(soul)}>حذف</button></div>
                </article>;
              })}
            <p className="storage">API عمومی فقط ردیف‌های جدول منابع دارای برچسب انتشار عمومی را می‌خواند؛ فیلدهای داخلی روح در پاسخ عمومی وجود ندارند.</p>
          </div>
        </div>
      </section>}
    <footer className="foot"><b>انگرام<span>.</span></b><a href="/">کاتالوگ عمومی</a><span>© {new Date().getFullYear()}</span></footer>
  </main>;
}
