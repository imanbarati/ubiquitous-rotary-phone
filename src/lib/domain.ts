export type Visibility = "private" | "unlisted" | "public";
export type SourceCategory = "writings" | "interviews" | "technical" | "audio" | "other";
export type SourceLanguage = "fa" | "en" | "both";
export type SoulSource = {
  id: string; title: string; summary: string; category: SourceCategory;
  language: SourceLanguage; content: string; publication: "private" | "public";
};
export type SoulInput = { title: string; description: string; data: Record<string, unknown>; visibility: Visibility };

const categories: SourceCategory[] = ["writings", "interviews", "technical", "audio", "other"];
const languages: SourceLanguage[] = ["fa", "en", "both"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function slugify(v: string) {
  return v.normalize("NFKC").toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "soul";
}
function hashPart(value: string, seed: number) {
  let hash = seed >>> 0;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
export function publicSourceSlug(soulId: string, sourceId: string, title: string) {
  const key = soulId + ":" + sourceId;
  const fingerprint = hashPart(key, 0x811c9dc5) + hashPart(key, 0x12345678) + hashPart(key, 0x9e3779b9) + hashPart(key, 0xdeadbeef);
  return slugify(title).slice(0, 48) + "-" + fingerprint;
}

function normalizeSources(value: unknown): { ok: true; sources: SoulSource[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) return { ok: false, error: "فیلد sources باید یک آرایه باشد." };
  if (value.length > 80) return { ok: false, error: "هر روح حداکثر می‌تواند ۸۰ منبع داشته باشد." };
  const used = new Set<string>();
  const sources: SoulSource[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return { ok: false, error: "هر منبع باید یک شیء معتبر باشد." };
    const raw = item as Record<string, unknown>;
    if (typeof raw.title !== "string" || raw.title.trim().length < 1 || raw.title.trim().length > 160) {
      return { ok: false, error: "عنوان هر منبع باید بین ۱ تا ۱۶۰ نویسه باشد." };
    }
    const summary = raw.summary === undefined ? "" : raw.summary;
    const content = raw.content === undefined ? "" : raw.content;
    if (typeof summary !== "string" || summary.length > 500) return { ok: false, error: "خلاصهٔ هر منبع باید حداکثر ۵۰۰ نویسه باشد." };
    if (typeof content !== "string") return { ok: false, error: "محتوای هر منبع باید متن باشد." };
    const category = categories.includes(raw.category as SourceCategory) ? raw.category as SourceCategory : "other";
    const language = languages.includes(raw.language as SourceLanguage) ? raw.language as SourceLanguage : "fa";
    // Exact opt-in only. Missing, malformed or unexpected publication values stay private.
    const publication = raw.publication === "public" ? "public" : "private";
    const providedId = typeof raw.id === "string" && uuidPattern.test(raw.id) ? raw.id.toLowerCase() : "";
    let id = providedId && !used.has(providedId) ? providedId : crypto.randomUUID();
    while (used.has(id)) id = crypto.randomUUID();
    used.add(id);
    sources.push({ id, title: raw.title.trim(), summary: summary.trim(), category, language, content, publication });
  }
  return { ok: true, sources };
}
export function validateSoulInput(v: unknown): { ok: true; value: SoulInput } | { ok: false; error: string } {
  if (!v || typeof v !== "object" || Array.isArray(v)) return { ok: false, error: "دادهٔ ارسالی باید یک شیء JSON باشد." };
  const x = v as Record<string, unknown>;
  if (typeof x.title !== "string" || x.title.trim().length < 1 || x.title.trim().length > 100) {
    return { ok: false, error: "عنوان روح باید بین ۱ تا ۱۰۰ نویسه باشد." };
  }
  const description = x.description === undefined ? "" : x.description;
  if (typeof description !== "string" || description.length > 500) return { ok: false, error: "توضیح روح باید حداکثر ۵۰۰ نویسه باشد." };
  const rawData = x.data === undefined ? {} : x.data;
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) return { ok: false, error: "دادهٔ روح باید یک شیء JSON باشد." };
  let data = rawData as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(data, "sources")) {
    const result = normalizeSources(data.sources);
    if (!result.ok) return result;
    data = { ...data, sources: result.sources };
  }
  if (new TextEncoder().encode(JSON.stringify(data)).byteLength > 24576) return { ok: false, error: "حجم دادهٔ روح باید کمتر از ۲۴ کیلوبایت باشد." };
  const visibility = x.visibility === undefined ? "private" : x.visibility;
  if (!["private", "unlisted", "public"].includes(String(visibility))) return { ok: false, error: "وضعیت دسترسی روح معتبر نیست." };
  return { ok: true, value: { title: x.title.trim(), description: description.trim(), data, visibility: visibility as Visibility } };
}
