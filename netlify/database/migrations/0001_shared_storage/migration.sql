CREATE TABLE csv_shared_state (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  version BIGINT NOT NULL DEFAULT 1,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE csv_shared_mutations (
  id TEXT PRIMARY KEY,
  digest TEXT NOT NULL,
  version BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE csv_shared_files (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size > 0),
  parts INTEGER NOT NULL CHECK (parts > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
