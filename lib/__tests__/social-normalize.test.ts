import { describe, it, expect } from "vitest";
import { normalizeSocial, extractUsername, getSmartPlaceholder } from "../social-normalize";

describe("normalizeSocial — empty input", () => {
  it("returns empty string for empty input", () => {
    expect(normalizeSocial("x", "")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeSocial("x", "   ")).toBe("");
  });

  it("returns empty string for non-string input passed at runtime", () => {
    // The function has a typeof check for non-string input at runtime;
    // we cast through unknown to bypass TS for this defensive-coding test.
    expect(normalizeSocial("x", null as unknown as string)).toBe("");
  });
});

describe("normalizeSocial — X / Twitter", () => {
  it("normalizes bare username", () => {
    expect(normalizeSocial("x", "elyasad1")).toBe("https://x.com/elyasad1");
  });

  it("strips leading @ from username", () => {
    expect(normalizeSocial("x", "@elyasad1")).toBe("https://x.com/elyasad1");
  });

  it("preserves a full https URL", () => {
    expect(normalizeSocial("x", "https://x.com/elyasad1")).toBe("https://x.com/elyasad1");
  });

  it("treats twitter.com URLs as belonging to the platform", () => {
    // The function returns the URL as-is when domain matches the platform's domains,
    // including twitter.com (a known alias for x)
    expect(normalizeSocial("x", "https://twitter.com/elyasad1")).toBe(
      "https://twitter.com/elyasad1"
    );
  });

  it("treats the twitter platform alias the same as x", () => {
    expect(normalizeSocial("twitter", "elyasad1")).toBe("https://x.com/elyasad1");
  });

  it("adds https:// for x.com/handle without protocol", () => {
    expect(normalizeSocial("x", "x.com/elyasad1")).toBe("https://x.com/elyasad1");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeSocial("x", "  elyasad1  ")).toBe("https://x.com/elyasad1");
  });
});

describe("normalizeSocial — Instagram", () => {
  it("normalizes bare username", () => {
    expect(normalizeSocial("instagram", "elyas_realestate")).toBe(
      "https://instagram.com/elyas_realestate"
    );
  });

  it("strips leading @", () => {
    expect(normalizeSocial("instagram", "@elyas_realestate")).toBe(
      "https://instagram.com/elyas_realestate"
    );
  });
});

describe("normalizeSocial — TikTok (needs @ in URL)", () => {
  it("adds @ to URL prefix automatically", () => {
    expect(normalizeSocial("tiktok", "elyasad1")).toBe("https://tiktok.com/@elyasad1");
  });

  it("strips user-provided @ before adding the prefix @", () => {
    expect(normalizeSocial("tiktok", "@elyasad1")).toBe("https://tiktok.com/@elyasad1");
  });
});

describe("normalizeSocial — YouTube (needs @ in URL)", () => {
  it("adds @ for bare username", () => {
    expect(normalizeSocial("youtube", "channelhandle")).toBe("https://youtube.com/@channelhandle");
  });
});

describe("normalizeSocial — Threads (needs @ in URL)", () => {
  it("adds @ for bare username", () => {
    expect(normalizeSocial("threads", "elyas_realestate")).toBe(
      "https://threads.net/@elyas_realestate"
    );
  });
});

describe("normalizeSocial — LinkedIn", () => {
  it("normalizes bare username with /in/ prefix", () => {
    expect(normalizeSocial("linkedin", "elyas-aldakhil")).toBe(
      "https://linkedin.com/in/elyas-aldakhil"
    );
  });
});

describe("normalizeSocial — WhatsApp", () => {
  it("converts local Saudi number starting with 0 to international format", () => {
    expect(normalizeSocial("whatsapp", "0501234567")).toBe("https://wa.me/966501234567");
  });

  it("adds 966 to 9-digit number starting with 5", () => {
    expect(normalizeSocial("whatsapp", "501234567")).toBe("https://wa.me/966501234567");
  });

  it("preserves a number that already has 966", () => {
    expect(normalizeSocial("whatsapp", "966501234567")).toBe("https://wa.me/966501234567");
  });

  it("strips leading + from international format", () => {
    expect(normalizeSocial("whatsapp", "+966501234567")).toBe("https://wa.me/966501234567");
  });

  it("strips spaces, dashes, and parentheses from numbers", () => {
    expect(normalizeSocial("whatsapp", "+966 (50) 123-4567")).toBe("https://wa.me/966501234567");
  });

  it("preserves an existing https wa.me link", () => {
    expect(normalizeSocial("whatsapp", "https://wa.me/966501234567")).toBe(
      "https://wa.me/966501234567"
    );
  });

  it("adds https:// to wa.me/X without scheme", () => {
    expect(normalizeSocial("whatsapp", "wa.me/966501234567")).toBe("https://wa.me/966501234567");
  });
});

describe("normalizeSocial — Telegram", () => {
  it("normalizes bare username", () => {
    expect(normalizeSocial("telegram", "elyasad1")).toBe("https://t.me/elyasad1");
  });

  it("strips leading @", () => {
    expect(normalizeSocial("telegram", "@elyasad1")).toBe("https://t.me/elyasad1");
  });
});

describe("normalizeSocial — Snapchat", () => {
  it("uses snapchat /add/ prefix", () => {
    expect(normalizeSocial("snapchat", "elyasad1")).toBe("https://snapchat.com/add/elyasad1");
  });
});

describe("normalizeSocial — non-matching full URLs", () => {
  it("returns a non-platform URL unchanged", () => {
    const otherUrl = "https://example.com/profile";
    expect(normalizeSocial("x", otherUrl)).toBe(otherUrl);
  });
});

describe("extractUsername", () => {
  it("extracts username from an x.com URL", () => {
    expect(extractUsername("x", "https://x.com/elyasad1")).toBe("elyasad1");
  });

  it("extracts username from an instagram URL", () => {
    expect(extractUsername("instagram", "https://instagram.com/elyas_realestate")).toBe(
      "elyas_realestate"
    );
  });

  it("extracts digits from a wa.me URL", () => {
    expect(extractUsername("whatsapp", "https://wa.me/966501234567")).toBe("966501234567");
  });

  it("returns the URL when extraction fails", () => {
    expect(extractUsername("x", "not-a-url")).toBe("not-a-url");
  });

  it("returns empty string for empty url", () => {
    expect(extractUsername("x", "")).toBe("");
  });
});

describe("getSmartPlaceholder", () => {
  it("returns an x example", () => {
    const placeholder = getSmartPlaceholder("x");
    expect(placeholder.length).toBeGreaterThan(0);
  });

  it("returns a whatsapp example mentioning a phone number", () => {
    const placeholder = getSmartPlaceholder("whatsapp");
    expect(placeholder).toMatch(/\d/);
  });

  it("returns a unique placeholder for each platform", () => {
    const x = getSmartPlaceholder("x");
    const wa = getSmartPlaceholder("whatsapp");
    expect(x).not.toBe(wa);
  });
});
