// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

// Stub the logger so the component doesn't try to wire Sentry in tests
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Stub next/link to a plain <a> so we don't pull in the Next.js router
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import OnboardingChecklist from "../OnboardingChecklist";

type State = {
  step_profile_completed: boolean;
  step_property_added: boolean;
  step_whatsapp_connected: boolean;
  step_assistant_tested: boolean;
  dismissed: boolean;
};

const emptyState: State = {
  step_profile_completed: false,
  step_property_added: false,
  step_whatsapp_connected: false,
  step_assistant_tested: false,
  dismissed: false,
};

function mockGetState(state: State | null) {
  return vi.spyOn(global, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ state }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(cleanup);

describe("OnboardingChecklist — loading + dismissed", () => {
  it("renders nothing while the API call is in flight", () => {
    vi.spyOn(global, "fetch").mockImplementation(() => new Promise(() => {})); // never resolves
    const { container } = render(<OnboardingChecklist />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when API returns dismissed: true", async () => {
    mockGetState({ ...emptyState, dismissed: true });
    const { container } = render(<OnboardingChecklist />);
    await waitFor(() => {
      // first render still loading; we just need the effect to flush
      expect(global.fetch).toHaveBeenCalled();
    });
    // give it a tick for state to apply
    await new Promise((r) => setTimeout(r, 10));
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the API fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("oops", { status: 500 }));
    const { container } = render(<OnboardingChecklist />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(container.firstChild).toBeNull();
  });
});

describe("OnboardingChecklist — incomplete state", () => {
  it("renders the heading + step list when there's at least one pending step", async () => {
    mockGetState(emptyState);
    render(<OnboardingChecklist />);
    await waitFor(() => {
      expect(screen.queryByText("خطوات إعداد منصتك")).not.toBeNull();
    });
  });

  it("shows '0/4' when nothing is done", async () => {
    mockGetState(emptyState);
    render(<OnboardingChecklist />);
    await waitFor(() => {
      expect(screen.getByText("0/4")).toBeDefined();
    });
  });

  it("shows '2/4' when two steps are done", async () => {
    mockGetState({
      ...emptyState,
      step_profile_completed: true,
      step_whatsapp_connected: true,
    });
    render(<OnboardingChecklist />);
    await waitFor(() => {
      expect(screen.getByText("2/4")).toBeDefined();
    });
  });

  it("renders all 4 step titles", async () => {
    mockGetState(emptyState);
    render(<OnboardingChecklist />);
    await waitFor(() => {
      expect(screen.getByText("أكمل ملفك الشخصي")).toBeDefined();
    });
    expect(screen.getByText("أضف أول عقار")).toBeDefined();
    expect(screen.getByText("اربط واتساب الأعمال")).toBeDefined();
    expect(screen.getByText("جرّب مساعدك الذكي")).toBeDefined();
  });

  it("links pending steps to their hrefs", async () => {
    mockGetState(emptyState);
    const { container } = render(<OnboardingChecklist />);
    await waitFor(() => {
      expect(screen.queryByText("خطوات إعداد منصتك")).not.toBeNull();
    });
    const links = Array.from(container.querySelectorAll("a"));
    const hrefs = links.map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/dashboard/settings");
    expect(hrefs).toContain("/dashboard/properties/add");
    expect(hrefs).toContain("/dashboard/whatsapp/settings");
    expect(hrefs).toContain("/dashboard/ai");
  });

  it("uses href='#' for already-completed steps", async () => {
    mockGetState({ ...emptyState, step_profile_completed: true });
    const { container } = render(<OnboardingChecklist />);
    await waitFor(() => {
      expect(screen.queryByText("خطوات إعداد منصتك")).not.toBeNull();
    });
    // find the completed step's link by looking for the "مكتمل ✓" badge sibling
    const completedRow = Array.from(container.querySelectorAll("a")).find((a) =>
      a.textContent?.includes("مكتمل ✓")
    );
    expect(completedRow?.getAttribute("href")).toBe("#");
  });
});

describe("OnboardingChecklist — all complete", () => {
  it("shows the celebration message when all 4 steps are done", async () => {
    mockGetState({
      step_profile_completed: true,
      step_property_added: true,
      step_whatsapp_connected: true,
      step_assistant_tested: true,
      dismissed: false,
    });
    render(<OnboardingChecklist />);
    await waitFor(() => {
      expect(screen.queryByText(/أنجزت كل خطوات الإعداد/)).not.toBeNull();
    });
  });
});

describe("OnboardingChecklist — dismiss action", () => {
  it("calls PUT /api/onboarding with dismissed:true", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ state: emptyState }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const { container } = render(<OnboardingChecklist />);
    await waitFor(() => {
      expect(screen.queryByText("خطوات إعداد منصتك")).not.toBeNull();
    });

    // The X button is the only one with title="إخفاء"
    const dismissBtn = container.querySelector('button[title="إخفاء"]') as HTMLButtonElement;
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    const secondCall = fetchMock.mock.calls[1];
    expect(secondCall[0]).toBe("/api/onboarding");
    const opts = secondCall[1] as RequestInit;
    expect(opts.method).toBe("PUT");
    expect(JSON.parse(opts.body as string)).toEqual({ dismissed: true });
  });
});
