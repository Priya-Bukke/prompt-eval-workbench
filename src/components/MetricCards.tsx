import type { Run } from "@/lib/types";

export const pct = (x: number | null) => (x === null ? "n/a" : `${(x * 100).toFixed(1)}%`);
export const ms = (x: number | null) => (x === null ? "n/a" : `${Math.round(x)} ms`);
export const usd = (x: number | null) => (x === null ? "n/a" : `$${x.toFixed(4)}`);

export function MetricCards({ run }: { run: Pick<Run, "accuracy" | "avg_latency_ms" | "total_cost_usd"> }) {
  return (
    <div className="cards">
      <div className="card">
        <span className="label">Accuracy</span>
        <span className="value">{pct(run.accuracy)}</span>
      </div>
      <div className="card">
        <span className="label">Avg latency</span>
        <span className="value">{ms(run.avg_latency_ms)}</span>
      </div>
      <div className="card">
        <span className="label">Total cost</span>
        <span className="value">{usd(run.total_cost_usd)}</span>
      </div>
    </div>
  );
}
