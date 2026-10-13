import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

export type PublicSource = {
  title: string;
  summary: string;
  category: "writings" | "interviews" | "technical" | "audio" | "other";
  language: "fa" | "en" | "both";
  content: string;
};
export type CatalogueSoul = {
  slug: string; title: string; description: string; categories: string[];
  language: "fa" | "en" | "both"; sourceCount: number; updatedAt: string;
};
export type PublicSoulPage = {
  title: string; description: string; language: "fa" | "en" | "both";
  updatedAt: string; sources: PublicSource[];
};
type PublicSourceRow = {
  soul_id: string; public_slug: string; title: string; summary: string;
  category: PublicSource["category"]; language: PublicSource["language"];
  content: string; updated_at: string;
};
function excerpt(value: string) { return value.replace(/\s+/g, " ").trim().slice(0, 180); }
const categorySet = new Set(["writings", "interviews", "technical", "audio", "other"]);
function validLocale(value: unknown): value is "fa" | "en" { return value === "fa" || value === "en"; }
function asPublicSource(row: PublicSourceRow): PublicSource {
  return { title: row.title, summary: row.summary || excerpt(row.content), category: row.category, language: row.language, content: row.content };
}

export const getPublicCatalogue = createServerFn({ method: "GET" })
  .validator((data: { locale: "fa" | "en" }) => {
    if (!data || !validLocale(data.locale)) throw new Error("Unsupported catalogue locale.");
    return data;
  })
  .handler(async ({ data }): Promise<CatalogueSoul[]> => {
    const rows = await env.DB.prepare(
      "SELECT soul_id,public_slug,title,summary,category,language,content,updated_at FROM soul_sources " +
      "WHERE publication='public' AND (length(content)>0 OR length(summary)>0) AND language IN (?, 'both') ORDER BY updated_at DESC"
    ).bind(data.locale).all<PublicSourceRow>();
    const groups = new Map<string, CatalogueSoul>();
    for (const row of rows.results) {
      if (!categorySet.has(row.category)) continue;
      const summary = row.summary || excerpt(row.content);
      const entry = groups.get(row.soul_id);
      if (!entry) groups.set(row.soul_id, {
        slug: row.public_slug, title: row.title, description: summary, categories: [row.category],
        language: row.language, sourceCount: 1, updatedAt: row.updated_at
      });
      else {
        if (!entry.categories.includes(row.category)) entry.categories.push(row.category);
        entry.sourceCount += 1;
        if (!entry.description && summary) entry.description = summary;
        if (entry.updatedAt < row.updated_at) entry.updatedAt = row.updated_at;
        if (entry.language !== row.language) entry.language = "both";
      }
    }
    return Array.from(groups.values());
  });

export const getPublicSoulPage = createServerFn({ method: "GET" })
  .validator((data: { slug: string; locale: "fa" | "en" }) => {
    if (!data || typeof data.slug !== "string" || data.slug.length < 1 || data.slug.length > 300 || !validLocale(data.locale)) {
      throw new Error("Invalid public source request.");
    }
    return { slug: data.slug, locale: data.locale };
  })
  .handler(async ({ data }): Promise<PublicSoulPage | null> => {
    const selected = await env.DB.prepare(
      "SELECT soul_id,public_slug,title,summary,category,language,content,updated_at FROM soul_sources " +
      "WHERE public_slug=? AND publication='public' AND (length(content)>0 OR length(summary)>0) AND language IN (?, 'both')"
    ).bind(data.slug, data.locale).first<PublicSourceRow>();
    if (!selected) return null;
    const rows = await env.DB.prepare(
      "SELECT soul_id,public_slug,title,summary,category,language,content,updated_at FROM soul_sources " +
      "WHERE soul_id=? AND publication='public' AND (length(content)>0 OR length(summary)>0) AND language IN (?, 'both') ORDER BY updated_at DESC"
    ).bind(selected.soul_id, data.locale).all<PublicSourceRow>();
    return {
      title: selected.title, description: selected.summary || excerpt(selected.content),
      language: selected.language, updatedAt: selected.updated_at, sources: rows.results.map(asPublicSource)
    };
  });
