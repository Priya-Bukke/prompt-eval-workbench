import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { repo } from "@/lib/repo";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const promptId = Number((await params).id);
  const body = (await request.json()) as { template?: string; note?: string };
  if (!body.template?.includes("{{input}}")) {
    return NextResponse.json({ error: "template must contain {{input}}" }, { status: 400 });
  }
  const r = repo(await getDb());
  if (!(await r.getPrompt(promptId))) {
    return NextResponse.json({ error: "prompt not found" }, { status: 404 });
  }
  const version = await r.addVersion(promptId, body.template, body.note?.trim() ?? "");
  return NextResponse.json(version, { status: 201 });
}
