import { beforeEach, describe, expect, it } from "vitest";
import { createDb } from "../src/lib/db";
import { mockProvider, type Provider } from "../src/lib/providers";
import { repo, type Repo } from "../src/lib/repo";
import { executeRun } from "../src/lib/runner";
import { seedExample } from "../src/lib/seed";

// Each test gets a fresh in memory PostgreSQL (PGlite), so the real schema and SQL are exercised.
let r: Repo;
beforeEach(async () => {
  r = repo(await createDb({ url: "", dataDir: "memory://" }));
});

describe("executeRun", () => {
  it("scores every case and stores the run metrics", async () => {
    const promptId = await seedExample(r);
    const [v1, v2] = await r.listVersions(promptId);

    const plain = await executeRun(r, mockProvider, v1!.id, "mock");
    const json = await executeRun(r, mockProvider, v2!.id, "mock");

    // v1 does not ask for JSON, so json_field checks fail; v2 does, so the mock classifier is scored.
    expect(plain.accuracy).toBe(0);
    expect(json.accuracy).toBeGreaterThan(0.8);

    const stored = await r.getRun(json.runId);
    expect(stored?.status).toBe("done");
    expect(stored?.accuracy).toBeCloseTo(json.accuracy);
    expect(await r.listResults(json.runId)).toHaveLength(12);
  });

  it("records a provider error as a failed case instead of aborting the run", async () => {
    const prompt = await r.createPrompt("echo");
    const v = await r.addVersion(prompt.id, "{{input}}");
    await r.addCase(prompt.id, "ok", "ok", "exact");
    await r.addCase(prompt.id, "boom", "boom", "exact");
    const flaky: Provider = {
      async complete(_model, text) {
        if (text === "boom") throw new Error("rate limited");
        return { text, inputTokens: 1, outputTokens: 1 };
      },
    };

    const result = await executeRun(r, flaky, v.id, "mock");
    const rows = await r.listResults(result.runId);

    expect(result.accuracy).toBe(0.5);
    expect(rows.find((x) => x.input === "boom")?.error).toBe("rate limited");
  });

  it("measures latency with the injected clock", async () => {
    const prompt = await r.createPrompt("clock");
    const v = await r.addVersion(prompt.id, "{{input}}");
    await r.addCase(prompt.id, "a", "a", "exact");
    let t = 0;
    const result = await executeRun(r, mockProvider, v.id, "mock", { now: () => (t += 250) });
    expect(result.avgLatencyMs).toBe(250);
  });
});

describe("repo", () => {
  it("numbers versions per prompt", async () => {
    const a = await r.createPrompt("a");
    const b = await r.createPrompt("b");
    await r.addVersion(a.id, "{{input}}");
    const second = await r.addVersion(a.id, "x {{input}}");
    const firstOfB = await r.addVersion(b.id, "{{input}}");
    expect(second.version).toBe(2);
    expect(firstOfB.version).toBe(1);
  });

  it("does not seed the example twice", async () => {
    const first = await seedExample(r);
    const again = await seedExample(r);
    expect(again).toBe(first);
    expect(await r.listCases(first)).toHaveLength(12);
  });
});
