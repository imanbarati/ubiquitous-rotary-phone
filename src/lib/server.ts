import { env } from "cloudflare:workers";
import { publicSourceSlug, type SoulSource } from "./domain";

export type User = { id: number; github_id: number; username: string; avatar_url: string | null };
export type SoulRow = {
  id: string; owner_id: number; slug: string; title: string; description: string; data_json: string;
  visibility: "private" | "unlisted" | "public"; created_at: string; updated_at: string;
};
export type PublicSourceRow = {
  source_id: string; soul_id: string; public_slug: string; title: string; summary: string;
  category: "writings" | "interviews" | "technical" | "audio" | "other";
  language: "fa" | "en" | "both"; content: string; updated_at: string;
};

export function json(value: unknown, status = 200, extra?: HeadersInit) {
  const h = new Headers(extra);
  h.set("Content-Type", "application/json; charset=utf-8");
  h.set("Cache-Control", "no-store");
  h.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(value), { status, headers: h });
}
export function cookie(req: Request, key: string, value: string, age: number) {
  const sec = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return key + "=" + encodeURIComponent(value) + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + age + sec;
}
export function getCookie(req: Request, key: string) {
  const c = req.headers.get("Cookie");
  if (!c) return null;
  for (const part of c.split(";")) {
    const i = part.indexOf("=");
    if (i >= 0 && part.slice(0, i).trim() === key) {
      try { return decodeURIComponent(part.slice(i + 1).trim()); } catch { return null; }
    }
  }
  return null;
}
export function clearCookie(req: Request, key: string) { return cookie(req, key, "", 0); }
export function sameOrigin(req: Request) {
  const origin = req.headers.get("Origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(req.url).origin; } catch { return false; }
}
export function randomToken(n = 32) {
  const a = crypto.getRandomValues(new Uint8Array(n));
  let s = "";
  for (const b of a) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
export async function hashToken(token: string) {
  const a = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(a), b => b.toString(16).padStart(2, "0")).join("");
}
export function appUrl() {
  try { if (!env.APP_URL || env.APP_URL.startsWith("__")) return null; return new URL(env.APP_URL); } catch { return null; }
}
export function dbError() { return env.DB ? null : json({ error: "پایگاه دادهٔ D1 پیکربندی نشده است." }, 503); }
export async function currentUser(req: Request): Promise<User | null> {
  const token = getCookie(req, "enagram_session");
  if (!token || !env.DB) return null;
  return await env.DB.prepare("SELECT u.id,u.github_id,u.username,u.avatar_url FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?")
    .bind(await hashToken(token), Math.floor(Date.now() / 1000)).first<User>();
}
export function safeSoul(r: SoulRow) {
  let data: Record<string, unknown> = {};
  try { const p: unknown = JSON.parse(r.data_json); if (p && typeof p === "object" && !Array.isArray(p)) data = p as Record<string, unknown>; }
  catch { /* malformed stored JSON stays empty */ }
  return { id: r.id, slug: r.slug, title: r.title, description: r.description, data, visibility: r.visibility, createdAt: r.created_at, updatedAt: r.updated_at };
}
function asStoredSources(data: Record<string, unknown>): SoulSource[] {
  if (!Array.isArray(data.sources)) return [];
  return data.sources.filter((value): value is SoulSource => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const s = value as Record<string, unknown>;
    return typeof s.id === "string" && typeof s.title === "string" && typeof s.summary === "string" &&
      typeof s.content === "string" && ["writings", "interviews", "technical", "audio", "other"].includes(String(s.category)) &&
      ["fa", "en", "both"].includes(String(s.language)) && (s.publication === "public" || s.publication === "private");
  });
}
export function sourceSyncStatements(soulId: string, data: Record<string, unknown>): EnagramD1Statement[] {
  const statements: EnagramD1Statement[] = [env.DB.prepare("DELETE FROM soul_sources WHERE soul_id=?").bind(soulId)];
  for (const source of asStoredSources(data)) {
    const sourceId = soulId + ":" + source.id;
    statements.push(env.DB.prepare(
      "INSERT INTO soul_sources(source_id,soul_id,source_key,public_slug,title,summary,category,language,content,publication) VALUES(?,?,?,?,?,?,?,?,?,?)"
    ).bind(sourceId, soulId, source.id, publicSourceSlug(soulId, source.id, source.title),
      source.title, source.summary, source.category, source.language, source.content, source.publication));
  }
  return statements;
}
export async function runD1Batch(statements: EnagramD1Statement[]) {
  try { return (await env.DB.batch(statements)).every(result => result.success); } catch { return false; }
}
