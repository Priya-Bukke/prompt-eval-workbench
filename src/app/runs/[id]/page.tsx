import Link from "next/link";
import { notFound } from "next/navigation";
import { MetricCards } from "@/components/MetricCards";
import { ResultsTable } from "@/components/ResultsTable";
import { getDb } from "@/lib/db";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const r = repo(await getDb());
  const run = await r.getRun(Number((await params).id));
  if (!run) notFound();
  const results = await r.listResults(run.id);
  return (
    <>
      <p><Link href={`/prompts/${run.prompt_id}`}>Back to prompt</Link></p>
      <h1>Run #{run.id}</h1>
      <p className="muted">Version v{run.version} on {run.model}, {run.status}</p>
      <MetricCards run={run} />
      <div className="table-wrap"><ResultsTable rows={results} /></div>
    </>
  );
}
