export type MatchType = "exact" | "contains" | "regex" | "json_field";

export interface Prompt {
  id: number;
  name: string;
  description: string;
}

export interface PromptVersion {
  id: number;
  prompt_id: number;
  version: number;
  template: string;
  note: string;
}

export interface TestCase {
  id: number;
  prompt_id: number;
  input: string;
  expected: string;
  match_type: MatchType;
}

export interface Run {
  id: number;
  version_id: number;
  model: string;
  status: "running" | "done" | "failed";
  accuracy: number | null;
  avg_latency_ms: number | null;
  total_cost_usd: number | null;
  created_at: string;
}

export interface RunResult {
  id: number;
  run_id: number;
  test_case_id: number;
  output: string;
  passed: boolean;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  error: string | null;
}

/** A run joined with the version it executed, used on comparison views. */
export interface RunSummary extends Run {
  version: number;
  prompt_id: number;
}
