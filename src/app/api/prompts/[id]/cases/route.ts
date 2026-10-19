import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { repo } from "@/lib/repo";
import type { MatchType } from "@/lib/types";

const MATCH_TYPES: MatchType[] = ["exact", "contains", "regex", "json_field"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const promptId = Number((await params).id);
  const body = (await request.json()) as { input?: string; expected?: string; match_type?: MatchType };
  if (!body.input?.trim() || !body.expected?.trim()) {
    return NextResponse.json({ error: "input and expected are required" }, { status: 400 });
  }
  const matchType = body.match_type ?? "exact";
  if (!MATCH_TYPES.includes(matchType)) {
    return NextResponse.json({ error: `match_type must be one of ${MATCH_TYPES.join(", ")}` }, { status: 400 });
  }
  const r = repo(await getDb());
  if (!(await r.getPrompt(promptId))) {
    return NextResponse.json({ error: "prompt not found" }, { status: 404 });
  }
  const testCase = await r.addCase(promptId, body.input.trim(), body.expected.trim(), matchType);
  return NextResponse.json(testCase, { status: 201 });
}
