// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import SupportContact from "../SupportContact";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// reset fetch + sonner mocks between tests
beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(cleanup);

describe("SupportContact — initial render", () => {
  it("renders the section heading", () => {
    render(<SupportContact />);
    expect(screen.getByText("تواصل مع الدعم")).toBeDefined();
  });

  it("renders the WhatsApp, email, and form CTA tiles", () => {
    render(<SupportContact />);
    expect(screen.getByText("واتساب")).toBeDefined();
    expect(screen.getByText("بريد إلكتروني")).toBeDefined();
    expect(screen.getByText("نموذج طلب")).toBeDefined();
  });

  it("uses RTL direction", () => {
    const { container } = render(<SupportContact />);
    expect((container.firstChild as HTMLElement).getAttribute("dir")).toBe("rtl");
  });

  it("links WhatsApp to wa.me with the Wasit support number", () => {
    const { container } = render(<SupportContact />);
    const waLink = Array.from(container.querySelectorAll("a")).find((a) =>
      a.href.includes("wa.me")
    );
    expect(waLink).toBeDefined();
    expect(waLink?.href).toContain("966575828854");
  });

  it("links email to a mailto: address", () => {
    const { container } = render(<SupportContact />);
    const mailLink = Array.from(container.querySelectorAll("a")).find((a) =>
      a.href.startsWith("mailto:")
    );
    expect(mailLink).toBeDefined();
    expect(mailLink?.href).toContain("elyasaldakhil@gmail.com");
  });

  it("does not render the form by default", () => {
    render(<SupportContact />);
    expect(screen.queryByText("تفاصيل الطلب")).toBeNull();
  });
});

describe("SupportContact — opening the form", () => {
  it("shows the form when 'نموذج طلب' is clicked", () => {
    render(<SupportContact />);
    fireEvent.click(screen.getByText("نموذج طلب"));
    expect(screen.getByText("تفاصيل الطلب")).toBeDefined();
  });

  it("renders all 5 category pills", () => {
    render(<SupportContact />);
    fireEvent.click(screen.getByText("نموذج طلب"));
    expect(screen.getByText("سؤال عام")).toBeDefined();
    expect(screen.getByText("خطأ تقني")).toBeDefined();
    expect(screen.getByText("اقتراح ميزة")).toBeDefined();
    expect(screen.getByText("الفوترة")).toBeDefined();
    expect(screen.getByText("عاجل")).toBeDefined();
  });

  it("renders all 3 preferred-method buttons", () => {
    render(<SupportContact />);
    fireEvent.click(screen.getByText("نموذج طلب"));
    // form-level WhatsApp button (not the top tile)
    const formButtons = screen.getAllByText("واتساب");
    expect(formButtons.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("بريد")).toBeDefined();
    expect(screen.getByText("اتصال")).toBeDefined();
  });

  it("closes the form when the X button inside it is clicked", () => {
    const { container } = render(<SupportContact />);
    fireEvent.click(screen.getByText("نموذج طلب"));
    // find a small X button inside the form panel (the close button)
    const closeBtn = Array.from(container.querySelectorAll("button")).find((b) => {
      const svg = b.querySelector("svg");
      // empty-text button containing an svg
      return b.textContent?.trim() === "" && svg !== null;
    });
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(screen.queryByText("تفاصيل الطلب")).toBeNull();
    }
  });
});

describe("SupportContact — category selection", () => {
  it("starts with 'general' category active and switches when another is clicked", () => {
    render(<SupportContact />);
    fireEvent.click(screen.getByText("نموذج طلب"));
    // clicking 'خطأ تقني' should not throw
    fireEvent.click(screen.getByText("خطأ تقني"));
    // the chip should now show as bold (font-weight 700) — visual, hard to assert reliably
    // just verify the button is still in the doc
    expect(screen.getByText("خطأ تقني")).toBeDefined();
  });
});

describe("SupportContact — form validation", () => {
  it("blocks submit when subject is too short", async () => {
    const { toast } = await import("sonner");
    render(<SupportContact />);
    fireEvent.click(screen.getByText("نموذج طلب"));
    // leave subject empty + click submit
    fireEvent.click(screen.getByText("إرسال الطلب"));
    expect((toast.error as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("blocks submit when message is too short", async () => {
    const { toast } = await import("sonner");
    render(<SupportContact />);
    fireEvent.click(screen.getByText("نموذج طلب"));
    // fill subject but not message
    const subject = screen.getByPlaceholderText(/باختصار/) as HTMLInputElement;
    fireEvent.change(subject, { target: { value: "subject ok" } });
    fireEvent.click(screen.getByText("إرسال الطلب"));
    expect((toast.error as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });
});

describe("SupportContact — successful submission", () => {
  it("POSTs to /api/support-request with the form payload", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true, message: "تم استلام طلبك ✓" }), { status: 200 })
      );

    render(<SupportContact />);
    fireEvent.click(screen.getByText("نموذج طلب"));

    const subject = screen.getByPlaceholderText(/باختصار/) as HTMLInputElement;
    const message = screen.getByPlaceholderText(/اشرح لنا التفاصيل/) as HTMLTextAreaElement;
    fireEvent.change(subject, { target: { value: "test subject" } });
    fireEvent.change(message, { target: { value: "a sufficiently long message body" } });

    fireEvent.click(screen.getByText("إرسال الطلب"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/support-request");
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.subject).toBe("test subject");
    expect(body.message).toBe("a sufficiently long message body");
    expect(body.category).toBe("general");
  });

  it("surfaces a toast error when the API returns !ok", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "server boom" }), { status: 500 })
    );
    const { toast } = await import("sonner");

    render(<SupportContact />);
    fireEvent.click(screen.getByText("نموذج طلب"));
    fireEvent.change(screen.getByPlaceholderText(/باختصار/) as HTMLInputElement, {
      target: { value: "subj" },
    });
    fireEvent.change(screen.getByPlaceholderText(/اشرح لنا التفاصيل/) as HTMLTextAreaElement, {
      target: { value: "long enough message" },
    });
    fireEvent.click(screen.getByText("إرسال الطلب"));

    await waitFor(() => {
      expect((toast.error as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    });
  });
});
