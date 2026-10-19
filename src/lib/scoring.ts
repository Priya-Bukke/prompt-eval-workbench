import type { MatchType } from "./types";

const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Decide whether a model output passes a test case.
 *
 * exact       normalized output equals expected (case and whitespace insensitive)
 * contains    expected text appears anywhere in the output
 * regex       expected is a regular expression that must match the output
 * json_field  expected is `field=value`; the output must contain a JSON object whose field equals value
 */
export function scoreOutput(output: string, expected: string, matchType: MatchType): boolean {
  switch (matchType) {
    case "exact":
      return normalize(output) === normalize(expected);
    case "contains":
      return normalize(output).includes(normalize(expected));
    case "regex":
      try {
        return new RegExp(expected, "i").test(output);
      } catch {
        return false;
      }
    case "json_field": {
      const eq = expected.indexOf("=");
      if (eq < 1) return false;
      const field = expected.slice(0, eq).trim();
      const want = expected.slice(eq + 1).trim();
      const obj = extractJsonObject(output);
      if (!obj || !(field in obj)) return false;
      return normalize(String(obj[field])) === normalize(want);
    }
  }
}

/** Models often wrap JSON in prose or code fences; take the first parseable object. */
export function extractJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  for (let end = text.lastIndexOf("}"); end > start; end = text.lastIndexOf("}", end - 1)) {
    try {
      const parsed: unknown = JSON.parse(text.slice(start, end + 1));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // keep shrinking the candidate
    }
  }
  return null;
}

export function renderTemplate(template: string, input: string): string {
  return template.replaceAll("{{input}}", input);
}

export interface RunMetrics {
  accuracy: number;
  avgLatencyMs: number;
  totalCostUsd: number;
}

export function summarize(
  results: { passed: boolean; latency_ms: number; cost_usd: number }[],
): RunMetrics {
  if (results.length === 0) return { accuracy: 0, avgLatencyMs: 0, totalCostUsd: 0 };
  const passed = results.filter((r) => r.passed).length;
  const latency = results.reduce((sum, r) => sum + r.latency_ms, 0);
  const cost = results.reduce((sum, r) => sum + r.cost_usd, 0);
  return {
    accuracy: passed / results.length,
    avgLatencyMs: latency / results.length,
    totalCostUsd: cost,
  };
}
