// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

import MobileNav from "../MobileNav";

afterEach(cleanup);

const baseLinks = [
  { href: "/properties", label: "العقارات", type: "link" },
  { href: "#about", label: "عن المنصة", type: "anchor" },
  { href: "/pricing", label: "الباقات", type: "link" },
];

describe("MobileNav — initial render", () => {
  it("renders the toggle button", () => {
    render(<MobileNav links={baseLinks} loginText="تسجيل الدخول" />);
    expect(screen.getByLabelText("القائمة")).toBeDefined();
  });

  it("starts with the drawer in the closed state", () => {
    const { container } = render(<MobileNav links={baseLinks} loginText="تسجيل الدخول" />);
    const drawer = container.querySelector(".nav-drawer");
    expect(drawer?.className.includes(" open")).toBe(false);
  });

  it("does not list any link until opened? — drawer markup is always present (CSS-driven)", () => {
    // The drawer DOM is always present, only the `open` class changes.
    const { container } = render(<MobileNav links={baseLinks} loginText="تسجيل الدخول" />);
    const drawer = container.querySelector(".nav-drawer");
    expect(drawer).not.toBeNull();
    // All links exist regardless of open state
    expect(drawer?.querySelectorAll("a").length).toBe(baseLinks.length + 1); // + login link
  });
});

describe("MobileNav — toggle behaviour", () => {
  it("opens the drawer when the button is clicked", () => {
    const { container } = render(<MobileNav links={baseLinks} loginText="تسجيل الدخول" />);
    fireEvent.click(screen.getByLabelText("القائمة"));
    const drawer = container.querySelector(".nav-drawer");
    expect(drawer?.className.includes(" open")).toBe(true);
  });

  it("toggles closed again on a second click", () => {
    const { container } = render(<MobileNav links={baseLinks} loginText="تسجيل الدخول" />);
    const btn = screen.getByLabelText("القائمة");
    fireEvent.click(btn);
    fireEvent.click(btn);
    const drawer = container.querySelector(".nav-drawer");
    expect(drawer?.className.includes(" open")).toBe(false);
  });

  it("swaps the icon (open shows X, closed shows hamburger)", () => {
    render(<MobileNav links={baseLinks} loginText="تسجيل الدخول" />);
    const btn = screen.getByLabelText("القائمة");

    // Closed → hamburger has 3 <line> elements
    expect(btn.querySelectorAll("line").length).toBe(3);

    fireEvent.click(btn);
    // Open → X has 2 <line> elements
    expect(btn.querySelectorAll("line").length).toBe(2);
  });
});

describe("MobileNav — link rendering", () => {
  it("renders anchor links as <a> with href", () => {
    const { container } = render(<MobileNav links={baseLinks} loginText="تسجيل الدخول" />);
    const anchorLink = Array.from(container.querySelectorAll("a")).find(
      (a) => a.textContent === "عن المنصة"
    );
    expect(anchorLink?.getAttribute("href")).toBe("#about");
  });

  it("renders link-typed entries via the Next.js Link mock as <a>", () => {
    const { container } = render(<MobileNav links={baseLinks} loginText="تسجيل الدخول" />);
    const propsLink = Array.from(container.querySelectorAll("a")).find(
      (a) => a.textContent === "العقارات"
    );
    expect(propsLink?.getAttribute("href")).toBe("/properties");
  });

  it("renders the login link with the provided loginText", () => {
    render(<MobileNav links={baseLinks} loginText="ادخل لحسابك" />);
    expect(screen.getByText("ادخل لحسابك")).toBeDefined();
  });

  it("closes the drawer when an anchor link inside it is clicked", () => {
    const { container } = render(<MobileNav links={baseLinks} loginText="تسجيل الدخول" />);
    fireEvent.click(screen.getByLabelText("القائمة")); // open
    expect(container.querySelector(".nav-drawer")?.className.includes(" open")).toBe(true);

    const aboutLink = screen.getByText("عن المنصة");
    fireEvent.click(aboutLink);
    expect(container.querySelector(".nav-drawer")?.className.includes(" open")).toBe(false);
  });

  it("closes the drawer when the login link is clicked", () => {
    const { container } = render(<MobileNav links={baseLinks} loginText="تسجيل الدخول" />);
    fireEvent.click(screen.getByLabelText("القائمة"));
    fireEvent.click(screen.getByText("تسجيل الدخول"));
    expect(container.querySelector(".nav-drawer")?.className.includes(" open")).toBe(false);
  });
});

describe("MobileNav — empty links list", () => {
  it("still renders the login link when no nav links are provided", () => {
    render(<MobileNav links={[]} loginText="دخول" />);
    expect(screen.getByText("دخول")).toBeDefined();
  });
});
