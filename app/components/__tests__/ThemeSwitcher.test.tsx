// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ThemeSwitcher from "../ThemeSwitcher";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  // reset DOM theme state between tests
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});

afterEach(cleanup);

describe("ThemeSwitcher — initial render", () => {
  it("renders the section heading", () => {
    render(<ThemeSwitcher />);
    expect(screen.getByText(/اختيار الثيم العام/)).toBeDefined();
  });

  it("renders both theme cards (cream + dark)", () => {
    render(<ThemeSwitcher />);
    expect(screen.getByText(/الثيم الكريمي العقاري/)).toBeDefined();
    expect(screen.getByText(/الثيم الداكن/)).toBeDefined();
  });

  it("renders the persistence hint", () => {
    render(<ThemeSwitcher />);
    expect(screen.getByText(/تفضيلك يُحفظ تلقائياً/)).toBeDefined();
  });

  it("renders the footer note about dashboard scope", () => {
    render(<ThemeSwitcher />);
    expect(screen.getByText(/الثيم يطبَّق على كل صفحات الداشبورد/)).toBeDefined();
  });

  it("renders 'وسيط برو' preview text twice (one per swatch)", () => {
    render(<ThemeSwitcher />);
    expect(screen.queryAllByText("وسيط برو").length).toBe(2);
  });
});

describe("ThemeSwitcher — default active state", () => {
  it("marks the cream theme as active when nothing is set", () => {
    render(<ThemeSwitcher />);
    const buttons = screen.getAllByRole("button");
    // cream is index 0 — it should have the active border (gold-1).
    // jsdom does not split the `border` shorthand into `borderColor`, so we read
    // the full `style.border` string instead.
    const creamButton = buttons.find((b) =>
      b.textContent?.includes("الثيم الكريمي")
    ) as HTMLButtonElement;
    expect(creamButton.style.border).toContain("var(--gold-1)");
  });

  it("reads the active theme from localStorage on mount", () => {
    localStorage.setItem("wasit_theme", "dark");
    render(<ThemeSwitcher />);
    const darkButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("الثيم الداكن")) as HTMLButtonElement;
    expect(darkButton.style.border).toContain("var(--gold-1)");
  });

  it("prefers data-theme attribute over localStorage", () => {
    localStorage.setItem("wasit_theme", "cream");
    document.documentElement.setAttribute("data-theme", "dark");
    render(<ThemeSwitcher />);
    const darkButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("الثيم الداكن")) as HTMLButtonElement;
    expect(darkButton.style.border).toContain("var(--gold-1)");
  });
});

describe("ThemeSwitcher — theme switching", () => {
  it("sets data-theme on <html> when clicking a different theme", () => {
    render(<ThemeSwitcher />);
    const darkButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("الثيم الداكن")) as HTMLButtonElement;
    fireEvent.click(darkButton);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("persists the new theme to localStorage", () => {
    render(<ThemeSwitcher />);
    const darkButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("الثيم الداكن")) as HTMLButtonElement;
    fireEvent.click(darkButton);
    expect(localStorage.getItem("wasit_theme")).toBe("dark");
  });

  it("updates the active button highlight after switching", () => {
    render(<ThemeSwitcher />);
    const darkButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("الثيم الداكن")) as HTMLButtonElement;
    fireEvent.click(darkButton);
    // after switch, dark button should have the active border
    expect(darkButton.style.border).toContain("var(--gold-1)");
  });

  it("does not re-apply when clicking the already-active theme", () => {
    render(<ThemeSwitcher />);
    const creamButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("الثيم الكريمي")) as HTMLButtonElement;
    // initial state has no data-theme on html
    fireEvent.click(creamButton);
    // clicking the already-active theme is a no-op (early return)
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });

  it("can switch back to cream from dark", () => {
    localStorage.setItem("wasit_theme", "dark");
    render(<ThemeSwitcher />);
    const creamButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("الثيم الكريمي")) as HTMLButtonElement;
    fireEvent.click(creamButton);
    expect(localStorage.getItem("wasit_theme")).toBe("cream");
    expect(document.documentElement.getAttribute("data-theme")).toBe("cream");
  });
});

describe("ThemeSwitcher — check icon on active theme", () => {
  it("renders exactly one check icon for the active theme", () => {
    const { container } = render(<ThemeSwitcher />);
    // Each theme card has an Icon (Sun/Moon) in its title row.
    // The Check icon only renders for the active card.
    // Total svgs = 2 (theme icons) + 1 (check on active) = 3
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(3);
  });

  it("moves the check icon when the theme changes", () => {
    const { container } = render(<ThemeSwitcher />);
    const darkButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("الثيم الداكن")) as HTMLButtonElement;
    fireEvent.click(darkButton);
    // still exactly 3 SVGs after the switch
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(3);
  });
});
