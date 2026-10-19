import type { RunResult } from "@/lib/types";

export type ResultRow = RunResult & { input: string; expected: string };

/** One row per test case; pass `compare` to show a second run's outcome next to the first. */
export function ResultsTable({ rows, compare }: { rows: ResultRow[]; compare?: ResultRow[] }) {
  const other = new Map(compare?.map((r) => [r.test_case_id, r]));
  return (
    <table>
      <thead>
        <tr>
          <th>Input</th>
          <th>Expected</th>
          <th>Output</th>
          <th>Result</th>
          {compare && <th>Output B</th>}
          {compare && <th>Result B</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const b = other.get(r.test_case_id);
          const changed = b && b.passed !== r.passed;
          return (
            <tr key={r.id} className={changed ? "changed" : undefined}>
              <td>{r.input}</td>
              <td><code>{r.expected}</code></td>
              <td><code>{r.error ?? r.output}</code></td>
              <td><Badge passed={r.passed} /></td>
              {compare && <td><code>{b ? (b.error ?? b.output) : ""}</code></td>}
              {compare && <td>{b && <Badge passed={b.passed} />}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Badge({ passed }: { passed: boolean }) {
  return <span className={passed ? "badge pass" : "badge fail"}>{passed ? "pass" : "fail"}</span>;
}
