import { describe, expect, it } from "vitest";
import { publicSourceSlug, slugify, validateSoulInput } from "../src/lib/domain";

describe("Soul validation", () => {
  it("creates readable slugs", () => expect(slugify("The Quiet Architect")).toBe("the-quiet-architect"));
  it("keeps Unicode letters", () => expect(slugify("درون آرام")).toBe("درون-آرام"));
  it("defaults to private", () => expect(validateSoulInput({ title: "First" })).toEqual({
    ok: true, value: { title: "First", description: "", data: {}, visibility: "private" }
  }));
  it("rejects arrays and unsupported visibility", () => {
    expect(validateSoulInput([]).ok).toBe(false);
    expect(validateSoulInput({ title: "A", data: [] }).ok).toBe(false);
    expect(validateSoulInput({ title: "A", visibility: "world" }).ok).toBe(false);
  });
  it("limits titles and data size", () => {
    expect(validateSoulInput({ title: " " }).ok).toBe(false);
    expect(validateSoulInput({ title: "x".repeat(101) }).ok).toBe(false);
    expect(validateSoulInput({ title: "A", data: { x: "x".repeat(25000) } }).ok).toBe(false);
  });
  it("keeps sources private when the public tag is missing", () => {
    const result = validateSoulInput({ title: "Archive", data: { sources: [{ title: "Draft", content: "secret" }] } });
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.value.data.sources as Array<{ publication: string }>)[0].publication).toBe("private");
  });
  it("accepts only the exact public tag", () => {
    const result = validateSoulInput({ title: "Archive", data: { sources: [
      { id: "550e8400-e29b-41d4-a716-446655440000", title: "Public", content: "yes", publication: "public" },
      { id: "550e8400-e29b-41d4-a716-446655440001", title: "Unknown", content: "no", publication: "PUBLIC" },
      { id: "550e8400-e29b-41d4-a716-446655440002", title: "Missing", content: "no" }
    ] } });
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.value.data.sources as Array<{ publication: string }>).map(source => source.publication)).toEqual(["public", "private", "private"]);
  });
  it("rejects malformed source entries and source arrays", () => {
    expect(validateSoulInput({ title: "Archive", data: { sources: "not an array" } }).ok).toBe(false);
    expect(validateSoulInput({ title: "Archive", data: { sources: [{ title: "", content: "" }] } }).ok).toBe(false);
  });
  it("builds stable non-identifying public URLs", () => {
    const slug = publicSourceSlug("soul-id", "source-id", "عنوان عمومی");
    expect(slug).toMatch(/^عنوان-عمومی-[0-9a-f]{32}$/u);
    expect(slug).not.toContain("soul-id");
    expect(slug).not.toContain("source-id");
  });
});
