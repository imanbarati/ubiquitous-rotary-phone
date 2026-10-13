PRAGMA foreign_keys = ON;

-- Query published material separately; public responses never serialize a private Soul.
CREATE TABLE IF NOT EXISTS soul_sources (
  source_id TEXT PRIMARY KEY,
  soul_id TEXT NOT NULL REFERENCES souls(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  public_slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  summary TEXT NOT NULL DEFAULT '' CHECK (length(summary) <= 500),
  category TEXT NOT NULL CHECK (category IN ('writings', 'interviews', 'technical', 'audio', 'other')),
  language TEXT NOT NULL CHECK (language IN ('fa', 'en', 'both')),
  content TEXT NOT NULL DEFAULT '',
  publication TEXT NOT NULL DEFAULT 'private' CHECK (publication IN ('private', 'public')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (soul_id, source_key)
);
CREATE INDEX IF NOT EXISTS soul_sources_public_idx ON soul_sources(publication, updated_at DESC);
CREATE INDEX IF NOT EXISTS soul_sources_soul_idx ON soul_sources(soul_id, publication, updated_at DESC);
