// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import LeadCaptureGate from "../LeadCaptureGate";

const baseProps = {
  tenantSlug: "elyas",
  contextType: "property" as const,
  contextId: "prop-123",
  contextLabel: "تفاصيل العقار",
};

beforeEach(() => {
  vi.restoreAllMocks();
  // clear cookies between tests
  document.cookie.split(";").forEach((c) => {
    const eq = c.indexOf("=");
    const name = eq > -1 ? c.substring(0, eq).trim() : c.trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
});

afterEach(cleanup);

describe("LeadCaptureGate — initial render (locked)", () => {
  it("renders the lock heading with the context label", () => {
    render(
      <LeadCaptureGate {...baseProps}>
        <div data-testid="secret">SECRET</div>
      </LeadCaptureGate>
    );
    expect(screen.getByText(/أدخل بياناتك لرؤية تفاصيل العقار/)).toBeDefined();
  });

  it("does NOT render the protected children when locked", () => {
    render(
      <LeadCaptureGate {...baseProps}>
        <div data-testid="secret">SECRET</div>
      </LeadCaptureGate>
    );
    expect(screen.queryByTestId("secret")).toBeNull();
  });

  it("renders all 3 input fields + 4 intent pills", () => {
    render(
      <LeadCaptureGate {...baseProps}>
        <div>x</div>
      </LeadCaptureGate>
    );
    expect(screen.getByPlaceholderText(/الاسم الكامل/)).toBeDefined();
    expect(screen.getByPlaceholderText(/رقم الجوّال/)).toBeDefined();
    expect(screen.getByPlaceholderText(/البريد الإلكتروني/)).toBeDefined();
    expect(screen.getByText("شراء")).toBeDefined();
    expect(screen.getByText("إيجار")).toBeDefined();
    expect(screen.getByText("استثمار")).toBeDefined();
    expect(screen.getByText("استفسار")).toBeDefined();
  });

  it("uses RTL direction on the gate root", () => {
    const { container } = render(
      <LeadCaptureGate {...baseProps}>
        <div>x</div>
      </LeadCaptureGate>
    );
    expect((container.firstChild as HTMLElement).getAttribute("dir")).toBe("rtl");
  });

  it("uses a custom message when provided", () => {
    render(
      <LeadCaptureGate {...baseProps} message="رسالة خاصة من المالك">
        <div>x</div>
      </LeadCaptureGate>
    );
    expect(screen.getByText("رسالة خاصة من المالك")).toBeDefined();
  });
});

describe("LeadCaptureGate — cookie unlock", () => {
  it("unlocks immediately when the slug-specific cookie is present", () => {
    document.cookie = "lc_elyas=1; path=/";
    render(
      <LeadCaptureGate {...baseProps}>
        <div data-testid="secret">SECRET</div>
      </LeadCaptureGate>
    );
    expect(screen.getByTestId("secret")).toBeDefined();
    expect(screen.queryByText(/أدخل بياناتك/)).toBeNull();
  });

  it("stays locked when the cookie belongs to a different tenant", () => {
    document.cookie = "lc_other-tenant=1; path=/";
    render(
      <LeadCaptureGate {...baseProps}>
        <div data-testid="secret">SECRET</div>
      </LeadCaptureGate>
    );
    expect(screen.queryByTestId("secret")).toBeNull();
  });
});

describe("LeadCaptureGate — validation", () => {
  function fillAndSubmit(fullName: string, phone: string, extra?: { container?: HTMLElement }) {
    fireEvent.change(screen.getByPlaceholderText(/الاسم الكامل/) as HTMLInputElement, {
      target: { value: fullName },
    });
    fireEvent.change(screen.getByPlaceholderText(/رقم الجوّال/) as HTMLInputElement, {
      target: { value: phone },
    });
    // The native form has `required` on name+phone — submit via the form element to
    // bypass the browser's submit-button guard in jsdom.
    const form = (extra?.container || document).querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
  }

  it("rejects names shorter than 2 chars", async () => {
    const { container } = render(
      <LeadCaptureGate {...baseProps}>
        <div>x</div>
      </LeadCaptureGate>
    );
    fillAndSubmit("ل", "0501234567", { container });
    await waitFor(() => {
      expect(screen.queryByText("الاسم مطلوب")).not.toBeNull();
    });
  });

  it("rejects phone numbers shorter than 9 digits", async () => {
    const { container } = render(
      <LeadCaptureGate {...baseProps}>
        <div>x</div>
      </LeadCaptureGate>
    );
    fillAndSubmit("إلياس الدخيل", "050", { container });
    await waitFor(() => {
      expect(screen.queryByText("رقم الجوّال غير صحيح")).not.toBeNull();
    });
  });

  it("ignores non-digit chars when counting phone length", async () => {
    // "050-12-345-67" has only 9 digits — should pass validation and POST
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    const { container } = render(
      <LeadCaptureGate {...baseProps}>
        <div data-testid="secret">SECRET</div>
      </LeadCaptureGate>
    );
    fillAndSubmit("إلياس الدخيل", "050-12-345-67", { container });
    await waitFor(() => {
      expect(screen.queryByTestId("secret")).not.toBeNull();
    });
  });
});

describe("LeadCaptureGate — successful submission", () => {
  it("POSTs to /api/lead-capture with the slug + form data", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const { container } = render(
      <LeadCaptureGate {...baseProps}>
        <div data-testid="secret">SECRET</div>
      </LeadCaptureGate>
    );
    fireEvent.change(screen.getByPlaceholderText(/الاسم الكامل/) as HTMLInputElement, {
      target: { value: "إلياس الدخيل" },
    });
    fireEvent.change(screen.getByPlaceholderText(/رقم الجوّال/) as HTMLInputElement, {
      target: { value: "0501234567" },
    });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/lead-capture");
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.tenant_slug).toBe("elyas");
    expect(body.context_type).toBe("property");
    expect(body.context_id).toBe("prop-123");
    expect(body.full_name).toBe("إلياس الدخيل");
    expect(body.phone).toBe("0501234567");
    expect(body.intent).toBe("شراء"); // default selection
  });

  it("unlocks the content when API returns ok", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    const { container } = render(
      <LeadCaptureGate {...baseProps}>
        <div data-testid="secret">SECRET</div>
      </LeadCaptureGate>
    );
    fireEvent.change(screen.getByPlaceholderText(/الاسم الكامل/) as HTMLInputElement, {
      target: { value: "Khaled Ali" },
    });
    fireEvent.change(screen.getByPlaceholderText(/رقم الجوّال/) as HTMLInputElement, {
      target: { value: "0501234567" },
    });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.queryByTestId("secret")).not.toBeNull();
    });
  });

  it("changes selected intent when a different pill is clicked", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const { container } = render(
      <LeadCaptureGate {...baseProps}>
        <div>x</div>
      </LeadCaptureGate>
    );
    fireEvent.click(screen.getByText("إيجار"));
    fireEvent.change(screen.getByPlaceholderText(/الاسم الكامل/) as HTMLInputElement, {
      target: { value: "Khaled" },
    });
    fireEvent.change(screen.getByPlaceholderText(/رقم الجوّال/) as HTMLInputElement, {
      target: { value: "0501234567" },
    });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.intent).toBe("إيجار");
  });
});

