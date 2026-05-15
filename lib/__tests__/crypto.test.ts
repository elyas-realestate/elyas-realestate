// ══════════════════════════════════════════════════════════════
// crypto.test.ts — يحمي WhatsApp Access Tokens + أي سرّ آخر
// ══════════════════════════════════════════════════════════════
import { describe, it, expect } from "vitest";
import { encrypt, decrypt, safeDecrypt } from "../crypto";

describe("encrypt + decrypt — round-trip", () => {
  it("يستعيد النص الأصلي بعد التشفير وفك التشفير", async () => {
    const original = "EAAGm7xxx-secret-whatsapp-token";

    const encrypted = await encrypt(original);
    const decrypted = await decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  it("يدعم نصوصاً عربية كاملة", async () => {
    const original = "هذا نص سرّي بالعربي 🔐 with mixed محتوى";

    const encrypted = await encrypt(original);
    const decrypted = await decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  it("يدعم نصوصاً طويلة (1000+ حرف)", async () => {
    const original = "a".repeat(1000) + "🚀" + "ب".repeat(500);

    const encrypted = await encrypt(original);
    const decrypted = await decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  it("يُنتج تشفيراً مختلفاً في كل مرة (IV عشوائي)", async () => {
    const original = "نفس النص";

    const enc1 = await encrypt(original);
    const enc2 = await encrypt(original);

    expect(enc1).not.toBe(enc2); // IV مختلف = ciphertext مختلف
    expect(await decrypt(enc1)).toBe(original);
    expect(await decrypt(enc2)).toBe(original);
  });

  it("الصيغة دائماً 'iv:ciphertext' (base64)", async () => {
    const encrypted = await encrypt("test");
    const parts = encrypted.split(":");

    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0); // IV b64
    expect(parts[1].length).toBeGreaterThan(0); // ct b64
  });
});

describe("decrypt — حماية ضد الأخطاء", () => {
  it("يرفض الصيغة غير الصحيحة", async () => {
    await expect(decrypt("notvalid")).rejects.toThrow();
    await expect(decrypt("")).rejects.toThrow();
  });

  it("يفشل عند العبث بـ ciphertext (AES-GCM auth tag)", async () => {
    const encrypted = await encrypt("original");
    // نُغيّر آخر حرف في ciphertext
    const tampered = encrypted.slice(0, -1) + (encrypted.slice(-1) === "A" ? "B" : "A");

    await expect(decrypt(tampered)).rejects.toThrow();
  });
});

describe("safeDecrypt — توافق خلفي", () => {
  it("يفك تشفير قيمة مشفّرة (تحتوي ':')", async () => {
    const encrypted = await encrypt("secret");
    const result = await safeDecrypt(encrypted);

    expect(result).toBe("secret");
  });

  it("يُعيد النص كما هو إذا كان plaintext قديم (لا يحتوي ':')", async () => {
    const result = await safeDecrypt("plaintext_legacy_value");
    expect(result).toBe("plaintext_legacy_value");
  });

  it("يُعيد سلسلة فارغة عند input فارغ", async () => {
    const result = await safeDecrypt("");
    expect(result).toBe("");
  });

  it("يُعيد النص الأصلي عند فشل فك التشفير (silent fallback)", async () => {
    // نص يحتوي ':' لكن ليس تشفيراً صحيحاً
    const result = await safeDecrypt("not:actually:encrypted");
    expect(result).toBe("not:actually:encrypted");
  });
});
