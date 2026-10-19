import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { repo } from "@/lib/repo";

export async function GET() {
  return NextResponse.json(await repo(await getDb()).listPrompts());
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; description?: string };
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  try {
    const prompt = await repo(await getDb()).createPrompt(name, body.description?.trim() ?? "");
    return NextResponse.json(prompt, { status: 201 });
  } catch {
    return NextResponse.json({ error: "a prompt with this name already exists" }, { status: 409 });
  }
}
