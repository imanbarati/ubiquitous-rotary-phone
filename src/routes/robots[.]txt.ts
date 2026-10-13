import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "../lib/seo";

export const Route = createFileRoute("/robots.txt")({
  server: { handlers: {
    GET: async () => {
      const body = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /dashboard",
        "Disallow: /api/",
        "Sitemap: " + absoluteUrl("/sitemap.xml"),
        ""
      ].join("\n");
      return new Response(body, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" }
      });
    }
  } }
});
