// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import NeighborhoodIntel from "../NeighborhoodIntel";

const SAMPLE_DATA = {
  city: "الرياض",
  district: "النرجس",
  description_ar: "حي راقٍ في شمال الرياض يجمع بين الهدوء والخدمات المتكاملة.",
  highlights: ["مدارس عالمية", "مولات قريبة", "حدائق عامة"],
  schools_count: 12,
  mosques_count: 8,
  hospitals_count: 3,
  restaurants_count: 25,
};

function mockOk() {
  return vi
    .spyOn(global, "fetch")
    .mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: SAMPLE_DATA }), { status: 200 })
    );
}

function mockError() {
  return vi
    .spyOn(global, "fetch")
    .mockResolvedValue(new Response(JSON.stringify({ ok: false }), { status: 500 }));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(cleanup);

describe("NeighborhoodIntel — empty-state guards", () => {
  it("renders null when city is missing", () => {
    const { container } = render(<NeighborhoodIntel city={null} district="النرجس" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when district is missing", () => {
    const { container } = render(<NeighborhoodIntel city="الرياض" district={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("does NOT fetch when city or district is empty", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    render(<NeighborhoodIntel city={null} district={null} />);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("NeighborhoodIntel — happy path", () => {
  it("hits /api/ai/neighborhood-intel with URL-encoded params", async () => {
    const fetchMock = mockOk();
    render(<NeighborhoodIntel city="الرياض" district="النرجس" />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/ai/neighborhood-intel");
    expect(url).toContain(encodeURIComponent("الرياض"));
    expect(url).toContain(encodeURIComponent("النرجس"));
  });

  it("renders the heading with district and city after data arrives", async () => {
    mockOk();
    const { container } = render(<NeighborhoodIntel city="الرياض" district="النرجس" />);
    await waitFor(() => {
      expect(container.textContent).toContain("النرجس");
    });
    expect(container.textContent).toContain("الرياض");
  });

  it("renders the description after data arrives", async () => {
    mockOk();
    render(<NeighborhoodIntel city="الرياض" district="النرجس" />);
    await waitFor(() => {
      expect(screen.queryByText(SAMPLE_DATA.description_ar!)).not.toBeNull();
    });
  });

  it("renders up to 6 highlight pills", async () => {
    mockOk();
    render(<NeighborhoodIntel city="الرياض" district="النرجس" />);
    await waitFor(() => {
      expect(screen.queryByText("مدارس عالمية")).not.toBeNull();
    });
    expect(screen.getByText("مولات قريبة")).toBeDefined();
    expect(screen.getByText("حدائق عامة")).toBeDefined();
  });

  it("renders the stat boxes (schools, mosques, hospitals, restaurants)", async () => {
    mockOk();
    render(<NeighborhoodIntel city="الرياض" district="النرجس" />);
    await waitFor(() => {
      expect(screen.queryByText("مدارس")).not.toBeNull();
    });
    expect(screen.getByText("مساجد")).toBeDefined();
    expect(screen.getByText("مستشفيات/عيادات")).toBeDefined();
    expect(screen.getByText("مطاعم/مقاهي")).toBeDefined();
    expect(screen.getByText("12+")).toBeDefined();
    expect(screen.getByText("25+")).toBeDefined();
  });

  it("renders the disclaimer footer", async () => {
    mockOk();
    render(<NeighborhoodIntel city="الرياض" district="النرجس" />);
    await waitFor(() => {
      expect(screen.queryByText(/المعلومات إرشادية ومُولَّدة آلياً/)).not.toBeNull();
    });
  });

  it("renders the AI badge in the header", async () => {
    mockOk();
    render(<NeighborhoodIntel city="الرياض" district="النرجس" />);
    await waitFor(() => {
      expect(screen.queryByText("AI")).not.toBeNull();
    });
  });
});

describe("NeighborhoodIntel — error path", () => {
  it("returns null when the API responds with ok:false (and no prior data)", async () => {
    mockError();
    const { container } = render(<NeighborhoodIntel city="الرياض" district="النرجس" />);
    // Wait long enough for the fetch and state update to settle
    await waitFor(() => {
      // either still loading then hidden, or already hidden
      expect(container.firstChild).toBeNull();
    });
  });

  it("returns null when fetch rejects", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));
    const { container } = render(<NeighborhoodIntel city="الرياض" district="النرجس" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});

describe("NeighborhoodIntel — partial data", () => {
  it("skips the stat row when all counts are null/zero/missing", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          data: {
            ...SAMPLE_DATA,
            schools_count: null,
            mosques_count: null,
            hospitals_count: null,
            restaurants_count: null,
          },
        }),
        { status: 200 }
      )
    );
    render(<NeighborhoodIntel city="الرياض" district="النرجس" />);
    await waitFor(() => {
      expect(screen.queryByText(SAMPLE_DATA.description_ar!)).not.toBeNull();
    });
    expect(screen.queryByText("مدارس")).toBeNull();
  });
});
