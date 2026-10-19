# Design spec: Prompt Eval Workbench

## Problem

When a team changes a prompt, they usually check a few examples by hand and ship it. Nobody knows whether
the new version is better overall, whether it broke cases that used to work, or what it costs per call.

## Goal

A small internal tool where anyone on the team can:

1. save a prompt and its versions,
2. attach test cases with an expected answer,
3. run any version against any model in one click,
4. compare two runs side by side on accuracy, latency and cost, and see exactly which cases changed.

Out of scope for the first version: user accounts, background job queues, streaming progress, LLM as a judge.

## Data model

```
prompts 1 ── n prompt_versions 1 ── n runs 1 ── n run_results n ── 1 test_cases n ── 1 prompts
```

* Versions are immutable and numbered per prompt (v1, v2, ...). Editing creates a new version, so old runs
  always point at the exact text they used.
* Test cases belong to the prompt, not to a version, so every version is measured on the same set.
* A run stores its summary metrics (accuracy, mean latency, total cost) so list views do not aggregate.
* Each result keeps the raw output, token counts and any error, so a failure can be inspected later.

## Scoring

| match type   | passes when                                                       |
|--------------|-------------------------------------------------------------------|
| `exact`      | output equals expected, ignoring case and extra whitespace        |
| `contains`   | expected appears in the output                                    |
| `regex`      | expected (a regular expression) matches the output                |
| `json_field` | expected is `field=value`; the first JSON object in the output has that value |

`json_field` searches for the first parseable object, because models often wrap JSON in prose or code fences.

## Decisions and tradeoffs

* **Runs execute inside the API request.** Simple and fine for tens of cases. With hundreds of cases this
  should move to a queue (for example Temporal or a jobs table) with progress polling.
* **A provider error fails one case, not the whole run.** A rate limit on case 7 should not throw away
  cases 1 to 6. The error text is stored and shown in the table.
* **PGlite for development and tests, PostgreSQL in production.** The same SQL runs on both, so tests
  exercise the real schema without a database server, and CI needs no services.
* **Cost comes from a price table in code** (`src/lib/pricing.ts`) multiplied by the token counts the API
  returns, so it is exact for the tokens used and easy to update when prices change.
* **A deterministic mock model** makes the app usable without an API key and keeps tests stable.

## Next steps

* LLM as a judge match type for open ended answers, with its own agreement check against human labels.
* Repeat each case N times to measure variance, not just a single sample.
* Export a run as CSV and a GitHub Action that fails a pull request if accuracy drops.
