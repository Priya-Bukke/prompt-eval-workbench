import type { Repo } from "./repo";
import type { MatchType } from "./types";

const CASES: [string, string][] = [
  ["I was charged twice for my October invoice.", "billing"],
  ["Can I get a refund for the annual plan?", "billing"],
  ["The payment page shows the wrong price.", "billing"],
  ["The dashboard crashes when I open the reports tab.", "technical"],
  ["Uploads fail with a timeout after 30 seconds.", "technical"],
  ["The app is very slow since yesterday's update.", "technical"],
  ["I forgot my password and the reset email never arrives.", "account"],
  ["How do I change the email address on my account?", "account"],
  ["Please turn on 2FA for my whole team.", "account"],
  ["Do you have an office in Berlin?", "other"],
  ["Is there a student discount on the price?", "billing"],
  ["Error 500 when I log in with Google.", "technical"],
];

/** Example prompt with two versions: v2 asks for JSON, which makes answers easier to check. */
export async function seedExample(r: Repo) {
  const existing = (await r.listPrompts()).find((p) => p.name === "Support ticket classifier");
  if (existing) return existing.id;

  const prompt = await r.createPrompt(
    "Support ticket classifier",
    "Route incoming support tickets to billing, technical, account or other.",
  );
  await r.addVersion(
    prompt.id,
    "Classify this support ticket as billing, technical, account or other.\n\nTicket: {{input}}",
    "First draft",
  );
  await r.addVersion(
    prompt.id,
    [
      "You route customer support tickets.",
      "Choose exactly one category: billing, technical, account, other.",
      'Reply with JSON only, for example {"category": "billing"}.',
      "",
      "Ticket: {{input}}",
    ].join("\n"),
    "Ask for JSON so the answer can be parsed",
  );
  for (const [input, label] of CASES) {
    const matchType: MatchType = "json_field";
    await r.addCase(prompt.id, input, `category=${label}`, matchType);
  }
  return prompt.id;
}
