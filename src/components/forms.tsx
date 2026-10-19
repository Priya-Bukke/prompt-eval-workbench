"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/** Posts JSON to an API route, shows any error, and refreshes the server rendered page on success. */
function useJsonPost() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function post(url: string, body: unknown): Promise<unknown> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `request failed (${res.status})`);
        return null;
      }
      router.refresh();
      return data;
    } finally {
      setBusy(false);
    }
  }
  return { post, error, busy };
}

const field = (form: HTMLFormElement, name: string) =>
  (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;

export function NewPromptForm() {
  const { post, error, busy } = useJsonPost();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (await post("/api/prompts", { name: field(form, "name"), description: field(form, "description") })) form.reset();
  }
  return (
    <form onSubmit={onSubmit} className="form">
      <input name="name" placeholder="Prompt name" required />
      <input name="description" placeholder="What is it for?" />
      <button disabled={busy}>Create prompt</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

export function LoadExampleButton() {
  const { post, error, busy } = useJsonPost();
  return (
    <>
      <button disabled={busy} onClick={() => post("/api/seed", {})}>Load example prompt</button>
      {error && <p className="error">{error}</p>}
    </>
  );
}

export function AddVersionForm({ promptId, latest }: { promptId: number; latest: string }) {
  const { post, error, busy } = useJsonPost();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    await post(`/api/prompts/${promptId}/versions`, { template: field(form, "template"), note: field(form, "note") });
  }
  return (
    <form onSubmit={onSubmit} className="form">
      <textarea name="template" rows={6} defaultValue={latest} required />
      <input name="note" placeholder="What changed and why?" />
      <button disabled={busy}>Save as new version</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

export function AddCaseForm({ promptId }: { promptId: number }) {
  const { post, error, busy } = useJsonPost();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = await post(`/api/prompts/${promptId}/cases`, {
      input: field(form, "input"),
      expected: field(form, "expected"),
      match_type: field(form, "match_type"),
    });
    if (ok) form.reset();
  }
  return (
    <form onSubmit={onSubmit} className="form inline">
      <input name="input" placeholder="Input" required />
      <input name="expected" placeholder="Expected (json_field: field=value)" required />
      <select name="match_type" defaultValue="exact">
        <option value="exact">exact</option>
        <option value="contains">contains</option>
        <option value="regex">regex</option>
        <option value="json_field">json_field</option>
      </select>
      <button disabled={busy}>Add test case</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

export function RunForm({ versions, models }: { versions: { id: number; version: number }[]; models: string[] }) {
  const { post, error, busy } = useJsonPost();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const effort = field(form, "effort");
    await post("/api/runs", {
      version_id: Number(field(form, "version_id")),
      model: field(form, "model"),
      ...(effort ? { effort } : {}),
    });
  }
  return (
    <form onSubmit={onSubmit} className="form inline">
      <select name="version_id" defaultValue={versions.at(-1)?.id}>
        {versions.map((v) => (
          <option key={v.id} value={v.id}>v{v.version}</option>
        ))}
      </select>
      <select name="model" defaultValue="mock">
        {models.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select name="effort" defaultValue="">
        <option value="">default effort</option>
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
      </select>
      <button disabled={busy}>{busy ? "Running..." : "Run all test cases"}</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
