-- ISLAAH admin dashboard: accounts, editable content and anonymous counts.

CREATE TABLE users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  name           TEXT    NOT NULL DEFAULT '',
  role           TEXT    NOT NULL CHECK (role IN ('admin', 'editor')),
  -- "pbkdf2$<iterations>$<salt>$<hash>", NULL until the invite is accepted
  pw             TEXT,
  disabled       INTEGER NOT NULL DEFAULT 0,
  failed         INTEGER NOT NULL DEFAULT 0,
  locked_until   INTEGER NOT NULL DEFAULT 0,
  -- SHA-256 of the one-time invite / reset link token
  invite_hash    TEXT,
  invite_expires INTEGER,
  created_at     INTEGER NOT NULL
);

CREATE TABLE sessions (
  -- SHA-256 of the cookie value; the raw token is never stored
  token_hash TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);

-- One row per episode; `data` is the full EpisodeRecord as JSON.
CREATE TABLE episodes (
  id         TEXT    PRIMARY KEY,
  sort       INTEGER NOT NULL,
  published  INTEGER NOT NULL,
  data       TEXT    NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT
);

-- Edited page text and settings; a missing key means "use the shipped text".
CREATE TABLE docs (
  key        TEXT    PRIMARY KEY,
  data       TEXT    NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT
);

-- Page views per day and page. Nothing about the visitor is stored.
CREATE TABLE pageviews (
  day   TEXT    NOT NULL,
  path  TEXT    NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

-- Who changed what, shown on the dashboard.
CREATE TABLE audit (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  at     INTEGER NOT NULL,
  user   TEXT    NOT NULL,
  action TEXT    NOT NULL,
  target TEXT
);
