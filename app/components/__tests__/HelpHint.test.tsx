// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HelpHint from "../HelpHint";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("HelpHint — initial render", () => {
  it("renders the trigger button (closed by default)", () => {
    render(<HelpHint body="شرح" />);
    const button = screen.getByRole("button", { name: /مساعدة/i });
    expect(button).toBeDefined();
  });

  it("does not show tooltip body content before clicking", () => {
    render(<HelpHint body="نص الشرح" />);
    expect(screen.queryByText("نص الشرح")).toBeNull();
  });

  it("uses the provided title as the aria-label on the trigger", () => {
    render(<HelpHint title="مساعدة العنوان" body="x" />);
    const button = screen.getByRole("button", { name: "مساعدة العنوان" });
    expect(button).toBeDefined();
  });

  it("falls back to 'مساعدة' when no title is provided", () => {
    render(<HelpHint body="x" />);
    const button = screen.getByRole("button", { name: "مساعدة" });
    expect(button).toBeDefined();
  });
});

describe("HelpHint — open/close behaviour", () => {
  it("shows the body when the trigger is clicked", () => {
    render(<HelpHint body="نص الشرح" />);
    fireEvent.click(screen.getByRole("button", { name: /مساعدة/i }));
    expect(screen.getByText("نص الشرح")).toBeDefined();
  });

  it("shows the title in the tooltip when provided", () => {
    render(<HelpHint title="العنوان" body="الشرح" />);
    fireEvent.click(screen.getByRole("button", { name: /العنوان/i }));
    expect(screen.getByText("العنوان")).toBeDefined();
    expect(screen.getByText("الشرح")).toBeDefined();
  });

  it("toggles closed when the trigger is clicked again", () => {
    render(<HelpHint body="نص الشرح" />);
    const button = screen.getByRole("button", { name: /مساعدة/i });
    fireEvent.click(button);
    expect(screen.getByText("نص الشرح")).toBeDefined();
    fireEvent.click(button);
    expect(screen.queryByText("نص الشرح")).toBeNull();
  });

  it("closes when the close (X) button is clicked", () => {
    render(<HelpHint body="نص الشرح" />);
    fireEvent.click(screen.getByRole("button", { name: /مساعدة/i }));
    expect(screen.getByText("نص الشرح")).toBeDefined();
    const closeBtn = screen.getByRole("button", { name: "إغلاق" });
    fireEvent.click(closeBtn);
    expect(screen.queryByText("نص الشرح")).toBeNull();
  });

  it("closes when the Escape key is pressed", () => {
    render(<HelpHint body="نص الشرح" />);
    fireEvent.click(screen.getByRole("button", { name: /مساعدة/i }));
    expect(screen.getByText("نص الشرح")).toBeDefined();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("نص الشرح")).toBeNull();
  });

  it("closes when clicking outside the hint", () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <HelpHint body="نص الشرح" />
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: /مساعدة/i }));
    expect(screen.getByText("نص الشرح")).toBeDefined();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("نص الشرح")).toBeNull();
  });
});

describe("HelpHint — helpUrl link", () => {
  it("does not render a help link when helpUrl is not provided", () => {
    render(<HelpHint body="x" />);
    fireEvent.click(screen.getByRole("button", { name: /مساعدة/i }));
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders a help link with the default label", () => {
    render(<HelpHint body="x" helpUrl="/help/topic" />);
    fireEvent.click(screen.getByRole("button", { name: /مساعدة/i }));
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/help/topic");
    expect(link.textContent).toBe("تفاصيل أكثر ←");
  });

  it("uses a custom helpLabel when provided", () => {
    render(<HelpHint body="x" helpUrl="/help/topic" helpLabel="افتح دليل المساعدة" />);
    fireEvent.click(screen.getByRole("button", { name: /مساعدة/i }));
    expect(screen.getByText("افتح دليل المساعدة")).toBeDefined();
  });
});

describe("HelpHint — sizing", () => {
  it("uses larger button size when size='md' (default)", () => {
    const { container } = render(<HelpHint body="x" />);
    const button = container.querySelector("button");
    expect(button?.style.width).toBe("26px");
    expect(button?.style.height).toBe("26px");
  });

  it("uses smaller button size when size='sm'", () => {
    const { container } = render(<HelpHint body="x" size="sm" />);
    const button = container.querySelector("button");
    expect(button?.style.width).toBe("22px");
    expect(button?.style.height).toBe("22px");
  });
});
