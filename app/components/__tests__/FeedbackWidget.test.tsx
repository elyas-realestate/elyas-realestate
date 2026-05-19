// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import FeedbackWidget from "../FeedbackWidget";

// Helper — set window.location.pathname before render so the widget's
// `hidden` effect doesn't filter the widget out.
function setPath(path: string) {
  // jsdom's location is mostly read-only, but `window.history.pushState`
  // updates the pathname reliably.
  window.history.pushState({}, "", path);
}

beforeEach(() => {
  vi.restoreAllMocks();
  // The widget's hidden-state regex `/^\/[a-z][a-z0-9-]*$/` matches any
  // single-segment lowercase path (including "/dashboard"!), so we use a
  // two-segment path here to ensure the widget renders.
  setPath("/dashboard/today");
});

afterEach(cleanup);

describe("FeedbackWidget — hidden pages", () => {
  it("renders null on the marketing root '/'", () => {
    setPath("/");
    const { container } = render(<FeedbackWidget />);
    // hidden state is set inside useEffect; let it run
    return Promise.resolve().then(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders null on /login", async () => {
    setPath("/login");
    const { container } = render(<FeedbackWidget />);
    await new Promise((r) => setTimeout(r, 5));
    expect(container.firstChild).toBeNull();
  });

  it("renders null on /register", async () => {
    setPath("/register");
    const { container } = render(<FeedbackWidget />);
    await new Promise((r) => setTimeout(r, 5));
    expect(container.firstChild).toBeNull();
  });

  it("renders null on /c/[slug] broker card pages", async () => {
    setPath("/c/elyas");
    const { container } = render(<FeedbackWidget />);
    await new Promise((r) => setTimeout(r, 5));
    expect(container.firstChild).toBeNull();
  });

  it("renders null on /[slug] public broker pages", async () => {
    setPath("/elyas-broker");
    const { container } = render(<FeedbackWidget />);
    await new Promise((r) => setTimeout(r, 5));
    expect(container.firstChild).toBeNull();
  });
});

describe("FeedbackWidget — visible pages", () => {
  it("renders the floating button on /dashboard/today", () => {
    render(<FeedbackWidget />);
    const btn = screen.getByLabelText("إرسال ملاحظة");
    expect(btn).toBeDefined();
  });

  it("opens the modal when the floating button is clicked", () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByLabelText("إرسال ملاحظة"));
    expect(screen.getByText("ملاحظات & اقتراحات")).toBeDefined();
  });

  it("closes the modal when X is clicked", () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByLabelText("إرسال ملاحظة"));
    fireEvent.click(screen.getByLabelText("إغلاق"));
    expect(screen.queryByText("ملاحظات & اقتراحات")).toBeNull();
  });
});

describe("FeedbackWidget — category selection", () => {
  it("renders all 4 category options", () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByLabelText("إرسال ملاحظة"));
    expect(screen.getByText("خطأ / مشكلة")).toBeDefined();
    expect(screen.getByText("اقتراح ميزة")).toBeDefined();
    expect(screen.getByText("سؤال")).toBeDefined();
    expect(screen.getByText("ثناء / إعجاب")).toBeDefined();
  });

  it("shows the textarea after picking a category", () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByLabelText("إرسال ملاحظة"));
    fireEvent.click(screen.getByText("اقتراح ميزة"));
    const textarea = screen.getByPlaceholderText(/اكتب ملاحظتك هنا/);
    expect(textarea).toBeDefined();
  });

  it("returns to category picker via 'اختيار تصنيف آخر'", () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByLabelText("إرسال ملاحظة"));
    fireEvent.click(screen.getByText("اقتراح ميزة"));
    fireEvent.click(screen.getByText(/اختيار تصنيف آخر/));
    // back to the picker → category tiles visible again
    expect(screen.getByText("خطأ / مشكلة")).toBeDefined();
  });
});

describe("FeedbackWidget — submission", () => {
  it("blocks submit if message is shorter than 5 chars", async () => {
    const { toast } = await import("sonner");
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByLabelText("إرسال ملاحظة"));
    fireEvent.click(screen.getByText("سؤال"));

    const submitBtn = screen.getByText("إرسال").closest("button") as HTMLButtonElement;
    // submit button is disabled when message < 5 chars (component logic) — verify
    expect(submitBtn.disabled).toBe(true);

    // also: dispatching click while disabled shouldn't fire toast or fetch
    fireEvent.click(submitBtn);
    // disabled buttons don't trigger handlers, so no toast fired
    expect((toast.error as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it("POSTs to /api/beta-feedback with category + message + page_url", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    render(<FeedbackWidget />);
    fireEvent.click(screen.getByLabelText("إرسال ملاحظة"));
    fireEvent.click(screen.getByText("اقتراح ميزة"));

    const textarea = screen.getByPlaceholderText(/اكتب ملاحظتك هنا/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "أبغى ميزة جدولة جديدة" } });

    fireEvent.click(screen.getByText("إرسال"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/beta-feedback");
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.category).toBe("feature");
    expect(body.message).toBe("أبغى ميزة جدولة جديدة");
    expect(body.page_url).toBe("/dashboard/today");
  });

  it("shows the success state after a successful POST", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    render(<FeedbackWidget />);
    fireEvent.click(screen.getByLabelText("إرسال ملاحظة"));
    fireEvent.click(screen.getByText("سؤال"));
    fireEvent.change(screen.getByPlaceholderText(/اكتب ملاحظتك هنا/) as HTMLTextAreaElement, {
      target: { value: "متى تطلق نسخة الموبايل؟" },
    });
    fireEvent.click(screen.getByText("إرسال"));

    await waitFor(() => {
      expect(screen.queryByText("شكراً لك!")).not.toBeNull();
    });
  });

  it("surfaces toast.error when API responds with ok:false", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "spam" }), { status: 200 })
    );
    const { toast } = await import("sonner");

    render(<FeedbackWidget />);
    fireEvent.click(screen.getByLabelText("إرسال ملاحظة"));
    fireEvent.click(screen.getByText("سؤال"));
    fireEvent.change(screen.getByPlaceholderText(/اكتب ملاحظتك هنا/) as HTMLTextAreaElement, {
      target: { value: "long enough message" },
    });
    fireEvent.click(screen.getByText("إرسال"));

    await waitFor(() => {
      expect((toast.error as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    });
  });
});
