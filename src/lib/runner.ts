import { costUsd } from "./pricing";
import type { Effort, Provider } from "./providers";
import type { Repo } from "./repo";
import { renderTemplate, scoreOutput, summarize } from "./scoring";

/**
 * Run one prompt version against every test case of its prompt.
 * Cases run with limited concurrency; a failing call is recorded as a failed case, not a failed run.
 */
export async function executeRun(
  r: Repo,
  provider: Provider,
  versionId: number,
  model: string,
  options: { concurrency?: number; effort?: Effort; now?: () => number } = {},
) {
  const version = await r.getVersion(versionId);
  if (!version) throw new Error(`Unknown version ${versionId}`);
  const cases = await r.listCases(version.prompt_id);
  const run = await r.createRun(versionId, model);
  const now = options.now ?? (() => performance.now());

  const results: { passed: boolean; latency_ms: number; cost_usd: number }[] = [];
  const queue = [...cases];
  const worker = async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      const started = now();
      let output = "";
      let error: string | null = null;
      let inputTokens = 0;
      let outputTokens = 0;
      try {
        const completion = await provider.complete(model, renderTemplate(version.template, c.input), options.effort);
        output = completion.text;
        inputTokens = completion.inputTokens;
        outputTokens = completion.outputTokens;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
      const latency = now() - started;
      const cost = costUsd(model, inputTokens, outputTokens);
      const passed = error === null && scoreOutput(output, c.expected, c.match_type);
      results.push({ passed, latency_ms: latency, cost_usd: cost });
      await r.addResult({
        run_id: run.id,
        test_case_id: c.id,
        output,
        passed,
        latency_ms: latency,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        error,
      });
    }
  };

  try {
    await Promise.all(Array.from({ length: Math.max(1, options.concurrency ?? 4) }, worker));
    const metrics = summarize(results);
    await r.finishRun(run.id, "done", metrics);
    return { runId: run.id, ...metrics };
  } catch (e) {
    await r.finishRun(run.id, "failed", summarize(results));
    throw e;
  }
}
