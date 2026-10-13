import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { validateSoulInput } from "../lib/domain";
import { currentUser, dbError, json, safeSoul, sourceSyncStatements, runD1Batch, type SoulRow, sameOrigin } from "../lib/server";

export const Route = createFileRoute("/api/souls/$id")({
  server: { handlers: {
    GET: async ({ request, params }) => {
      const e = dbError(); if (e) return e;
      const u = await currentUser(request); if (!u) return json({ error: "ابتدا وارد حساب شوید." }, 401);
      const row = await env.DB.prepare("SELECT * FROM souls WHERE id=? AND owner_id=?").bind(params.id, u.id).first<SoulRow>();
      return row ? json({ soul: safeSoul(row) }) : json({ error: "روح پیدا نشد." }, 404);
    },
    PUT: async ({ request, params }) => {
      const e = dbError(); if (e) return e;
      if (!sameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
      const u = await currentUser(request); if (!u) return json({ error: "ابتدا وارد حساب شوید." }, 401);
      let body: unknown; try { body = await request.json(); } catch { return json({ error: "JSON ارسالی معتبر نیست." }, 400); }
      const value = validateSoulInput(body); if (!value.ok) return json({ error: value.error }, 400);
      const update = env.DB.prepare("UPDATE souls SET title=?,description=?,data_json=?,visibility=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND owner_id=?")
        .bind(value.value.title, value.value.description, JSON.stringify(value.value.data), value.value.visibility, params.id, u.id);
      const saved = await runD1Batch([update, ...sourceSyncStatements(params.id, value.value.data)]);
      if (!saved) {
        const owned = await env.DB.prepare("SELECT id FROM souls WHERE id=? AND owner_id=?").bind(params.id, u.id).first<{ id: string }>();
        return owned ? json({ error: "به‌روزرسانی روح انجام نشد." }, 500) : json({ error: "روح پیدا نشد." }, 404);
      }
      const row = await env.DB.prepare("SELECT * FROM souls WHERE id=? AND owner_id=?").bind(params.id, u.id).first<SoulRow>();
      return row ? json({ soul: safeSoul(row) }) : json({ error: "روح پیدا نشد." }, 404);
    },
    DELETE: async ({ request, params }) => {
      const e = dbError(); if (e) return e;
      if (!sameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
      const u = await currentUser(request); if (!u) return json({ error: "ابتدا وارد حساب شوید." }, 401);
      const removed = await runD1Batch([
        env.DB.prepare("DELETE FROM soul_sources WHERE soul_id IN (SELECT id FROM souls WHERE id=? AND owner_id=?)").bind(params.id, u.id),
        env.DB.prepare("DELETE FROM souls WHERE id=? AND owner_id=?").bind(params.id, u.id)
      ]);
      return removed ? json({ ok: true }) : json({ error: "حذف روح انجام نشد." }, 500);
    }
  } }
});
