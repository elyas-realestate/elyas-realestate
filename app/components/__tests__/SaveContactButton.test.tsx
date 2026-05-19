// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SaveContactButton from "../SaveContactButton";

afterEach(cleanup);

describe("SaveContactButton — hero variant (default)", () => {
  it("renders an anchor link to /api/vcard/<slug>", () => {
    render(<SaveContactButton slug="elyas" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/api/vcard/elyas");
  });

  it("uses the brokerName for the download filename when provided", () => {
    render(<SaveContactButton slug="elyas" brokerName="إلياس الدخيل" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("download")).toBe("إلياس الدخيل.vcf");
  });

  it("falls back to the slug when brokerName is missing", () => {
    render(<SaveContactButton slug="elyas" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("download")).toBe("elyas.vcf");
  });

  it("displays the call-to-action text by default", () => {
    render(<SaveContactButton slug="elyas" />);
    expect(screen.getByText(/اضغط لحفظ في جهات اتصالك/)).toBeDefined();
  });

  it("shows the success state after click", () => {
    render(<SaveContactButton slug="elyas" />);
    const link = screen.getByRole("link");
    fireEvent.click(link);
    expect(screen.getByText(/تم التنزيل ✓/)).toBeDefined();
  });

  it("renders supporting subtitle mentioning supported platforms", () => {
    render(<SaveContactButton slug="elyas" />);
    expect(screen.getByText(/iPhone/)).toBeDefined();
  });

  it("renders a contact icon (svg)", () => {
    const { container } = render(<SaveContactButton slug="elyas" />);
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("forwards a custom className", () => {
    const { container } = render(<SaveContactButton slug="elyas" className="my-custom-class" />);
    expect(container.querySelector(".my-custom-class")).not.toBeNull();
  });
});

describe("SaveContactButton — compact variant", () => {
  it("renders a smaller pill-style link", () => {
    render(<SaveContactButton slug="elyas" variant="compact" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/api/vcard/elyas");
  });

  it("uses concise CTA text in compact mode", () => {
    render(<SaveContactButton slug="elyas" variant="compact" />);
    expect(screen.getByText(/احفظ بياناتي/)).toBeDefined();
  });

  it("shows download confirmation in compact mode too", () => {
    render(<SaveContactButton slug="elyas" variant="compact" />);
    fireEvent.click(screen.getByRole("link"));
    expect(screen.getByText(/تم التحميل ✓/)).toBeDefined();
  });
});

describe("SaveContactButton — color contrast", () => {
  it("picks a dark text color for a light accent", () => {
    const { container } = render(<SaveContactButton slug="x" accent="#FFFFFF" />);
    const link = container.querySelector("a");
    expect(link?.style.color.toLowerCase()).toMatch(/rgb\(26,\s*18,\s*6\)|#1a1206/);
  });

  it("picks a light text color for a dark accent", () => {
    const { container } = render(<SaveContactButton slug="x" accent="#000000" />);
    const link = container.querySelector("a");
    expect(link?.style.color.toLowerCase()).toMatch(/rgb\(255,\s*255,\s*255\)|#ffffff/);
  });

  it("handles a 3-char hex accent without throwing", () => {
    expect(() => render(<SaveContactButton slug="x" accent="#abc" />)).not.toThrow();
  });

  it("handles a malformed accent gracefully", () => {
    expect(() => render(<SaveContactButton slug="x" accent="not-a-color" />)).not.toThrow();
  });
});

describe("SaveContactButton — analytics ping", () => {
  it("fires an analytics ping with the slug on click", () => {
    const setSrc = vi.fn();
    // Spy on Image() instances to capture the src assignment
    const OrigImage = global.Image;
    class ImageStub {
      set src(v: string) {
        setSrc(v);
      }
    }
    // @ts-expect-error global override for the test
    global.Image = ImageStub;

    try {
      render(<SaveContactButton slug="my-broker" />);
      fireEvent.click(screen.getByRole("link"));
      expect(setSrc).toHaveBeenCalled();
      const url = setSrc.mock.calls[0][0];
      expect(url).toContain("/api/event");
      expect(url).toContain("vcard_download");
      expect(url).toContain("my-broker");
    } finally {
      global.Image = OrigImage;
    }
  });

  it("URL-encodes a slug with special characters in the ping", () => {
    const setSrc = vi.fn();
    const OrigImage = global.Image;
    class ImageStub {
      set src(v: string) {
        setSrc(v);
      }
    }
    // @ts-expect-error global override for the test
    global.Image = ImageStub;

    try {
      render(<SaveContactButton slug="إلياس" />);
      fireEvent.click(screen.getByRole("link"));
      const url = setSrc.mock.calls[0][0];
      // encodeURIComponent encodes Arabic characters
      expect(url).toMatch(/%[0-9A-F]{2}/);
    } finally {
      global.Image = OrigImage;
    }
  });
});
