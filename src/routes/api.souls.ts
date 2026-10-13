import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { slugify, validateSoulInput } from "../lib/domain";
import { currentUser, dbError, json, safeSoul, sourceSyncStatements, runD1Batch, type SoulRow, sameOrigin } from "../lib/server";

export const Route = createFileRoute("/api/souls")({
  server: { handlers: {
    GET: async ({ request }) => {
      const e = dbError(); if (e) return e;
      const u = await currentUser(request); if (!u) return json({ error: "ابتدا وارد حساب شوید." }, 401);
      const rs = await env.DB.prepare("SELECT * FROM souls WHERE owner_id=? ORDER BY updated_at DESC").bind(u.id).all<SoulRow>();
      return json({ souls: rs.results.map(safeSoul) });
    },
    POST: async ({ request }) => {
      const e = dbError(); if (e) return e;
      if (!sameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
      const u = await currentUser(request); if (!u) return json({ error: "ابتدا وارد حساب شوید." }, 401);
      let body: unknown; try { body = await request.json(); } catch { return json({ error: "JSON ارسالی معتبر نیست." }, 400); }
      const value = validateSoulInput(body); if (!value.ok) return json({ error: value.error }, 400);
      const id = crypto.randomUUID(), slug = slugify(value.value.title) + "-" + id.slice(0, 8);
      const insert = env.DB.prepare("INSERT INTO souls(id,owner_id,slug,title,description,data_json,visibility) VALUES(?,?,?,?,?,?,?)")
        .bind(id, u.id, slug, value.value.title, value.value.description, JSON.stringify(value.value.data), value.value.visibility);
      const saved = await runD1Batch([insert, ...sourceSyncStatements(id, value.value.data, u.id)]);
      if (!saved) return json({ error: "ذخیرهٔ روح انجام نشد." }, 500);
      const row = await env.DB.prepare("SELECT * FROM souls WHERE id=? AND owner_id=?").bind(id, u.id).first<SoulRow>();
      return json({ soul: row ? safeSoul(row) : null }, 201);
    }
  } }
});
