import Anthropic from "@anthropic-ai/sdk";

export interface Completion {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export type Effort = "low" | "medium" | "high";

export interface Provider {
  complete(model: string, prompt: string, effort?: Effort): Promise<Completion>;
}

/**
 * Deterministic stand in for a model so the app, the tests and CI work without an API key.
 * It classifies support tickets by keyword and answers in JSON when the prompt asks for JSON.
 */
export const mockProvider: Provider = {
  async complete(_model, prompt) {
    const text = prompt.toLowerCase();
    const ticket = text.split("ticket:").pop() ?? text;
    let label = "other";
    if (/(invoice|charge|refund|payment|billed|price)/.test(ticket)) label = "billing";
    else if (/(error|crash|bug|slow|timeout|not loading|fails?)/.test(ticket)) label = "technical";
    else if (/(password|login|log in|email address|account|2fa)/.test(ticket)) label = "account";
    const out = text.includes("json") ? JSON.stringify({ category: label }) : label;
    return {
      text: out,
      inputTokens: Math.ceil(prompt.length / 4),
      outputTokens: Math.ceil(out.length / 4),
    };
  },
};

/** Claude through the official SDK. Reads ANTHROPIC_API_KEY from the environment. */
export function anthropicProvider(client = new Anthropic()): Provider {
  return {
    async complete(model, prompt, effort) {
      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
        ...(effort ? { output_config: { effort } } : {}),
      });
      if (response.stop_reason === "refusal") {
        throw new Error("The model declined this request");
      }
      const text = response.content
        .flatMap((block) => (block.type === "text" ? [block.text] : []))
        .join("");
      return {
        text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    },
  };
}

export function providerFor(model: string): Provider {
  return model === "mock" ? mockProvider : anthropicProvider();
}
