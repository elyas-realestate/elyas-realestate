// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Spinner, SkeletonRow, SkeletonCard, EmptyState, ErrorState } from "../LoadingStates";

afterEach(cleanup);

describe("Spinner", () => {
  it("renders a single Loader2 icon (svg)", () => {
    const { container } = render(<Spinner />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(1);
  });

  it("renders the optional label text", () => {
    render(<Spinner label="جاري التحميل" />);
    expect(screen.getByText("جاري التحميل")).toBeDefined();
  });

  it("does not render a label when none provided", () => {
    const { container } = render(<Spinner />);
    // no span/label text visible
    expect(container.querySelectorAll("span").length).toBe(0);
  });

  it("uses the custom color CSS color value", () => {
    const { container } = render(<Spinner color="#ff0000" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.color.toLowerCase()).toMatch(/rgb\(255,\s*0,\s*0\)|#ff0000/);
  });

  it("renders inline by default (no fullPage container)", () => {
    const { container } = render(<Spinner />);
    const wrapper = container.firstChild as HTMLElement;
    // when not fullPage, the outermost wrapper is the flex row itself
    expect(wrapper.style.minHeight).toBe("");
  });

  it("renders a fullPage centering wrapper when requested", () => {
    const { container } = render(<Spinner fullPage label="x" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.minHeight).toBe("60vh");
    expect(wrapper.getAttribute("dir")).toBe("rtl");
  });
});

describe("SkeletonRow", () => {
  it("renders the default 3 skeleton rows", () => {
    const { container } = render(<SkeletonRow />);
    // the outer wrapper holds N skeleton divs + a <style> child
    const wrapper = container.firstChild as HTMLElement;
    const rowDivs = wrapper.querySelectorAll(":scope > div");
    expect(rowDivs.length).toBe(3);
  });

  it("renders the requested count", () => {
    const { container } = render(<SkeletonRow count={7} />);
    const wrapper = container.firstChild as HTMLElement;
    const rowDivs = wrapper.querySelectorAll(":scope > div");
    expect(rowDivs.length).toBe(7);
  });

  it("applies the requested height in px", () => {
    const { container } = render(<SkeletonRow count={1} height={100} />);
    const wrapper = container.firstChild as HTMLElement;
    const row = wrapper.querySelector(":scope > div") as HTMLElement;
    expect(row.style.height).toBe("100px");
  });

  it("renders an inline @keyframes style block", () => {
    const { container } = render(<SkeletonRow count={1} />);
    const style = container.querySelector("style");
    expect(style).not.toBeNull();
    expect(style?.textContent).toMatch(/skeletonPulse/);
  });
});

describe("SkeletonCard", () => {
  it("renders with default height 180", () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.height).toBe("180px");
  });

  it("respects a custom height", () => {
    const { container } = render(<SkeletonCard height={240} />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.height).toBe("240px");
  });

  it("has rounded corners (border-radius 14)", () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.borderRadius).toBe("14px");
  });
});

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="لا توجد نتائج" />);
    expect(screen.getByText("لا توجد نتائج")).toBeDefined();
  });

  it("renders the optional description", () => {
    render(<EmptyState title="x" description="جرّب تعديل المرشحات" />);
    expect(screen.getByText("جرّب تعديل المرشحات")).toBeDefined();
  });

  it("does not render a description when not provided", () => {
    const { container } = render(<EmptyState title="x" />);
    // only one <p> (the title)
    expect(container.querySelectorAll("p").length).toBe(1);
  });

  it("renders the icon when provided", () => {
    render(<EmptyState title="x" icon={<span data-testid="icon">🔍</span>} />);
    expect(screen.getByTestId("icon")).toBeDefined();
  });

  it("renders an action node when provided", () => {
    render(<EmptyState title="x" action={<button data-testid="action">إضافة</button>} />);
    expect(screen.getByTestId("action")).toBeDefined();
  });

  it("uses RTL direction", () => {
    const { container } = render(<EmptyState title="x" />);
    expect((container.firstChild as HTMLElement).getAttribute("dir")).toBe("rtl");
  });
});

describe("ErrorState", () => {
  it("renders the default error message", () => {
    render(<ErrorState />);
    expect(screen.getByText("حدث خطأ غير متوقّع")).toBeDefined();
  });

  it("renders a custom error message", () => {
    render(<ErrorState message="فشل الاتصال" />);
    expect(screen.getByText("فشل الاتصال")).toBeDefined();
  });

  it("does not render a retry button by default", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders a retry button when onRetry is provided", () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByRole("button", { name: "إعادة المحاولة" })).toBeDefined();
  });

  it("calls onRetry when the retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("uses RTL direction", () => {
    const { container } = render(<ErrorState />);
    expect((container.firstChild as HTMLElement).getAttribute("dir")).toBe("rtl");
  });
});
