CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, member_email TEXT NOT NULL, member_name TEXT, title TEXT NOT NULL, note TEXT, event TEXT, object_key TEXT NOT NULL UNIQUE, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', review_note TEXT, reviewed_by TEXT, reviewed_at TEXT, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_member ON submissions (member_email, created_at DESC);
