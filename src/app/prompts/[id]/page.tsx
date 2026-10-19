import Link from "next/link";
import { notFound } from "next/navigation";
import { AddCaseForm, AddVersionForm, RunForm } from "@/components/forms";
import { ms, pct, usd } from "@/components/MetricCards";
import { getDb } from "@/lib/db";
import { MODELS } from "@/lib/pricing";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const r = repo(await getDb());
  const prompt = await r.getPrompt(Number((await params).id));
  if (!prompt) notFound();
  const [versions, cases, runs] = await Promise.all([
    r.listVersions(prompt.id),
    r.listCases(prompt.id),
    r.listRuns(prompt.id),
  ]);
  const latest = versions.at(-1);
  const doneRuns = runs.filter((run) => run.status === "done");

  return (
    <>
      <h1>{prompt.name}</h1>
      <p className="muted">{prompt.description}</p>

      <h2>Runs</h2>
      {versions.length > 0 && cases.length > 0 ? (
        <RunForm versions={versions} models={MODELS} />
      ) : (
        <p className="muted">Add at least one version and one test case to start a run.</p>
      )}
      {runs.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Run</th><th>Version</th><th>Model</th><th>Accuracy</th><th>Avg latency</th><th>Cost</th><th>Status</th></tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td><Link href={`/runs/${run.id}`}>#{run.id}</Link></td>
                  <td>v{run.version}</td>
                  <td>{run.model}</td>
                  <td>{pct(run.accuracy)}</td>
                  <td>{ms(run.avg_latency_ms)}</td>
                  <td>{usd(run.total_cost_usd)}</td>
                  <td>{run.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {doneRuns.length >= 2 && (
        <p>
          <Link href={`/compare?a=${doneRuns[1]!.id}&b=${doneRuns[0]!.id}`}>
            Compare the last two runs (#{doneRuns[1]!.id} and #{doneRuns[0]!.id})
          </Link>
        </p>
      )}

      <h2>Versions</h2>
      {versions.map((v) => (
        <details key={v.id} open={v.id === latest?.id}>
          <summary>v{v.version} {v.note && <span className="muted">: {v.note}</span>}</summary>
          <pre className="diff">{v.template}</pre>
        </details>
      ))}
      <AddVersionForm promptId={prompt.id} latest={latest?.template ?? "Answer the question.\n\n{{input}}"} />

      <h2>Test cases ({cases.length})</h2>
      {cases.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Input</th><th>Expected</th><th>Match</th></tr></thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}><td>{c.input}</td><td><code>{c.expected}</code></td><td>{c.match_type}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AddCaseForm promptId={prompt.id} />
    </>
  );
}
