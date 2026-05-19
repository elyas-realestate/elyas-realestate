// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Breadcrumb from "../Breadcrumb";

afterEach(cleanup);

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
    const { container } = render(
      <Breadcrumb
        crumbs={[
          { label: "الرئيسية", href: "/" },
          { label: "العقارات", href: "/properties" },
          { label: "فيلا" },
        ]}
      />
    );
    // labels appear nested (wrapper span + inner anchor/span) so we assert
    // each text is found at least once in the container
    expect(container.textContent).toContain("الرئيسية");
    expect(container.textContent).toContain("العقارات");
    expect(container.textContent).toContain("فيلا");
  });

  it("renders intermediate crumbs with href as anchor tags", () => {
    const { container } = render(
      <Breadcrumb
        crumbs={[
          { label: "الرئيسية", href: "/" },
          { label: "العقارات", href: "/properties" },
          { label: "فيلا" },
        ]}
      />
    );
    const anchors = Array.from(container.querySelectorAll("a"));
    expect(anchors).toHaveLength(2);
    expect(anchors[0].getAttribute("href")).toBe("/");
    expect(anchors[1].getAttribute("href")).toBe("/properties");
  });

  it("never wraps the last crumb in an anchor (current page should not link)", () => {
    const { container } = render(
      <Breadcrumb
        crumbs={[
          { label: "الرئيسية", href: "/" },
          { label: "Last", href: "/last" }, // even with href, last crumb shouldn't link
        ]}
      />
    );
    const anchors = Array.from(container.querySelectorAll("a"));
    // only 'الرئيسية' should be wrapped in an anchor, not 'Last'
    expect(anchors).toHaveLength(1);
    expect(anchors[0].textContent).toBe("الرئيسية");
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
    // The inner span holding the actual text — find the one with explicit
    // fontWeight === '600' (the bold wrapper for the last crumb).
    const boldSpan = Array.from(container.querySelectorAll("span")).find(
      (s) => s.style.fontWeight === "600"
    );
    expect(boldSpan).toBeDefined();
    expect(boldSpan?.textContent).toBe("Final");
  });

  it("renders nothing meaningful for an empty crumbs array", () => {
    const { container } = render(<Breadcrumb crumbs={[]} />);
    const nav = container.querySelector("nav");
    expect(nav).not.toBeNull();
    expect(nav?.children.length).toBe(0);
  });
});
