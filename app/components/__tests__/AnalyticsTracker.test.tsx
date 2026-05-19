// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────────────
// Capture the inserts made to site_analytics so each test can inspect them.
const insertCalls: unknown[] = [];

const supabaseMock = vi.hoisted(() => ({
  insertCalls: [] as unknown[],
  from: vi.fn((_table: string) => ({
    insert: vi.fn(async (rows: unknown[]) => {
      supabaseMock.insertCalls.push(...rows);
      return { error: null };
    }),
  })),
}));

vi.mock("@/lib/supabase-browser", () => ({ supabase: supabaseMock }));

// next/navigation — return a controllable pathname
const pathnameMock = vi.hoisted(() => ({ value: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}));

import AnalyticsTracker, { getPageLabel } from "../AnalyticsTracker";

beforeEach(() => {
  insertCalls.length = 0;
  supabaseMock.insertCalls.length = 0;
  pathnameMock.value = "/";
  supabaseMock.from.mockClear();
});

afterEach(cleanup);

describe("AnalyticsTracker — getPageLabel helper", () => {
  it("labels '/' as the home page", () => {
    expect(getPageLabel("/")).toBe("الصفحة الرئيسية");
  });

  it("labels '/properties' as the properties list", () => {
    expect(getPageLabel("/properties")).toBe("العقارات");
  });

  it("labels '/properties/:id' as property details", () => {
    expect(getPageLabel("/properties/123-abc")).toBe("تفاصيل عقار");
  });

  it("falls back to the path itself for unknown routes", () => {
    expect(getPageLabel("/blog/article-1")).toBe("/blog/article-1");
  });
});

describe("AnalyticsTracker — pageview tracking", () => {
  it("renders nothing (returns null)", () => {
    const { container } = render(<AnalyticsTracker />);
    expect(container.firstChild).toBeNull();
  });

  it("inserts a pageview row on a public path", async () => {
    pathnameMock.value = "/";
    render(<AnalyticsTracker />);
    // Effects flush microtasks — give a tick
    await new Promise((r) => setTimeout(r, 5));

    expect(supabaseMock.insertCalls.length).toBeGreaterThanOrEqual(1);
    const row = supabaseMock.insertCalls[0] as Record<string, unknown>;
    expect(row.event_type).toBe("pageview");
    expect(row.page).toBe("/");
    expect(row.element).toBe("الصفحة الرئيسية");
  });

  it("does NOT track /dashboard (private)", async () => {
    pathnameMock.value = "/dashboard";
    render(<AnalyticsTracker />);
    await new Promise((r) => setTimeout(r, 5));
    expect(supabaseMock.insertCalls.length).toBe(0);
  });

  it("does NOT track /login (private)", async () => {
    pathnameMock.value = "/login";
    render(<AnalyticsTracker />);
    await new Promise((r) => setTimeout(r, 5));
    expect(supabaseMock.insertCalls.length).toBe(0);
  });
});

describe("AnalyticsTracker — click tracking on [data-track]", () => {
  it("records a click event when a data-track element is clicked", async () => {
    pathnameMock.value = "/properties";
    render(<AnalyticsTracker />);
    await new Promise((r) => setTimeout(r, 5));

    // Pageview already recorded → clear and trigger a click
    const beforeClick = supabaseMock.insertCalls.length;

    const btn = document.createElement("button");
    btn.setAttribute("data-track", "open_filter_panel");
    document.body.appendChild(btn);
    fireEvent.click(btn);

    await new Promise((r) => setTimeout(r, 5));

    expect(supabaseMock.insertCalls.length).toBeGreaterThan(beforeClick);
    const clickRow = supabaseMock.insertCalls[supabaseMock.insertCalls.length - 1] as Record<
      string,
      unknown
    >;
    expect(clickRow.event_type).toBe("click");
    expect(clickRow.element).toBe("open_filter_panel");
    expect(clickRow.page).toBe("/properties");

    btn.remove();
  });

  it("ignores clicks on elements without data-track", async () => {
    pathnameMock.value = "/properties";
    render(<AnalyticsTracker />);
    await new Promise((r) => setTimeout(r, 5));
    const beforeClick = supabaseMock.insertCalls.length;

    const btn = document.createElement("button");
    document.body.appendChild(btn);
    fireEvent.click(btn);

    await new Promise((r) => setTimeout(r, 5));
    expect(supabaseMock.insertCalls.length).toBe(beforeClick);
    btn.remove();
  });

  it("does NOT attach click listener on private pages", async () => {
    pathnameMock.value = "/dashboard";
    render(<AnalyticsTracker />);
    await new Promise((r) => setTimeout(r, 5));

    const btn = document.createElement("button");
    btn.setAttribute("data-track", "private_click");
    document.body.appendChild(btn);
    fireEvent.click(btn);
    await new Promise((r) => setTimeout(r, 5));

    expect(supabaseMock.insertCalls.length).toBe(0);
    btn.remove();
  });
});
