import { describe, expect, it } from "vitest";
import { diffLines } from "../src/lib/diff";

describe("diffLines", () => {
  it("marks unchanged, removed and added lines", () => {
    expect(diffLines("a\nb\nc", "a\nx\nc")).toEqual([
      { kind: "same", text: "a" },
      { kind: "removed", text: "b" },
      { kind: "added", text: "x" },
      { kind: "same", text: "c" },
    ]);
  });

  it("handles a template that only grew", () => {
    expect(diffLines("a", "a\nb").map((l) => l.kind)).toEqual(["same", "added"]);
  });
});
