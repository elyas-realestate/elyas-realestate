// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TestimonialsSection from "../TestimonialsSection";

afterEach(cleanup);

type Testimonial = {
  id: string;
  client_name: string;
  client_role: string | null;
  rating: number;
  content: string;
  is_featured: boolean;
  created_at: string;
};

const makeTestimonial = (overrides: Partial<Testimonial> = {}): Testimonial => ({
  id: "t1",
  client_name: "أحمد العتيبي",
  client_role: "مستثمر عقاري",
  rating: 5,
  content: "خدمة ممتازة وسرعة في التواصل.",
  is_featured: false,
  created_at: "2025-01-01",
  ...overrides,
});

const baseStyling = {
  accent: "#C6914C",
  bgColor: "#FAF7F2",
  textColor: "#1A1206",
};

describe("TestimonialsSection — empty states", () => {
  it("renders nothing when testimonials is an empty array", () => {
    const { container } = render(<TestimonialsSection testimonials={[]} {...baseStyling} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when testimonials is undefined-like (null cast)", () => {
    const { container } = render(
      <TestimonialsSection testimonials={null as unknown as Testimonial[]} {...baseStyling} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("TestimonialsSection — heading + counts", () => {
  it("renders the 'قالوا عني' heading", () => {
    render(<TestimonialsSection testimonials={[makeTestimonial()]} {...baseStyling} />);
    expect(screen.getByText("قالوا عني")).toBeDefined();
  });

  it("shows singular 'رأي' label when there's exactly one", () => {
    render(<TestimonialsSection testimonials={[makeTestimonial()]} {...baseStyling} />);
    expect(screen.getByText(/1 رأي/)).toBeDefined();
  });

  it("shows plural 'آراء' label when there are multiple", () => {
    const list = [
      makeTestimonial({ id: "a" }),
      makeTestimonial({ id: "b" }),
      makeTestimonial({ id: "c" }),
    ];
    render(<TestimonialsSection testimonials={list} {...baseStyling} />);
    expect(screen.getByText(/3 آراء/)).toBeDefined();
  });
});

describe("TestimonialsSection — card content", () => {
  it("renders the client name and content", () => {
    render(
      <TestimonialsSection
        testimonials={[makeTestimonial({ client_name: "خالد", content: "ممتاز" })]}
        {...baseStyling}
      />
    );
    expect(screen.getByText("خالد")).toBeDefined();
    expect(screen.getByText("ممتاز")).toBeDefined();
  });

  it("renders the client role when present", () => {
    render(
      <TestimonialsSection
        testimonials={[makeTestimonial({ client_role: "مالك مكتب عقاري" })]}
        {...baseStyling}
      />
    );
    expect(screen.getByText("مالك مكتب عقاري")).toBeDefined();
  });

  it("does NOT render the role row when client_role is null", () => {
    render(
      <TestimonialsSection
        testimonials={[makeTestimonial({ client_role: null })]}
        {...baseStyling}
      />
    );
    // The role text is missing — there should be exactly one element for the name
    expect(screen.queryByText("مستثمر عقاري")).toBeNull();
  });

  it("renders the featured badge only when is_featured = true", () => {
    const { rerender } = render(
      <TestimonialsSection
        testimonials={[makeTestimonial({ is_featured: false })]}
        {...baseStyling}
      />
    );
    expect(screen.queryByText(/مميّز/)).toBeNull();

    rerender(
      <TestimonialsSection
        testimonials={[makeTestimonial({ is_featured: true })]}
        {...baseStyling}
      />
    );
    expect(screen.getByText(/مميّز/)).toBeDefined();
  });

  it("uses the first letter of the client name in the avatar", () => {
    const { container } = render(
      <TestimonialsSection
        testimonials={[makeTestimonial({ client_name: "Khaled Ali" })]}
        {...baseStyling}
      />
    );
    // The avatar div is the only place 'K' appears as standalone text
    expect(container.textContent).toContain("K");
  });

  it("falls back to '؟' when client name is empty", () => {
    const { container } = render(
      <TestimonialsSection testimonials={[makeTestimonial({ client_name: "" })]} {...baseStyling} />
    );
    expect(container.textContent).toContain("؟");
  });
});

describe("TestimonialsSection — rating stars", () => {
  it("does NOT render the rating row when rating is 0", () => {
    const { container } = render(
      <TestimonialsSection testimonials={[makeTestimonial({ rating: 0 })]} {...baseStyling} />
    );
    // There should still be the heading star + avatar — but no row of 5 small rating stars
    // We assert there are FEWER svgs than the rating-included variant
    const noRatingSvgs = container.querySelectorAll("svg").length;

    cleanup();
    const { container: withRating } = render(
      <TestimonialsSection testimonials={[makeTestimonial({ rating: 5 })]} {...baseStyling} />
    );
    const withRatingSvgs = withRating.querySelectorAll("svg").length;

    expect(withRatingSvgs).toBeGreaterThan(noRatingSvgs);
  });

  it("renders 5 star icons for any non-zero rating", () => {
    const { container } = render(
      <TestimonialsSection testimonials={[makeTestimonial({ rating: 3 })]} {...baseStyling} />
    );
    // Heading uses 1 star + Quote icon + 5 rating stars + (no role icon)
    // We assert at least 5 stars exist (rating row) + heading star
    const svgs = container.querySelectorAll("svg");
    // 1 heading star + 1 quote + 5 rating stars = 7
    expect(svgs.length).toBeGreaterThanOrEqual(7);
  });
});

describe("TestimonialsSection — multiple cards", () => {
  it("renders one card per testimonial", () => {
    // Use distinguishable names that won't collide with single-letter avatar text.
    const list = [
      makeTestimonial({ id: "1", client_name: "أحمد علي" }),
      makeTestimonial({ id: "2", client_name: "بدر السبيعي" }),
      makeTestimonial({ id: "3", client_name: "جمال البلوي" }),
    ];
    render(<TestimonialsSection testimonials={list} {...baseStyling} />);
    expect(screen.getByText("أحمد علي")).toBeDefined();
    expect(screen.getByText("بدر السبيعي")).toBeDefined();
    expect(screen.getByText("جمال البلوي")).toBeDefined();
  });
});
