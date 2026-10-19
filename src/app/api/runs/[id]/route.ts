import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { repo } from "@/lib/repo";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = repo(await getDb());
  const run = await r.getRun(Number((await params).id));
  if (!run) return NextResponse.json({ error: "run not found" }, { status: 404 });
  return NextResponse.json({ ...run, results: await r.listResults(run.id) });
}
