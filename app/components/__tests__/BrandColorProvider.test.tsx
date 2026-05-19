// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";

// Mock @/lib/supabase-browser — by default returns "no user / no row" so the
// provider falls through to local-cache only. Individual tests override.
const supabaseMock = vi.hoisted(() => ({
  auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  from: vi.fn(() => {
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => ({ data: null })),
    };
    return chain;
  }),
}));

vi.mock("@/lib/supabase-browser", () => ({ supabase: supabaseMock }));

// `@/lib/logger` is unused by this component, but other code paths may import
// it transitively — provide a noop so import resolution is safe.
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import BrandColorProvider from "../BrandColorProvider";

beforeEach(() => {
  // Reset DOM + localStorage between tests
  document.documentElement.removeAttribute("style");
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("BrandColorProvider — render", () => {
  it("renders nothing (returns null)", () => {
    const { container } = render(<BrandColorProvider />);
    expect(container.firstChild).toBeNull();
  });
});

describe("BrandColorProvider — local-cache first-paint", () => {
  it("applies cached accent from localStorage on mount", () => {
    localStorage.setItem("wasit_brand_accent", "#FF00FF");
    render(<BrandColorProvider />);
    expect(document.documentElement.style.getPropertyValue("--gold-1")).toBe("#FF00FF");
  });

  it("applies cached accent + accentDark together", () => {
    localStorage.setItem("wasit_brand_accent", "#AA0000");
    localStorage.setItem("wasit_brand_accent_dark", "#440000");
    render(<BrandColorProvider />);
    expect(document.documentElement.style.getPropertyValue("--gold-1")).toBe("#AA0000");
    expect(document.documentElement.style.getPropertyValue("--gold-2")).toBe("#440000");
  });

  it("falls back to accent for gold-2 if accentDark is missing", () => {
    localStorage.setItem("wasit_brand_accent", "#112233");
    // no wasit_brand_accent_dark — gold-2 should mirror gold-1
    render(<BrandColorProvider />);
    expect(document.documentElement.style.getPropertyValue("--gold-2")).toBe("#112233");
  });

  it("does not crash when localStorage is empty (default state)", () => {
    render(<BrandColorProvider />);
    expect(document.documentElement.style.getPropertyValue("--gold-1")).toBe("");
  });
});

describe("BrandColorProvider — wasit:brand-update event", () => {
  it("applies a new accent when the brand-update event fires", async () => {
    render(<BrandColorProvider />);

    // Wait for the effect to attach the listener
    await waitFor(() => {
      // Just ensure the component mounted without error
      expect(true).toBe(true);
    });

    const event = new CustomEvent("wasit:brand-update", {
      detail: { accent: "#00FF00", accentDark: "#008800" },
    });
    window.dispatchEvent(event);

    expect(document.documentElement.style.getPropertyValue("--gold-1")).toBe("#00FF00");
    expect(document.documentElement.style.getPropertyValue("--gold-2")).toBe("#008800");
  });

  it("rejects var(...) tokens (must be a clean color)", async () => {
    render(<BrandColorProvider />);

    const event = new CustomEvent("wasit:brand-update", {
      detail: { accent: "var(--whatever)" },
    });
    window.dispatchEvent(event);

    // var(...) tokens are filtered out by isCleanColor, so nothing applied
    expect(document.documentElement.style.getPropertyValue("--gold-1")).toBe("");
  });

  it("removes overrides when accent is empty string", async () => {
    // pre-apply something
    localStorage.setItem("wasit_brand_accent", "#ABCDEF");
    render(<BrandColorProvider />);
    expect(document.documentElement.style.getPropertyValue("--gold-1")).toBe("#ABCDEF");

    // dispatch a clear event (no detail)
    window.dispatchEvent(new CustomEvent("wasit:brand-update", { detail: {} }));
    expect(document.documentElement.style.getPropertyValue("--gold-1")).toBe("");
  });
});

describe("BrandColorProvider — cleanup", () => {
  it("removes the brand-update listener on unmount", () => {
    const { unmount } = render(<BrandColorProvider />);
    unmount();
    // After unmount the listener should be gone — dispatching does nothing
    window.dispatchEvent(
      new CustomEvent("wasit:brand-update", { detail: { accent: "#DEADBEEF" } })
    );
    expect(document.documentElement.style.getPropertyValue("--gold-1")).toBe("");
  });
});
