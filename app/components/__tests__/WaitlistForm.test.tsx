// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import WaitlistForm from "../WaitlistForm";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(cleanup);

describe("WaitlistForm — initial render", () => {
  it("renders the heading", () => {
    render(<WaitlistForm />);
    expect(screen.getByText(/سجّل في Beta/)).toBeDefined();
  });

  it("renders all input fields", () => {
    render(<WaitlistForm />);
    expect(screen.getByPlaceholderText(/بريدك الإلكتروني/)).toBeDefined();
    expect(screen.getByPlaceholderText(/اسمك \(اختياري\)/)).toBeDefined();
    expect(screen.getByPlaceholderText(/جوّال/)).toBeDefined();
    expect(screen.getByPlaceholderText("المدينة")).toBeDefined();
    expect(screen.getByPlaceholderText(/ما الذي تبحث عنه/)).toBeDefined();
  });

  it("uses RTL on the form root", () => {
    const { container } = render(<WaitlistForm />);
    const form = container.querySelector("form");
    expect(form?.getAttribute("dir")).toBe("rtl");
  });

  it("renders the submit button with the initial label", () => {
    render(<WaitlistForm />);
    expect(screen.getByText("سجّل اسمي في Beta")).toBeDefined();
  });

  it("uses ltr for email and phone inputs (LTR text inside RTL form)", () => {
    render(<WaitlistForm />);
    const email = screen.getByPlaceholderText(/بريدك الإلكتروني/) as HTMLInputElement;
    const phone = screen.getByPlaceholderText(/جوّال/) as HTMLInputElement;
    expect(email.getAttribute("dir")).toBe("ltr");
    expect(phone.getAttribute("dir")).toBe("ltr");
  });
});

describe("WaitlistForm — validation", () => {
  it("blocks submit when email is empty (toast.error fires)", async () => {
    const { toast } = await import("sonner");
    const { container } = render(<WaitlistForm />);

    // Submitting the form WITHOUT filling email — note the email input is `required`,
    // so we have to dispatch submit on the form directly to bypass the browser's UI guard.
    const form = container.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    expect((toast.error as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });
});

describe("WaitlistForm — successful submission", () => {
  it("POSTs to /api/waitlist and renders the success state on 200", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, message: "تم التسجيل بنجاح" }), { status: 200 })
    );

    render(<WaitlistForm />);
    const email = screen.getByPlaceholderText(/بريدك الإلكتروني/) as HTMLInputElement;
    fireEvent.change(email, { target: { value: "elyas@example.com" } });

    fireEvent.click(screen.getByText("سجّل اسمي في Beta"));

    await waitFor(() => {
      expect(screen.queryByText(/أنت في القائمة الآن/)).not.toBeNull();
    });
    // Email shown back to the user in success state
    expect(screen.getByText("elyas@example.com")).toBeDefined();
  });

  it("includes the `source` prop in the request body", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    render(<WaitlistForm source="beta-page" />);
    fireEvent.change(screen.getByPlaceholderText(/بريدك الإلكتروني/) as HTMLInputElement, {
      target: { value: "x@y.com" },
    });
    fireEvent.click(screen.getByText("سجّل اسمي في Beta"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.source).toBe("beta-page");
    expect(body.email).toBe("x@y.com");
  });

  it("uses 'landing' as the default source when no prop is passed", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    render(<WaitlistForm />);
    fireEvent.change(screen.getByPlaceholderText(/بريدك الإلكتروني/) as HTMLInputElement, {
      target: { value: "x@y.com" },
    });
    fireEvent.click(screen.getByText("سجّل اسمي في Beta"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.source).toBe("landing");
  });
});

describe("WaitlistForm — error handling", () => {
  it("surfaces toast.error when the API responds with !ok", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "duplicate" }), { status: 400 })
    );
    const { toast } = await import("sonner");

    render(<WaitlistForm />);
    fireEvent.change(screen.getByPlaceholderText(/بريدك الإلكتروني/) as HTMLInputElement, {
      target: { value: "x@y.com" },
    });
    fireEvent.click(screen.getByText("سجّل اسمي في Beta"));

    await waitFor(() => {
      expect((toast.error as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    });
    // Stays on form view (no success swap)
    expect(screen.queryByText(/أنت في القائمة الآن/)).toBeNull();
  });

  it("surfaces toast.error when fetch itself throws", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("offline"));
    const { toast } = await import("sonner");

    render(<WaitlistForm />);
    fireEvent.change(screen.getByPlaceholderText(/بريدك الإلكتروني/) as HTMLInputElement, {
      target: { value: "x@y.com" },
    });
    fireEvent.click(screen.getByText("سجّل اسمي في Beta"));

    await waitFor(() => {
      expect((toast.error as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    });
  });
});
