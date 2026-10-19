import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { MODELS } from "@/lib/pricing";
import { providerFor, type Effort } from "@/lib/providers";
import { repo } from "@/lib/repo";
import { executeRun } from "@/lib/runner";

export async function POST(request: Request) {
  const body = (await request.json()) as { version_id?: number; model?: string; effort?: Effort };
  const model = body.model ?? "mock";
  if (!body.version_id) return NextResponse.json({ error: "version_id is required" }, { status: 400 });
  if (!MODELS.includes(model)) {
    return NextResponse.json({ error: `model must be one of ${MODELS.join(", ")}` }, { status: 400 });
  }
  if (model !== "mock" && !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "set ANTHROPIC_API_KEY to run real models, or pick the mock model" }, { status: 400 });
  }
  try {
    const result = await executeRun(repo(await getDb()), providerFor(model), body.version_id, model, {
      effort: body.effort,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "run failed" }, { status: 500 });
  }
}
