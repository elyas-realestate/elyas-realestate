import { describe, it, expect } from "vitest";
import { mergeRules, evaluate, rulesToPromptText, type ApprovalRules } from "../approval-gates";

describe("mergeRules", () => {
  it("returns empty rules when both inputs are null/undefined", () => {
    const merged = mergeRules(null, null);
    expect(merged.max_amount_sar).toBeUndefined();
    expect(merged.block_actions).toEqual([]);
    expect(merged.require_approval_for).toEqual([]);
  });

  it("uses defaults when overrides are absent", () => {
    const d: ApprovalRules = {
      max_amount_sar: 1000,
      block_actions: ["delete"],
      require_approval_for: ["sensitive"],
    };
    const merged = mergeRules(d, null);
    expect(merged.max_amount_sar).toBe(1000);
    expect(merged.block_actions).toEqual(["delete"]);
    expect(merged.require_approval_for).toEqual(["sensitive"]);
  });

  it("overrides max_amount_sar even when override value is 0", () => {
    const merged = mergeRules({ max_amount_sar: 1000 }, { max_amount_sar: 0 });
    expect(merged.max_amount_sar).toBe(0);
  });

  it("preserves default max_amount_sar when override is undefined", () => {
    const merged = mergeRules({ max_amount_sar: 1000 }, {});
    expect(merged.max_amount_sar).toBe(1000);
  });

  it("unions block_actions arrays (deduplicated)", () => {
    const merged = mergeRules({ block_actions: ["a", "b"] }, { block_actions: ["b", "c"] });
    expect(merged.block_actions?.sort()).toEqual(["a", "b", "c"]);
  });

  it("unions require_approval_for arrays (deduplicated)", () => {
    const merged = mergeRules(
      { require_approval_for: ["x", "y"] },
      { require_approval_for: ["y", "z"] }
    );
    expect(merged.require_approval_for?.sort()).toEqual(["x", "y", "z"]);
  });
});

describe("evaluate — allowed (no rules trigger)", () => {
  it("allows when rules are empty", () => {
    const verdict = evaluate({}, { action_kind: "send_message" });
    expect(verdict.decision).toBe("allowed");
  });

  it("allows when action and tags are not in any list", () => {
    const verdict = evaluate(
      { block_actions: ["delete"], require_approval_for: ["sensitive"] },
      { action_kind: "send_message", tags: ["greeting"] }
    );
    expect(verdict.decision).toBe("allowed");
  });

  it("allows when amount is below the limit", () => {
    const verdict = evaluate(
      { max_amount_sar: 1000 },
      { action_kind: "issue_invoice", amount_sar: 500 }
    );
    expect(verdict.decision).toBe("allowed");
  });

  it("allows when amount equals the limit (max is inclusive lower bound)", () => {
    const verdict = evaluate(
      { max_amount_sar: 1000 },
      { action_kind: "issue_invoice", amount_sar: 1000 }
    );
    expect(verdict.decision).toBe("allowed");
  });
});

describe("evaluate — blocked actions (critical)", () => {
  it("flags critical when action_kind is blocked", () => {
    const verdict = evaluate({ block_actions: ["delete"] }, { action_kind: "delete" });
    expect(verdict.decision).toBe("needs_approval");
    if (verdict.decision === "needs_approval") {
      expect(verdict.severity).toBe("critical");
      expect(verdict.reason).toContain("delete");
    }
  });

  it("flags critical when a tag is in block_actions", () => {
    const verdict = evaluate(
      { block_actions: ["sensitive_data"] },
      { action_kind: "send_message", tags: ["sensitive_data"] }
    );
    expect(verdict.decision).toBe("needs_approval");
    if (verdict.decision === "needs_approval") {
      expect(verdict.severity).toBe("critical");
      expect(verdict.reason).toContain("sensitive_data");
    }
  });
});