describe("LeadCaptureGate — error handling", () => {
  it("shows the server error message when API returns !ok", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "تم الحظر — حاول لاحقاً" }), { status: 400 })
    );
    const { container } = render(
      <LeadCaptureGate {...baseProps}>
        <div data-testid="secret">SECRET</div>
      </LeadCaptureGate>
    );
    fireEvent.change(screen.getByPlaceholderText(/الاسم الكامل/) as HTMLInputElement, {
      target: { value: "Khaled" },
    });
    fireEvent.change(screen.getByPlaceholderText(/رقم الجوّال/) as HTMLInputElement, {
      target: { value: "0501234567" },
    });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.queryByText("تم الحظر — حاول لاحقاً")).not.toBeNull();
    });
    expect(screen.queryByTestId("secret")).toBeNull();
  });

  it("falls back to a generic error when fetch rejects", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));
    const { container } = render(
      <LeadCaptureGate {...baseProps}>
        <div data-testid="secret">SECRET</div>
      </LeadCaptureGate>
    );
    fireEvent.change(screen.getByPlaceholderText(/الاسم الكامل/) as HTMLInputElement, {
      target: { value: "Khaled" },
    });
    fireEvent.change(screen.getByPlaceholderText(/رقم الجوّال/) as HTMLInputElement, {
      target: { value: "0501234567" },
    });
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.queryByText("network down")).not.toBeNull();
    });
  });
});
