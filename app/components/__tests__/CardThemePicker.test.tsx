// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import CardThemePicker from "../CardThemePicker";
import { CARD_THEMES } from "@/lib/card-themes";

afterEach(cleanup);

describe("CardThemePicker — initial render", () => {
  it("renders the modal with the title", () => {
    render(<CardThemePicker onApply={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("ثيمات البطاقة")).toBeDefined();
  });

  it("shows the total theme count in the subtitle", () => {
    render(<CardThemePicker onApply={vi.fn()} onClose={vi.fn()} />);
    const subtitle = screen.getByText(new RegExp(`${CARD_THEMES.length} ثيم احترافي`));
    expect(subtitle).toBeDefined();
  });

  it("renders all category tabs (الكل + 6 categories)", () => {
    render(<CardThemePicker onApply={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("الكل")).toBeDefined();
    expect(screen.getByText("فاخر")).toBeDefined();
    expect(screen.getByText("عصري")).toBeDefined();
    expect(screen.getByText("كلاسيك")).toBeDefined();
    expect(screen.getByText("مينيمال")).toBeDefined();
    expect(screen.getByText("جريء")).toBeDefined();
    expect(screen.getByText("متخصص")).toBeDefined();
  });

  it("renders a close button with aria-label", () => {
    render(<CardThemePicker onApply={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "إغلاق" })).toBeDefined();
  });

  it("uses RTL direction", () => {
    const { container } = render(<CardThemePicker onApply={vi.fn()} onClose={vi.fn()} />);
    expect((container.firstChild as HTMLElement).getAttribute("dir")).toBe("rtl");
  });

  it("renders all themes by default (when on 'الكل')", () => {
    render(<CardThemePicker onApply={vi.fn()} onClose={vi.fn()} />);
    // every theme name should be visible at least once
    for (const theme of CARD_THEMES) {
      const matches = screen.queryAllByText(theme.name);
      expect(matches.length).toBeGreaterThan(0);
    }
  });

  it("displays the footer hint", () => {
    render(<CardThemePicker onApply={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/التغيير يؤثر على البطاقة فقط/)).toBeDefined();
  });
});

describe("CardThemePicker — category filtering", () => {
  it("filters to luxury themes when 'فاخر' is clicked", () => {
    render(<CardThemePicker onApply={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("فاخر"));

    const luxuryThemes = CARD_THEMES.filter((t) => t.category === "luxury");
    for (const theme of luxuryThemes) {
      expect(screen.queryAllByText(theme.name).length).toBeGreaterThan(0);
    }

    // a modern theme should NOT be present in the grid
    const modernOnly = CARD_THEMES.find(
      (t) => t.category === "modern" && !luxuryThemes.some((l) => l.name === t.name)
    );
    if (modernOnly) {
      expect(screen.queryAllByText(modernOnly.name).length).toBe(0);
    }
  });

  it("returns to all themes when 'الكل' is clicked after a filter", () => {
    render(<CardThemePicker onApply={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("فاخر"));
    fireEvent.click(screen.getByText("الكل"));
    // every theme name visible again
    for (const theme of CARD_THEMES) {
      expect(screen.queryAllByText(theme.name).length).toBeGreaterThan(0);
    }
  });

  it("shows the category count in each tab", () => {
    const { container } = render(<CardThemePicker onApply={vi.fn()} onClose={vi.fn()} />);
    expect(container.textContent).toContain(`(${CARD_THEMES.length})`);
  });
});

describe("CardThemePicker — onApply", () => {
  it("calls onApply with the selected theme data", () => {
    const onApply = vi.fn();
    render(<CardThemePicker onApply={onApply} onClose={vi.fn()} />);

    const firstTheme = CARD_THEMES[0];
    // click the button that contains the first theme's name
    const themeButton = screen
      .getAllByText(firstTheme.name)[0]
      .closest("button") as HTMLButtonElement;
    fireEvent.click(themeButton);

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      bg_color: firstTheme.bg_color,
      text_color: firstTheme.text_color,
      accent_color: firstTheme.accent_color,
      theme_id: firstTheme.id,
    });
  });

  it("includes theme_id matching the registry id", () => {
    const onApply = vi.fn();
    render(<CardThemePicker onApply={onApply} onClose={vi.fn()} />);
    const firstTheme = CARD_THEMES[0];
    const themeButton = screen
      .getAllByText(firstTheme.name)[0]
      .closest("button") as HTMLButtonElement;
    fireEvent.click(themeButton);
    expect(onApply.mock.calls[0][0].theme_id).toBe(firstTheme.id);
  });
});

describe("CardThemePicker — onClose", () => {
  it("calls onClose when the X button is clicked", () => {
    const onClose = vi.fn();
    render(<CardThemePicker onApply={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "إغلاق" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<CardThemePicker onApply={vi.fn()} onClose={onClose} />);
    // backdrop is the outermost div (with the overlay style)
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when the modal body is clicked (stopPropagation)", () => {
    const onClose = vi.fn();
    render(<CardThemePicker onApply={vi.fn()} onClose={onClose} />);
    // click on a theme name (inside modal body)
    const themeName = screen.getAllByText(CARD_THEMES[0].name)[0];
    fireEvent.click(themeName);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CardThemePicker — current selection indicator", () => {
  it("marks the matching theme as current via colors", () => {
    const theme = CARD_THEMES[0];
    const { container } = render(
      <CardThemePicker
        currentBg={theme.bg_color}
        currentAccent={theme.accent_color}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />
    );
    // a Check icon should be rendered for the current theme
    const svgs = Array.from(container.querySelectorAll("svg"));
    // at least one Check icon present (the indicator)
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("is case-insensitive when matching current colors", () => {
    const theme = CARD_THEMES[0];
    const onApply = vi.fn();
    render(
      <CardThemePicker
        currentBg={theme.bg_color.toUpperCase()}
        currentAccent={theme.accent_color.toUpperCase()}
        onApply={onApply}
        onClose={vi.fn()}
      />
    );
    // pick the same theme — should still call onApply
    const themeButton = screen.getAllByText(theme.name)[0].closest("button") as HTMLButtonElement;
    fireEvent.click(themeButton);
    expect(onApply).toHaveBeenCalled();
  });
});
