// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import {
  XIcon,
  InstagramIcon,
  TikTokIcon,
  SnapchatIcon,
  LinkedInIcon,
  YouTubeIcon,
  ThreadsIcon,
  FacebookIcon,
  WhatsAppIcon,
  TelegramIcon,
  GoogleMapsIcon,
  EmailIcon,
  PhoneIcon,
  BRAND_COLORS,
  BRAND_ICON_MAP,
  BRAND_BG_MAP,
  getBrandIcon,
  getBrandColor,
  getBrandBg,
  getBrandFg,
} from "../BrandIcons";

afterEach(cleanup);

describe("BrandIcons — individual icon components", () => {
  const ALL_ICONS = [
    { name: "XIcon", Component: XIcon },
    { name: "InstagramIcon", Component: InstagramIcon },
    { name: "TikTokIcon", Component: TikTokIcon },
    { name: "SnapchatIcon", Component: SnapchatIcon },
    { name: "LinkedInIcon", Component: LinkedInIcon },
    { name: "YouTubeIcon", Component: YouTubeIcon },
    { name: "ThreadsIcon", Component: ThreadsIcon },
    { name: "FacebookIcon", Component: FacebookIcon },
    { name: "WhatsAppIcon", Component: WhatsAppIcon },
    { name: "TelegramIcon", Component: TelegramIcon },
    { name: "GoogleMapsIcon", Component: GoogleMapsIcon },
    { name: "EmailIcon", Component: EmailIcon },
    { name: "PhoneIcon", Component: PhoneIcon },
  ];

  for (const { name, Component } of ALL_ICONS) {
    it(`${name} renders an <svg> with a <path>`, () => {
      const { container } = render(<Component />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg?.querySelector("path")).not.toBeNull();
    });

    it(`${name} applies the default size of 18`, () => {
      const { container } = render(<Component />);
      const svg = container.querySelector("svg") as SVGElement;
      expect(svg.getAttribute("width")).toBe("18");
      expect(svg.getAttribute("height")).toBe("18");
    });

    it(`${name} accepts a custom size prop`, () => {
      const { container } = render(<Component size={42} />);
      const svg = container.querySelector("svg") as SVGElement;
      expect(svg.getAttribute("width")).toBe("42");
      expect(svg.getAttribute("height")).toBe("42");
    });

    it(`${name} accepts a custom color prop`, () => {
      const { container } = render(<Component color="#FF00FF" />);
      const svg = container.querySelector("svg") as SVGElement;
      expect(svg.getAttribute("fill")).toBe("#FF00FF");
    });

    it(`${name} is aria-hidden for screen readers`, () => {
      const { container } = render(<Component />);
      const svg = container.querySelector("svg") as SVGElement;
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    });
  }
});

describe("BrandIcons — BRAND_COLORS map", () => {
  it("contains all known platform keys", () => {
    const keys = [
      "x",
      "twitter",
      "instagram",
      "tiktok",
      "snapchat",
      "linkedin",
      "youtube",
      "threads",
      "facebook",
      "whatsapp",
      "telegram",
      "googlemaps",
      "email",
      "phone",
    ];
    for (const key of keys) {
      expect(BRAND_COLORS[key]).toBeDefined();
      expect(BRAND_COLORS[key]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("uses the canonical WhatsApp green", () => {
    expect(BRAND_COLORS.whatsapp).toBe("#25D366");
  });

  it("uses the canonical Facebook blue", () => {
    expect(BRAND_COLORS.facebook).toBe("#1877F2");
  });
});

describe("BrandIcons — BRAND_ICON_MAP", () => {
  it("maps both social_* and short aliases for the same platform", () => {
    expect(BRAND_ICON_MAP.social_x).toBe(BRAND_ICON_MAP.x);
    expect(BRAND_ICON_MAP.social_instagram).toBe(BRAND_ICON_MAP.instagram);
    expect(BRAND_ICON_MAP.social_facebook).toBe(BRAND_ICON_MAP.facebook);
  });

  it("maps contact_* keys", () => {
    expect(BRAND_ICON_MAP.contact_whatsapp).toBe(WhatsAppIcon);
    expect(BRAND_ICON_MAP.contact_phone).toBe(PhoneIcon);
    expect(BRAND_ICON_MAP.contact_email).toBe(EmailIcon);
  });

  it("treats twitter as an alias for X", () => {
    expect(BRAND_ICON_MAP.twitter).toBe(XIcon);
  });

  it("treats whatsapp_chat as WhatsAppIcon", () => {
    expect(BRAND_ICON_MAP.whatsapp_chat).toBe(WhatsAppIcon);
  });
});

describe("BrandIcons — getBrandIcon", () => {
  it("returns the right component for a known key", () => {
    expect(getBrandIcon("instagram")).toBe(InstagramIcon);
    expect(getBrandIcon("social_telegram")).toBe(TelegramIcon);
    expect(getBrandIcon("contact_email")).toBe(EmailIcon);
  });

  it("returns null for an unknown key", () => {
    expect(getBrandIcon("unknown_platform")).toBeNull();
    expect(getBrandIcon("")).toBeNull();
  });
});

describe("BrandIcons — getBrandColor", () => {
  it("returns the canonical color for a known key", () => {
    expect(getBrandColor("whatsapp")).toBe("#25D366");
    expect(getBrandColor("facebook")).toBe("#1877F2");
  });

  it("returns the neutral fallback for unknown keys", () => {
    expect(getBrandColor("ghost")).toBe("#6B7280");
  });
});

describe("BrandIcons — BRAND_BG_MAP", () => {
  it("uses gradients for Instagram and TikTok", () => {
    expect(BRAND_BG_MAP.social_instagram).toContain("linear-gradient");
    expect(BRAND_BG_MAP.social_tiktok).toContain("linear-gradient");
  });

  it("uses solid colors for other platforms", () => {
    expect(BRAND_BG_MAP.social_facebook).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(BRAND_BG_MAP.contact_whatsapp).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe("BrandIcons — getBrandBg / getBrandFg", () => {
  it("returns mapped background or null", () => {
    expect(getBrandBg("social_facebook")).toBe("#1877F2");
    expect(getBrandBg("nonexistent")).toBeNull();
  });

  it("returns mapped foreground", () => {
    expect(getBrandFg("social_facebook")).toBe("#FFFFFF");
    expect(getBrandFg("social_snapchat")).toBe("#000000");
  });

  it("returns null FG for unknown keys", () => {
    expect(getBrandFg("nonexistent")).toBeNull();
  });
});
