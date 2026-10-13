import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { dbError, json, type PublicSourceRow } from "../lib/server";

function excerpt(value: string) { return value.replace(/\s+/g, " ").trim().slice(0, 180); }

export const Route = createFileRoute("/api/public/souls")({
  server: { handlers: {
    GET: async () => {
      const error = dbError(); if (error) return error;
      try {
        const result = await env.DB.prepare(
          "SELECT source_id,soul_id,public_slug,title,summary,category,language,content,updated_at FROM soul_sources WHERE publication='public' AND (length(content)>0 OR length(summary)>0) ORDER BY updated_at DESC"
        ).all<PublicSourceRow>();
        const grouped = new Map<string, { slug: string; title: string; description: string; categories: string[]; language: string; sourceCount: number; updatedAt: string }>();
        for (const source of result.results) {
          const description = source.summary || excerpt(source.content);
          const soul = grouped.get(source.soul_id);
          if (!soul) grouped.set(source.soul_id, {
            slug: source.public_slug, title: source.title, description, categories: [source.category],
            language: source.language, sourceCount: 1, updatedAt: source.updated_at
          });
          else {
            if (!soul.categories.includes(source.category)) soul.categories.push(source.category);
            soul.sourceCount += 1;
            if (!soul.description && description) soul.description = description;
            if (soul.updatedAt < source.updated_at) soul.updatedAt = source.updated_at;
            if (soul.language !== source.language) soul.language = "both";
          }
        }
        return json({ souls: Array.from(grouped.values()) }, 200, { "X-Robots-Tag": "noindex, nofollow" });
      } catch {
        return json({ error: "فهرست عمومی فعلاً در دسترس نیست." }, 503, { "X-Robots-Tag": "noindex, nofollow" });
      }
    }
  } }
});
