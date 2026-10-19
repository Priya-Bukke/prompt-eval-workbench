import Link from "next/link";
import { notFound } from "next/navigation";
import { MetricCards } from "@/components/MetricCards";
import { PromptDiff } from "@/components/PromptDiff";
import { ResultsTable } from "@/components/ResultsTable";
import { getDb } from "@/lib/db";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

/** Side by side view of two runs: metrics, the template diff, and every case where the outcome changed. */
export default async function ComparePage({ searchParams }: { searchParams: Promise<{ a?: string; b?: string }> }) {
  const { a, b } = await searchParams;
  const r = repo(await getDb());
  const [runA, runB] = await Promise.all([r.getRun(Number(a)), r.getRun(Number(b))]);
  if (!runA || !runB) notFound();
  const [versionA, versionB, resultsA, resultsB] = await Promise.all([
    r.getVersion(runA.version_id),
    r.getVersion(runB.version_id),
    r.listResults(runA.id),
    r.listResults(runB.id),
  ]);
  const flipped = resultsA.filter((x) => resultsB.find((y) => y.test_case_id === x.test_case_id)?.passed !== x.passed);

  return (
    <>
      <p><Link href={`/prompts/${runA.prompt_id}`}>Back to prompt</Link></p>
      <h1>Run #{runA.id} vs run #{runB.id}</h1>
      <div className="grid2">
        <div>
          <h2>A: v{runA.version} on {runA.model}</h2>
          <MetricCards run={runA} />
        </div>
        <div>
          <h2>B: v{runB.version} on {runB.model}</h2>
          <MetricCards run={runB} />
        </div>
      </div>

      <h2>Template diff</h2>
      <PromptDiff before={versionA?.template ?? ""} after={versionB?.template ?? ""} />

      <h2>Cases that changed ({flipped.length})</h2>
      <p className="muted">Highlighted rows passed in one run and failed in the other.</p>
      <div className="table-wrap"><ResultsTable rows={resultsA} compare={resultsB} /></div>
    </>
  );
}
