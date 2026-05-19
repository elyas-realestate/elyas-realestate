// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SocialIcon from "../SocialIcon";

describe("SocialIcon", () => {
  it("renders an SVG with default size of 18", () => {
    const { container } = render(<SocialIcon name="x" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("18");
    expect(svg?.getAttribute("height")).toBe("18");
  });

  it("uses currentColor by default for inheritance from parent", () => {
    const { container } = render(<SocialIcon name="instagram" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("currentColor");
  });

  it("uses the brand color when color='brand'", () => {
    const { container } = render(<SocialIcon name="instagram" color="brand" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("#E4405F");
  });

  it("uses youtube brand color (red)", () => {
    const { container } = render(<SocialIcon name="youtube" color="brand" />);
    expect(container.querySelector("svg")?.getAttribute("fill")).toBe("#FF0000");
  });

  it("uses whatsapp brand color (green)", () => {
    const { container } = render(<SocialIcon name="whatsapp" color="brand" />);
    expect(container.querySelector("svg")?.getAttribute("fill")).toBe("#25D366");
  });

  it("uses linkedin brand color (blue)", () => {
    const { container } = render(<SocialIcon name="linkedin" color="brand" />);
    expect(container.querySelector("svg")?.getAttribute("fill")).toBe("#0A66C2");
  });

  it("uses a custom CSS color when given", () => {
    const { container } = render(<SocialIcon name="x" color="#123456" />);
    expect(container.querySelector("svg")?.getAttribute("fill")).toBe("#123456");
  });

  it("respects a custom size", () => {
    const { container } = render(<SocialIcon name="x" size={32} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("32");
    expect(svg?.getAttribute("height")).toBe("32");
  });

  it("sets viewBox 0 0 24 24", () => {
    const { container } = render(<SocialIcon name="x" />);
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 24 24");
  });

  it("sets aria-hidden='true' (decorative)", () => {
    const { container } = render(<SocialIcon name="x" />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("includes a path element with a non-empty d attribute", () => {
    const { container } = render(<SocialIcon name="x" />);
    const path = container.querySelector("path");
    expect(path).not.toBeNull();
    expect(path?.getAttribute("d")?.length).toBeGreaterThan(20);
  });

  it("renders different paths for different platforms", () => {
    const { container: xContainer } = render(<SocialIcon name="x" />);
    const { container: igContainer } = render(<SocialIcon name="instagram" />);
    const xPath = xContainer.querySelector("path")?.getAttribute("d");
    const igPath = igContainer.querySelector("path")?.getAttribute("d");
    expect(xPath).not.toBe(igPath);
  });

  it("treats x and twitter aliases identically (same path)", () => {
    const { container: xContainer } = render(<SocialIcon name="x" />);
    const { container: tContainer } = render(<SocialIcon name="twitter" />);
    expect(xContainer.querySelector("path")?.getAttribute("d")).toBe(
      tContainer.querySelector("path")?.getAttribute("d")
    );
  });

  it("renders nothing for an unknown name", () => {
    const { container } = render(
      // @ts-expect-error testing unknown name fallback
      <SocialIcon name="unknown-platform" />
    );
    expect(container.querySelector("svg")).toBeNull();
  });
});
