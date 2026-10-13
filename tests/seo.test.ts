import { describe, expect, it } from "vitest";
import { absoluteUrl, SITE_ORIGIN, xmlEscape } from "../src/lib/seo";

describe("SEO URL and XML helpers", () => {
  it("creates canonical absolute URLs from the production origin", () => {
    expect(absoluteUrl("/")).toBe(SITE_ORIGIN + "/");
    expect(absoluteUrl("/en/s/source-slug")).toBe(SITE_ORIGIN + "/en/s/source-slug");
  });
  it("escapes XML values safely", () => {
    expect(xmlEscape('A & B < "C">')).toBe("A &amp; B &lt; &quot;C&quot;&gt;");
  });
});
