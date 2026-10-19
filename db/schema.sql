-- Prompt Eval Workbench schema (PostgreSQL)
-- A prompt has many versions and many test cases.
-- A run executes one version against every test case of its prompt with one model.

CREATE TABLE IF NOT EXISTS prompts (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id         SERIAL PRIMARY KEY,
  prompt_id  INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version    INTEGER NOT NULL,
  template   TEXT NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, version)
);

CREATE TABLE IF NOT EXISTS test_cases (
  id         SERIAL PRIMARY KEY,
  prompt_id  INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  input      TEXT NOT NULL,
  expected   TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'contains', 'regex', 'json_field')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runs (
  id          SERIAL PRIMARY KEY,
  version_id  INTEGER NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  model       TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('running', 'done', 'failed')),
  accuracy    DOUBLE PRECISION,
  avg_latency_ms DOUBLE PRECISION,
  total_cost_usd DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS run_results (
  id            SERIAL PRIMARY KEY,
  run_id        INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  test_case_id  INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  output        TEXT NOT NULL,
  passed        BOOLEAN NOT NULL,
  latency_ms    DOUBLE PRECISION NOT NULL,
  input_tokens  INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd      DOUBLE PRECISION NOT NULL,
  error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_cases_prompt ON test_cases(prompt_id);
CREATE INDEX IF NOT EXISTS idx_results_run ON run_results(run_id);
