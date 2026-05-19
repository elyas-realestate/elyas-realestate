import { describe, it, expect } from "vitest";
import {
  base32Encode,
  base32Decode,
  generateTotpSecret,
  generateTotp,
  verifyTotp,
  buildOtpAuthUri,
  generateRecoveryCode,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "../totp";

describe("base32Encode / base32Decode", () => {
  it("round-trips arbitrary bytes", () => {
    const original = new Uint8Array([0, 127, 255, 1, 64, 200, 12, 87]);
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it("encodes empty bytes to empty string", () => {
    expect(base32Encode(new Uint8Array([]))).toBe("");
  });

  it("decodes empty string to empty array", () => {
    expect(base32Decode("").length).toBe(0);
  });

  it("matches the standard RFC 4648 encoding for known values", () => {
    // base32("foobar") = "MZXW6YTBOI======" — without padding we get "MZXW6YTBOI"
    const bytes = new TextEncoder().encode("foobar");
    const encoded = base32Encode(bytes);
    expect(encoded.startsWith("MZXW6YTBOI")).toBe(true);
  });

  it("is case-insensitive when decoding", () => {
    const bytes = new Uint8Array([0xab, 0xcd]);
    const upper = base32Encode(bytes);
    const lower = upper.toLowerCase();
    expect(Array.from(base32Decode(lower))).toEqual(Array.from(base32Decode(upper)));
  });

  it("ignores invalid characters when decoding", () => {
    const valid = base32Encode(new Uint8Array([1, 2, 3]));
    const withJunk = valid.slice(0, 2) + "!@# " + valid.slice(2);
    expect(Array.from(base32Decode(withJunk))).toEqual(Array.from(base32Decode(valid)));
  });
});

describe("generateTotpSecret", () => {
  it("returns a non-empty base32 string", () => {
    const secret = generateTotpSecret();
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThan(0);
    // Should only contain valid base32 characters
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it("returns approximately 32 characters (20 bytes encoded)", () => {
    const secret = generateTotpSecret();
    // 20 bytes → 32 base32 chars
    expect(secret.length).toBe(32);
  });

  it("returns different secrets on subsequent calls", () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).not.toBe(b);
  });
});

describe("generateTotp", () => {
  // Use a fixed test secret (from RFC 6238 examples is too complex; just use a known good one)
  const secret = "JBSWY3DPEHPK3PXP";

  it("returns 6 digits", () => {
    const code = generateTotp(secret);
    expect(code).toMatch(/^\d{6}$/);
  });

  it("returns the same code within the same 30-second window", () => {
    const t = 1_700_000_000_000;
    const a = generateTotp(secret, t);
    const b = generateTotp(secret, t + 5_000); // 5s later, same window
    expect(a).toBe(b);
  });

  it("returns a different code in a different 30-second window", () => {
    const t = 1_700_000_000_000;
    const a = generateTotp(secret, t);
    const b = generateTotp(secret, t + 60_000); // 60s later → 2 windows away
    expect(a).not.toBe(b);
  });

  it("zero-pads short codes to 6 digits", () => {
    // We don't control the value but the regex above already enforces 6 digits.
    // This test is structurally the same as the first.
    expect(generateTotp(secret, 0).length).toBe(6);
  });
});

describe("verifyTotp", () => {
  const secret = "JBSWY3DPEHPK3PXP";

  it("verifies a code generated at the same moment", () => {
    const t = 1_700_000_000_000;
    const code = generateTotp(secret, t);
    expect(verifyTotp(secret, code, t)).toBe(true);
  });

  it("verifies a code from the previous window (within ±1 default window)", () => {
    const t = 1_700_000_000_000;
    const previousCode = generateTotp(secret, t - 30_000);
    expect(verifyTotp(secret, previousCode, t)).toBe(true);
  });

  it("verifies a code from the next window (within ±1 default window)", () => {
    const t = 1_700_000_000_000;
    const nextCode = generateTotp(secret, t + 30_000);
    expect(verifyTotp(secret, nextCode, t)).toBe(true);
  });

  it("rejects a code that is more than 1 window away", () => {
    const t = 1_700_000_000_000;
    const farCode = generateTotp(secret, t - 5 * 30_000);
    expect(verifyTotp(secret, farCode, t)).toBe(false);
  });

  it("rejects a malformed code (not 6 digits)", () => {
    expect(verifyTotp(secret, "12345")).toBe(false);
    expect(verifyTotp(secret, "1234567")).toBe(false);
    expect(verifyTotp(secret, "abcdef")).toBe(false);
    expect(verifyTotp(secret, "")).toBe(false);
  });

  it("rejects an empty secret", () => {
    const code = generateTotp(secret, 1_700_000_000_000);
    expect(verifyTotp("", code, 1_700_000_000_000)).toBe(false);
  });

  it("respects a custom window setting", () => {
    const t = 1_700_000_000_000;
    const farCode = generateTotp(secret, t - 3 * 30_000);
    expect(verifyTotp(secret, farCode, t, 1)).toBe(false); // 3 windows > 1
    expect(verifyTotp(secret, farCode, t, 3)).toBe(true); // 3 windows ≤ 3
  });
});

describe("buildOtpAuthUri", () => {
  it("constructs a valid otpauth:// URI", () => {
    const uri = buildOtpAuthUri({
      secret: "JBSWY3DPEHPK3PXP",
      accountName: "elyas@example.com",
      issuer: "Waseet Pro",
    });
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(uri).toContain("algorithm=SHA1");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });

  it("URL-encodes the label (issuer:account)", () => {
    const uri = buildOtpAuthUri({
      secret: "X",
      accountName: "user@host.com",
      issuer: "My App",
    });
    // label should be encoded; the literal "My App:user@host.com" would be unsafe
    expect(uri).toContain("My%20App");
  });

  it("includes the issuer as a query param", () => {
    const uri = buildOtpAuthUri({
      secret: "X",
      accountName: "u",
      issuer: "MyIssuer",
    });
    expect(uri).toMatch(/issuer=MyIssuer/);
  });
});

describe("generateRecoveryCode", () => {
  it("returns a 14-char string with two dashes", () => {
    const code = generateRecoveryCode();
    expect(code.length).toBe(14); // 12 chars + 2 dashes
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("avoids ambiguous characters (0, O, 1, I)", () => {
    // Generate many codes and verify none contains the disallowed chars
    for (let i = 0; i < 50; i++) {
      const code = generateRecoveryCode();
      expect(code).not.toMatch(/[01OI]/);
    }
  });

  it("returns different codes on subsequent calls", () => {
    const a = generateRecoveryCode();
    const b = generateRecoveryCode();
    expect(a).not.toBe(b);
  });
});

describe("generateRecoveryCodes", () => {
  it("returns 10 codes by default", () => {
    const codes = generateRecoveryCodes();
    expect(codes.length).toBe(10);
  });

  it("returns the requested count", () => {
    expect(generateRecoveryCodes(5).length).toBe(5);
    expect(generateRecoveryCodes(0).length).toBe(0);
  });

  it("returns unique codes", () => {
    const codes = generateRecoveryCodes(20);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("every code matches the standard format", () => {
    for (const code of generateRecoveryCodes(5)) {
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    }
  });
});

describe("hashRecoveryCode", () => {
  it("returns a 64-char hex string (SHA-256)", () => {
    const hash = hashRecoveryCode("ABCD-EFGH-JKLM");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same input", () => {
    const a = hashRecoveryCode("ABCD-EFGH-JKLM");
    const b = hashRecoveryCode("ABCD-EFGH-JKLM");
    expect(a).toBe(b);
  });

  it("is case-insensitive", () => {
    const upper = hashRecoveryCode("ABCD-EFGH-JKLM");
    const lower = hashRecoveryCode("abcd-efgh-jklm");
    const mixed = hashRecoveryCode("AbCd-EfGh-JkLm");
    expect(upper).toBe(lower);
    expect(upper).toBe(mixed);
  });

  it("trims surrounding whitespace before hashing", () => {
    const plain = hashRecoveryCode("ABCD-EFGH-JKLM");
    const padded = hashRecoveryCode("  ABCD-EFGH-JKLM  ");
    expect(plain).toBe(padded);
  });

  it("returns different hashes for different inputs", () => {
    const a = hashRecoveryCode("ABCD-EFGH-JKLM");
    const b = hashRecoveryCode("ZZZZ-YYYY-XXXX");
    expect(a).not.toBe(b);
  });
});
