-- BOXALMATCH — member submissions
-- Apply with:
--   wrangler d1 execute boxalmatch --remote --file=db/schema.sql
--
-- Pasting into the D1 dashboard console instead? Use db/schema-console.sql.
-- The console input is one line, so these -- comments would swallow the script.

CREATE TABLE IF NOT EXISTS submissions (
    id            TEXT PRIMARY KEY,           -- also the R2 key prefix
    member_email  TEXT NOT NULL,
    member_name   TEXT,
    title         TEXT NOT NULL,
    note          TEXT,
    event         TEXT,
    object_key    TEXT NOT NULL UNIQUE,
    content_type  TEXT NOT NULL,
    size_bytes    INTEGER NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
    review_note   TEXT,
    reviewed_by   TEXT,
    reviewed_at   TEXT,
    created_at    TEXT NOT NULL
);

-- The review queue reads by status, a member reads their own, both
-- newest first.
CREATE INDEX IF NOT EXISTS idx_submissions_status  ON submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_member  ON submissions (member_email, created_at DESC);
