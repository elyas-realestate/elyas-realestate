// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Breadcrumb from "../Breadcrumb";

// Stub next/link for the jsdom environment — render as a plain anchor.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("Breadcrumb", () => {
  it("renders a single crumb without a chevron separator", () => {
    render(<Breadcrumb crumbs={[{ label: "الرئيسية" }]} />);
    expect(screen.getByText("الرئيسية")).toBeDefined();
    // a single crumb means no preceding chevron
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("renders all crumb labels", () => {
    render(
      <Breadcrumb
        crumbs={[
          { label: "الرئيسية", href: "/" },
          { label: "العقارات", href: "/properties" },
          { label: "فيلا" },
        ]}
      />
    );
    expect(screen.getByText("الرئيسية")).toBeDefined();
    expect(screen.getByText("العقارات")).toBeDefined();
    expect(screen.getByText("فيلا")).toBeDefined();
  });

  it("renders intermediate crumbs with href as anchor tags", () => {
    render(
      <Breadcrumb
        crumbs={[
          { label: "الرئيسية", href: "/" },
          { label: "العقارات", href: "/properties" },
          { label: "فيلا" },
        ]}
      />
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveProperty("href");
    expect((links[0] as HTMLAnchorElement).getAttribute("href")).toBe("/");
    expect((links[1] as HTMLAnchorElement).getAttribute("href")).toBe("/properties");
  });

  it("never wraps the last crumb in an anchor (current page should not link)", () => {
    render(
      <Breadcrumb
        crumbs={[
          { label: "الرئيسية", href: "/" },
          { label: "Last", href: "/last" }, // even with href, last crumb shouldn't link
        ]}
      />
    );
    const links = screen.getAllByRole("link");
    // only 'الرئيسية' should be a link, not 'Last'
    expect(links).toHaveLength(1);
    expect((links[0] as HTMLAnchorElement).textContent).toBe("الرئيسية");
  });

  it("renders a crumb without href as a plain span", () => {
    const { container } = render(<Breadcrumb crumbs={[{ label: "First" }, { label: "Last" }]} />);
    // No links, both rendered as spans
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("uses the breadcrumb aria-label on the nav element", () => {
    const { container } = render(<Breadcrumb crumbs={[{ label: "x" }]} />);
    const nav = container.querySelector("nav");
    expect(nav).not.toBeNull();
    expect(nav?.getAttribute("aria-label")).toBe("breadcrumb");
  });

  it("renders chevrons between every pair of crumbs (n-1 chevrons for n crumbs)", () => {
    const { container } = render(
      <Breadcrumb
        crumbs={[{ label: "A", href: "/a" }, { label: "B", href: "/b" }, { label: "C" }]}
      />
    );
    // chevrons rendered via lucide-react ChevronLeft — count <svg> children
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(2); // chevrons between A→B and B→C
  });

  it("emphasizes the last crumb with bold font weight", () => {
    const { container } = render(
      <Breadcrumb crumbs={[{ label: "A", href: "/a" }, { label: "Final" }]} />
    );
    const lastSpan = Array.from(container.querySelectorAll("span")).find(
      (s) => s.textContent === "Final"
    );
    expect(lastSpan).toBeDefined();
    expect(lastSpan?.style.fontWeight).toBe("600");
  });

  it("renders nothing meaningful for an empty crumbs array", () => {
    const { container } = render(<Breadcrumb crumbs={[]} />);
    const nav = container.querySelector("nav");
    expect(nav).not.toBeNull();
    expect(nav?.children.length).toBe(0);
  });
});
