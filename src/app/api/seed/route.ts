import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { repo } from "@/lib/repo";
import { seedExample } from "@/lib/seed";

export async function POST() {
  const id = await seedExample(repo(await getDb()));
  return NextResponse.json({ id }, { status: 201 });
}
