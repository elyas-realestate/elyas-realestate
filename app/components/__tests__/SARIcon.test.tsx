// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SARIcon from "../SARIcon";

describe("SARIcon", () => {
  it("renders with default props (size=14, color=muted)", () => {
    const { container } = render(<SARIcon />);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.style.width).toBe("14px");
    // height = round(14 * 1.12) = 16
    expect(span?.style.height).toBe("16px");
  });

  it("sets accessibility attributes (role + aria-label + title)", () => {
    const { container } = render(<SARIcon />);
    const span = container.querySelector("span");
    expect(span?.getAttribute("role")).toBe("img");
    expect(span?.getAttribute("aria-label")).toBe("ريال سعودي");
    expect(span?.getAttribute("title")).toBe("ريال سعودي");
  });

  it("maps the 'accent' color name to the gold CSS variable", () => {
    const { container } = render(<SARIcon color="accent" />);
    const span = container.querySelector("span");
    expect(span?.style.backgroundColor).toContain("var(--gold-2)");
  });

  it("maps the 'strong' color name to the strong text variable", () => {
    const { container } = render(<SARIcon color="strong" />);
    const span = container.querySelector("span");
    expect(span?.style.backgroundColor).toContain("var(--text-strong)");
  });

  it("maps the 'secondary' color name to the soft text variable", () => {
    const { container } = render(<SARIcon color="secondary" />);
    const span = container.querySelector("span");
    expect(span?.style.backgroundColor).toContain("var(--text-soft)");
  });

  it("maps the 'muted' color name to the faint text variable", () => {
    const { container } = render(<SARIcon color="muted" />);
    const span = container.querySelector("span");
    expect(span?.style.backgroundColor).toContain("var(--text-faint)");
  });

  it("uses raw CSS color when given an arbitrary string", () => {
    const { container } = render(<SARIcon color="#FF5500" />);
    const span = container.querySelector("span");
    // jsdom normalizes hex → rgb
    expect(span?.style.backgroundColor.toLowerCase()).toMatch(/rgb\(255,\s*85,\s*0\)|#ff5500/);
  });

  it("scales height proportionally with size", () => {
    const { container } = render(<SARIcon size={20} />);
    const span = container.querySelector("span");
    expect(span?.style.width).toBe("20px");
    // height = round(20 * 1.12) = 22
    expect(span?.style.height).toBe("22px");
  });

  it("forwards custom className to the rendered span", () => {
    const { container } = render(<SARIcon className="my-icon" />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("my-icon");
  });

  it("merges custom style with built-in styles", () => {
    const { container } = render(<SARIcon style={{ opacity: 0.5 }} />);
    const span = container.querySelector("span");
    expect(span?.style.opacity).toBe("0.5");
    // built-in style remains
    expect(span?.style.display).toBe("inline-block");
  });

  it("uses the /sar.png mask image", () => {
    const { container } = render(<SARIcon />);
    const span = container.querySelector("span") as HTMLSpanElement;
    // jsdom may report the value via either webkitMaskImage or maskImage
    const masked =
      span.style.webkitMaskImage ||
      span.style.maskImage ||
      span.style.getPropertyValue("-webkit-mask-image") ||
      span.style.getPropertyValue("mask-image");
    expect(masked).toContain("sar.png");
  });
});
