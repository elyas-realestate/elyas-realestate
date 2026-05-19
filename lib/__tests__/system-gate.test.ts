import { describe, it, expect } from "vitest";
import { estimateCallCost } from "../system-gate";

describe("estimateCallCost — known providers/models", () => {
  it("computes cost for gpt-4o-mini with default token counts", () => {
    // tokensIn=1000, tokensOut=500
    // gpt-4o-mini: in=0.15, out=0.60 per 1M
    // cost = (1000*0.15 + 500*0.60) / 1_000_000 = (150 + 300) / 1M = 0.00045
    const cost = estimateCallCost("openai", "gpt-4o-mini");
    expect(cost).toBeCloseTo(0.00045, 6);
  });

  it("computes cost for gpt-4o", () => {
    // gpt-4o: in=2.5, out=10.0
    // cost = (1000*2.5 + 500*10.0) / 1M = (2500 + 5000) / 1M = 0.0075
    const cost = estimateCallCost("openai", "gpt-4o");
    expect(cost).toBeCloseTo(0.0075, 6);
  });

  it("computes cost for claude-haiku-4-5", () => {
    // claude-haiku-4-5: in=1.0, out=5.0
    // cost = (1000*1.0 + 500*5.0) / 1M = 0.0035
    const cost = estimateCallCost("anthropic", "claude-haiku-4-5-20251001");
    expect(cost).toBeCloseTo(0.0035, 6);
  });

  it("computes cost for claude-sonnet-4-5", () => {
    // claude-sonnet-4-5: in=3.0, out=15.0
    // cost = (1000*3.0 + 500*15.0) / 1M = (3000 + 7500) / 1M = 0.0105
    const cost = estimateCallCost("anthropic", "claude-sonnet-4-5");
    expect(cost).toBeCloseTo(0.0105, 6);
  });

  it("returns zero cost for gemini-2.5-flash (free tier)", () => {
    expect(estimateCallCost("google", "gemini-2.5-flash")).toBe(0);
  });

  it("computes cost for gemini-2.5-pro", () => {
    // in=1.25, out=5.0
    // cost = (1000*1.25 + 500*5.0) / 1M = (1250 + 2500) / 1M = 0.00375
    const cost = estimateCallCost("google", "gemini-2.5-pro");
    expect(cost).toBeCloseTo(0.00375, 6);
  });

  it("computes cost for deepseek-chat", () => {
    // in=0.27, out=1.10
    // cost = (1000*0.27 + 500*1.10) / 1M = (270 + 550) / 1M = 0.00082
    const cost = estimateCallCost("deepseek", "deepseek-chat");
    expect(cost).toBeCloseTo(0.00082, 6);
  });

  it("computes cost for groq llama 3.3", () => {
    const cost = estimateCallCost("groq", "llama-3.3-70b-versatile");
    expect(cost).toBeCloseTo((1000 * 0.59 + 500 * 0.79) / 1_000_000, 6);
  });

  it("computes cost for xai grok-3", () => {
    // in=5.0, out=15.0
    const cost = estimateCallCost("xai", "grok-3");
    expect(cost).toBeCloseTo(0.0125, 6);
  });
});

describe("estimateCallCost — custom token counts", () => {
  it("scales linearly with input tokens", () => {
    const base = estimateCallCost("openai", "gpt-4o-mini", 1000, 0);
    const doubled = estimateCallCost("openai", "gpt-4o-mini", 2000, 0);
    expect(doubled).toBeCloseTo(base * 2, 8);
  });

  it("scales linearly with output tokens", () => {
    const base = estimateCallCost("openai", "gpt-4o-mini", 0, 1000);
    const doubled = estimateCallCost("openai", "gpt-4o-mini", 0, 2000);
    expect(doubled).toBeCloseTo(base * 2, 8);
  });

  it("returns 0 when both token counts are 0", () => {
    expect(estimateCallCost("openai", "gpt-4o", 0, 0)).toBe(0);
  });
});

describe("estimateCallCost — unknown models fallback", () => {
  it("falls back to a default rate for an unknown provider/model", () => {
    // fallback: in=0.5, out=2.0
    // cost = (1000*0.5 + 500*2.0) / 1M = (500 + 1000) / 1M = 0.0015
    const cost = estimateCallCost("acme", "future-model-v9");
    expect(cost).toBeCloseTo(0.0015, 6);
  });

  it("returns a positive cost for an unknown model", () => {
    // The fallback rate (in=0.5, out=2.0) is always > 0 for nonzero tokens
    expect(estimateCallCost("acme", "ultra-model-v99")).toBeGreaterThan(0);
  });
});
