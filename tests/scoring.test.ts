import { describe, expect, it } from "vitest";
import { extractJsonObject, renderTemplate, scoreOutput, summarize } from "../src/lib/scoring";

describe("scoreOutput", () => {
  it("exact ignores case and extra whitespace", () => {
    expect(scoreOutput("  Billing \n", "billing", "exact")).toBe(true);
    expect(scoreOutput("billing.", "billing", "exact")).toBe(false);
  });

  it("contains finds the expected text anywhere", () => {
    expect(scoreOutput("The category is Technical.", "technical", "contains")).toBe(true);
  });

  it("regex matches and treats an invalid pattern as a failure", () => {
    expect(scoreOutput("order 12345", "\\d{5}", "regex")).toBe(true);
    expect(scoreOutput("anything", "(", "regex")).toBe(false);
  });

  it("json_field reads a field from JSON wrapped in prose or code fences", () => {
    const out = 'Sure!\n```json\n{"category": "Account"}\n```';
    expect(scoreOutput(out, "category=account", "json_field")).toBe(true);
    expect(scoreOutput(out, "category=billing", "json_field")).toBe(false);
    expect(scoreOutput("no json here", "category=account", "json_field")).toBe(false);
    expect(scoreOutput('{"label": "account"}', "category=account", "json_field")).toBe(false);
  });
});

describe("extractJsonObject", () => {
  it("ignores trailing braces that are not part of the object", () => {
    expect(extractJsonObject('{"a": 1} and then }')).toEqual({ a: 1 });
  });

  it("rejects arrays", () => {
    expect(extractJsonObject("[1, 2]")).toBeNull();
  });
});

describe("renderTemplate", () => {
  it("replaces every placeholder", () => {
    expect(renderTemplate("{{input}} / {{input}}", "x")).toBe("x / x");
  });
});

describe("summarize", () => {
  it("computes accuracy, mean latency and total cost", () => {
    const m = summarize([
      { passed: true, latency_ms: 100, cost_usd: 0.001 },
      { passed: false, latency_ms: 300, cost_usd: 0.003 },
    ]);
    expect(m.accuracy).toBe(0.5);
    expect(m.avgLatencyMs).toBe(200);
    expect(m.totalCostUsd).toBeCloseTo(0.004);
  });

  it("returns zeros for an empty run", () => {
    expect(summarize([])).toEqual({ accuracy: 0, avgLatencyMs: 0, totalCostUsd: 0 });
  });
});
