import Link from "next/link";
import { LoadExampleButton, NewPromptForm } from "@/components/forms";
import { getDb } from "@/lib/db";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const prompts = await repo(await getDb()).listPrompts();
  return (
    <>
      <h1>Prompts</h1>
      <p className="muted">Save a prompt, add test cases, then run versions against models and compare them.</p>

      {prompts.length === 0 ? (
        <p>No prompts yet. <LoadExampleButton /></p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Description</th><th>Versions</th><th>Test cases</th></tr>
            </thead>
            <tbody>
              {prompts.map((p) => (
                <tr key={p.id}>
                  <td><Link href={`/prompts/${p.id}`}>{p.name}</Link></td>
                  <td>{p.description}</td>
                  <td>{p.versions}</td>
                  <td>{p.cases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>New prompt</h2>
      <NewPromptForm />
    </>
  );
}
