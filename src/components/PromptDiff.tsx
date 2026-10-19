import { diffLines } from "@/lib/diff";

export function PromptDiff({ before, after }: { before: string; after: string }) {
  return (
    <pre className="diff">
      {diffLines(before, after).map((line, i) => (
        <div key={i} className={`diff-${line.kind}`}>
          {line.kind === "added" ? "+ " : line.kind === "removed" ? "- " : "  "}
          {line.text}
        </div>
      ))}
    </pre>
  );
}
