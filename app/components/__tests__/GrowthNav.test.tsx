// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
    style,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <a href={href} className={className} style={style}>
      {children}
    </a>
  ),
}));

const pathnameMock = vi.hoisted(() => ({ value: "/dashboard/today" }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}));

import GrowthNav from "../GrowthNav";

beforeEach(() => {
  pathnameMock.value = "/dashboard/today";
});

afterEach(cleanup);

describe("GrowthNav — render", () => {
  it("renders the مركز النمو header", () => {
    render(<GrowthNav />);
    expect(screen.getByText("مركز النمو")).toBeDefined();
  });

  it("renders all 3 tabs", () => {
    render(<GrowthNav />);
    expect(screen.getByText("المحتوى الذكي")).toBeDefined();
    expect(screen.getByText("الحملات")).toBeDefined();
    expect(screen.getByText("التوزيع")).toBeDefined();
  });

  it("renders the tab descriptions", () => {
    render(<GrowthNav />);
    expect(screen.getByText("صناعة + خطة + ترندات")).toBeDefined();
    expect(screen.getByText("تسويق + مقارنة العقارات")).toBeDefined();
    expect(screen.getByText("نشر على المنصات الخارجية")).toBeDefined();
  });

  it("uses RTL direction on the container", () => {
    const { container } = render(<GrowthNav />);
    expect((container.firstChild as HTMLElement).getAttribute("dir")).toBe("rtl");
  });

  it("links each tab to the right href", () => {
    const { container } = render(<GrowthNav />);
    const links = Array.from(container.querySelectorAll("a"));
    const hrefs = links.map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/dashboard/content");
    expect(hrefs).toContain("/dashboard/marketing");
    expect(hrefs).toContain("/dashboard/distribute");
  });
});

describe("GrowthNav — active-state detection", () => {
  it("marks the Content tab active when on /dashboard/content", () => {
    pathnameMock.value = "/dashboard/content";
    const { container } = render(<GrowthNav />);
    const contentLink = Array.from(container.querySelectorAll("a")).find((a) =>
      a.textContent?.includes("المحتوى الذكي")
    ) as HTMLAnchorElement;
    // Active tab gets a gold-tinted background + gold-2 border
    expect(contentLink.style.background).toContain("var(--gold-bg)");
  });

  it("marks the Marketing tab active when on a nested marketing path", () => {
    pathnameMock.value = "/dashboard/marketing/campaign-123";
    const { container } = render(<GrowthNav />);
    const marketingLink = Array.from(container.querySelectorAll("a")).find((a) =>
      a.textContent?.includes("الحملات")
    ) as HTMLAnchorElement;
    expect(marketingLink.style.background).toContain("var(--gold-bg)");
  });

  it("marks the Distribute tab active when on /dashboard/distribute", () => {
    pathnameMock.value = "/dashboard/distribute";
    const { container } = render(<GrowthNav />);
    const distributeLink = Array.from(container.querySelectorAll("a")).find((a) =>
      a.textContent?.includes("التوزيع")
    ) as HTMLAnchorElement;
    expect(distributeLink.style.background).toContain("var(--gold-bg)");
  });

  it("leaves all tabs inactive when on an unrelated path", () => {
    pathnameMock.value = "/dashboard/today";
    const { container } = render(<GrowthNav />);
    const tabLinks = Array.from(container.querySelectorAll("a"));
    for (const a of tabLinks) {
      // inactive → background is "transparent"
      expect(a.style.background).toBe("transparent");
    }
  });

  it("only marks one tab as active at a time", () => {
    pathnameMock.value = "/dashboard/marketing";
    const { container } = render(<GrowthNav />);
    const activeTabs = Array.from(container.querySelectorAll("a")).filter((a) =>
      a.style.background.includes("var(--gold-bg)")
    );
    expect(activeTabs.length).toBe(1);
  });
});

describe("GrowthNav — usePathname null fallback", () => {
  it("handles pathname being null gracefully (no crash, no active tab)", () => {
    pathnameMock.value = null as unknown as string;
    expect(() => render(<GrowthNav />)).not.toThrow();
  });
});
