// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ServiceIcon, { SERVICE_ICON_KEYS } from "../ServiceIcon";

describe("ServiceIcon", () => {
  it("renders a single SVG element", () => {
    const { container } = render(<ServiceIcon name="home" />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(1);
  });

  it("renders with default size 26", () => {
    const { container } = render(<ServiceIcon name="home" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("26");
    expect(svg?.getAttribute("height")).toBe("26");
  });

  it("respects a custom size", () => {
    const { container } = render(<ServiceIcon name="home" size={48} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("48");
    expect(svg?.getAttribute("height")).toBe("48");
  });

  it("uses currentColor by default", () => {
    const { container } = render(<ServiceIcon name="home" />);
    const svg = container.querySelector("svg");
    // lucide-react places color on stroke, not fill
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
  });

  it("uses a custom color when given", () => {
    const { container } = render(<ServiceIcon name="home" color="#ff0000" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("stroke")).toBe("#ff0000");
  });

  it("uses stroke-width 1.6 (lucide convention for thin icons)", () => {
    const { container } = render(<ServiceIcon name="home" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("stroke-width")).toBe("1.6");
  });

  it("falls back to the Home icon for an unknown name", () => {
    const { container: homeContainer } = render(<ServiceIcon name="home" />);
    const { container: unknownContainer } = render(<ServiceIcon name="completely-unknown-key" />);
    // both should produce the same path (Home icon)
    const homePaths = Array.from(homeContainer.querySelectorAll("path,line,polyline,rect"))
      .map((el) => el.outerHTML)
      .join("");
    const unknownPaths = Array.from(unknownContainer.querySelectorAll("path,line,polyline,rect"))
      .map((el) => el.outerHTML)
      .join("");
    expect(unknownPaths).toBe(homePaths);
  });

  it("renders for every documented key without errors", () => {
    for (const key of SERVICE_ICON_KEYS) {
      const { container } = render(<ServiceIcon name={key} />);
      expect(container.querySelector("svg")).not.toBeNull();
    }
  });

  it("supports legacy emoji aliases (🏠 → home)", () => {
    const { container: emojiContainer } = render(<ServiceIcon name="🏠" />);
    const { container: keyContainer } = render(<ServiceIcon name="home" />);
    // both should produce the same SVG structure (Home icon)
    expect(emojiContainer.querySelector("svg")?.innerHTML).toBe(
      keyContainer.querySelector("svg")?.innerHTML
    );
  });

  it("supports the 🔍 search emoji alias", () => {
    const { container: emojiContainer } = render(<ServiceIcon name="🔍" />);
    const { container: keyContainer } = render(<ServiceIcon name="search" />);
    expect(emojiContainer.querySelector("svg")?.innerHTML).toBe(
      keyContainer.querySelector("svg")?.innerHTML
    );
  });

  it("differentiates between distinct icons (e.g. home vs search)", () => {
    const { container: homeContainer } = render(<ServiceIcon name="home" />);
    const { container: searchContainer } = render(<ServiceIcon name="search" />);
    expect(homeContainer.querySelector("svg")?.innerHTML).not.toBe(
      searchContainer.querySelector("svg")?.innerHTML
    );
  });
});

describe("SERVICE_ICON_KEYS export", () => {
  it("exports an array of strings", () => {
    expect(Array.isArray(SERVICE_ICON_KEYS)).toBe(true);
    expect(SERVICE_ICON_KEYS.length).toBeGreaterThan(0);
    for (const key of SERVICE_ICON_KEYS) {
      expect(typeof key).toBe("string");
    }
  });

  it("includes the core service-related keys", () => {
    expect(SERVICE_ICON_KEYS).toContain("home");
    expect(SERVICE_ICON_KEYS).toContain("building");
    expect(SERVICE_ICON_KEYS).toContain("contract");
    expect(SERVICE_ICON_KEYS).toContain("award");
  });

  it("contains no duplicate keys", () => {
    expect(new Set(SERVICE_ICON_KEYS).size).toBe(SERVICE_ICON_KEYS.length);
  });
});
