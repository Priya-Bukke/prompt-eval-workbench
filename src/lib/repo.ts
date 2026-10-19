import type { Db } from "./db";
import type { MatchType, Prompt, PromptVersion, Run, RunResult, RunSummary, TestCase } from "./types";

/** All SQL lives here, so pages and API routes only deal with typed objects. */
export function repo(db: Db) {
  return {
    async listPrompts() {
      const { rows } = await db.query<Prompt & { versions: number; cases: number }>(
        `SELECT p.id, p.name, p.description,
                (SELECT count(*)::int FROM prompt_versions v WHERE v.prompt_id = p.id) AS versions,
                (SELECT count(*)::int FROM test_cases c WHERE c.prompt_id = p.id) AS cases
           FROM prompts p ORDER BY p.id`,
      );
      return rows;
    },

    async getPrompt(id: number) {
      const { rows } = await db.query<Prompt>(
        "SELECT id, name, description FROM prompts WHERE id = $1",
        [id],
      );
      return rows[0] ?? null;
    },

    async createPrompt(name: string, description = "") {
      const { rows } = await db.query<Prompt>(
        "INSERT INTO prompts (name, description) VALUES ($1, $2) RETURNING id, name, description",
        [name, description],
      );
      return rows[0]!;
    },

    async listVersions(promptId: number) {
      const { rows } = await db.query<PromptVersion>(
        "SELECT id, prompt_id, version, template, note FROM prompt_versions WHERE prompt_id = $1 ORDER BY version",
        [promptId],
      );
      return rows;
    },

    async getVersion(id: number) {
      const { rows } = await db.query<PromptVersion>(
        "SELECT id, prompt_id, version, template, note FROM prompt_versions WHERE id = $1",
        [id],
      );
      return rows[0] ?? null;
    },

    /** Versions are numbered per prompt: 1, 2, 3 ... */
    async addVersion(promptId: number, template: string, note = "") {
      const { rows } = await db.query<PromptVersion>(
        `INSERT INTO prompt_versions (prompt_id, version, template, note)
         VALUES ($1, COALESCE((SELECT max(version) FROM prompt_versions WHERE prompt_id = $1), 0) + 1, $2, $3)
         RETURNING id, prompt_id, version, template, note`,
        [promptId, template, note],
      );
      return rows[0]!;
    },

    async listCases(promptId: number) {
      const { rows } = await db.query<TestCase>(
        "SELECT id, prompt_id, input, expected, match_type FROM test_cases WHERE prompt_id = $1 ORDER BY id",
        [promptId],
      );
      return rows;
    },

    async addCase(promptId: number, input: string, expected: string, matchType: MatchType) {
      const { rows } = await db.query<TestCase>(
        `INSERT INTO test_cases (prompt_id, input, expected, match_type) VALUES ($1, $2, $3, $4)
         RETURNING id, prompt_id, input, expected, match_type`,
        [promptId, input, expected, matchType],
      );
      return rows[0]!;
    },

    async createRun(versionId: number, model: string) {
      const { rows } = await db.query<Run>(
        "INSERT INTO runs (version_id, model, status) VALUES ($1, $2, 'running') RETURNING *",
        [versionId, model],
      );
      return rows[0]!;
    },

    async finishRun(
      runId: number,
      status: "done" | "failed",
      metrics: { accuracy: number; avgLatencyMs: number; totalCostUsd: number },
    ) {
      await db.query(
        "UPDATE runs SET status = $2, accuracy = $3, avg_latency_ms = $4, total_cost_usd = $5 WHERE id = $1",
        [runId, status, metrics.accuracy, metrics.avgLatencyMs, metrics.totalCostUsd],
      );
    },

    async addResult(r: Omit<RunResult, "id">) {
      await db.query(
        `INSERT INTO run_results
           (run_id, test_case_id, output, passed, latency_ms, input_tokens, output_tokens, cost_usd, error)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [r.run_id, r.test_case_id, r.output, r.passed, r.latency_ms, r.input_tokens, r.output_tokens, r.cost_usd, r.error],
      );
    },

    async getRun(id: number) {
      const { rows } = await db.query<RunSummary>(
        `SELECT r.*, v.version, v.prompt_id FROM runs r JOIN prompt_versions v ON v.id = r.version_id WHERE r.id = $1`,
        [id],
      );
      return rows[0] ?? null;
    },

    async listRuns(promptId: number) {
      const { rows } = await db.query<RunSummary>(
        `SELECT r.*, v.version, v.prompt_id FROM runs r JOIN prompt_versions v ON v.id = r.version_id
          WHERE v.prompt_id = $1 ORDER BY r.id DESC`,
        [promptId],
      );
      return rows;
    },

    async listResults(runId: number) {
      const { rows } = await db.query<RunResult & { input: string; expected: string; match_type: MatchType }>(
        `SELECT rr.*, c.input, c.expected, c.match_type FROM run_results rr
           JOIN test_cases c ON c.id = rr.test_case_id WHERE rr.run_id = $1 ORDER BY c.id`,
        [runId],
      );
      return rows;
    },
  };
}

export type Repo = ReturnType<typeof repo>;
