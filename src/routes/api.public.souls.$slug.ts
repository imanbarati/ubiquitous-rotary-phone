import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { dbError, json, type PublicSourceRow } from "../lib/server";

function excerpt(value: string) { return value.replace(/\s+/g, " ").trim().slice(0, 180); }
function toPublicSource(source: PublicSourceRow) {
  return { title: source.title, summary: source.summary || excerpt(source.content), category: source.category, language: source.language, content: source.content };
}
export const Route = createFileRoute("/api/public/souls/$slug")({
  server: { handlers: {
    GET: async ({ params }) => {
      const error = dbError(); if (error) return error;
      try {
        const selected = await env.DB.prepare(
          "SELECT source_id,soul_id,public_slug,title,summary,category,language,content,updated_at FROM soul_sources WHERE public_slug=? AND publication='public' AND (length(content)>0 OR length(summary)>0)"
        ).bind(params.slug).first<PublicSourceRow>();
        if (!selected) return json({ error: "این منبع عمومی وجود ندارد." }, 404, { "X-Robots-Tag": "noindex, nofollow" });
        const result = await env.DB.prepare(
          "SELECT source_id,soul_id,public_slug,title,summary,category,language,content,updated_at FROM soul_sources WHERE soul_id=? AND publication='public' AND (length(content)>0 OR length(summary)>0) ORDER BY updated_at DESC"
        ).bind(selected.soul_id).all<PublicSourceRow>();
        const sources = result.results.map(toPublicSource);
        return json({ soul: { title: selected.title, description: selected.summary || excerpt(selected.content), data: { sources }, visibility: "public" } },
          200, { "X-Robots-Tag": "noindex, nofollow" });
      } catch {
        return json({ error: "منبع عمومی فعلاً در دسترس نیست." }, 503, { "X-Robots-Tag": "noindex, nofollow" });
      }
    }
  } }
});