describe("evaluate — require_approval_for (warning)", () => {
  it("flags warning when a tag is in require_approval_for", () => {
    const verdict = evaluate(
      { require_approval_for: ["price_quote"] },
      { action_kind: "send_message", tags: ["price_quote"] }
    );
    expect(verdict.decision).toBe("needs_approval");
    if (verdict.decision === "needs_approval") {
      expect(verdict.severity).toBe("warning");
      expect(verdict.reason).toContain("price_quote");
    }
  });

  it("ignores require_approval_for when no tag matches", () => {
    const verdict = evaluate(
      { require_approval_for: ["price_quote"] },
      { action_kind: "send_message", tags: ["greeting"] }
    );
    expect(verdict.decision).toBe("allowed");
  });
});

describe("evaluate — amount limit (warning)", () => {
  it("flags warning when amount exceeds max_amount_sar", () => {
    const verdict = evaluate(
      { max_amount_sar: 1000 },
      { action_kind: "issue_invoice", amount_sar: 5000 }
    );
    expect(verdict.decision).toBe("needs_approval");
    if (verdict.decision === "needs_approval") {
      expect(verdict.severity).toBe("warning");
      expect(verdict.reason).toMatch(/5,?[\s٬]?000/);
    }
  });

  it("ignores amount check when amount is not provided", () => {
    const verdict = evaluate({ max_amount_sar: 1000 }, { action_kind: "send_message" });
    expect(verdict.decision).toBe("allowed");
  });

  it("ignores amount check when max_amount_sar is not set", () => {
    const verdict = evaluate({}, { action_kind: "issue_invoice", amount_sar: 10_000_000 });
    expect(verdict.decision).toBe("allowed");
  });
});

describe("evaluate — precedence (blocked > require > amount)", () => {
  it("returns blocked-critical before warning-tag", () => {
    const verdict = evaluate(
      {
        block_actions: ["delete"],
        require_approval_for: ["delete"],
      },
      { action_kind: "delete", tags: ["delete"] }
    );
    expect(verdict.decision).toBe("needs_approval");
    if (verdict.decision === "needs_approval") {
      expect(verdict.severity).toBe("critical");
    }
  });

  it("returns warning-tag before warning-amount", () => {
    const verdict = evaluate(
      {
        require_approval_for: ["price_quote"],
        max_amount_sar: 100,
      },
      {
        action_kind: "send_message",
        tags: ["price_quote"],
        amount_sar: 999999,
      }
    );
    expect(verdict.decision).toBe("needs_approval");
    if (verdict.decision === "needs_approval") {
      // tag-based approval check comes before amount check; both warning
      expect(verdict.reason).toContain("price_quote");
    }
  });
});

describe("rulesToPromptText", () => {
  it("returns empty string when rules are empty", () => {
    expect(rulesToPromptText({})).toBe("");
  });

  it("returns empty string when no fields are populated", () => {
    expect(rulesToPromptText({ block_actions: [], require_approval_for: [] })).toBe("");
  });

  it("includes amount limit when set", () => {
    const text = rulesToPromptText({ max_amount_sar: 1000 });
    expect(text).toMatch(/الحد المالي/);
    expect(text).toMatch(/1,?[\s٬]?000/);
  });

  it("includes block_actions section", () => {
    const text = rulesToPromptText({ block_actions: ["delete", "publish"] });
    expect(text).toMatch(/محجوبة/);
    expect(text).toContain("delete");
    expect(text).toContain("publish");
  });

  it("includes require_approval_for section", () => {
    const text = rulesToPromptText({ require_approval_for: ["price_quote"] });
    expect(text).toMatch(/تتطلب موافقة/);
    expect(text).toContain("price_quote");
  });

  it("includes the escalation reminder line", () => {
    const text = rulesToPromptText({ block_actions: ["delete"] });
    expect(text).toMatch(/CEO/);
  });

  it("emits all sections together when all fields are present", () => {
    const text = rulesToPromptText({
      max_amount_sar: 1000,
      block_actions: ["delete"],
      require_approval_for: ["price_quote"],
    });
    expect(text).toMatch(/الحد المالي/);
    expect(text).toMatch(/محجوبة/);
    expect(text).toMatch(/تتطلب موافقة/);
  });
});
