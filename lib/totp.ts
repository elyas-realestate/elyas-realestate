// ══════════════════════════════════════════════════════════════
// TOTP (RFC 6238) + Base32 + Recovery Codes
// تطبيق من الصفر بدون اعتماديات خارجية — يستخدم Node crypto
// ══════════════════════════════════════════════════════════════

import crypto from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// ── تشفير Base32 (RFC 4648) ──
export function base32Encode(bytes: Uint8Array): string {
  let out = "";
  let bits = 0;
  let value = 0;
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

// ── فكّ Base32 ──
export function base32Decode(input: string): Uint8Array {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

// ── توليد سرّ TOTP (160 بت = 20 بايت → 32 حرف base32) ──
export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  return base32Encode(bytes);
}

// ── HOTP: HMAC-SHA1(secret, counter) → 6 أرقام ──
function hotp(secretBytes: Uint8Array, counter: number): string {
  const buf = Buffer.alloc(8);
  // اكتب العدّاد big-endian على 8 بايت
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", Buffer.from(secretBytes)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binCode % 1_000_000;
  return otp.toString().padStart(6, "0");
}

// ── توليد رمز TOTP للحظة الحالية ──
export function generateTotp(secretBase32: string, timestamp: number = Date.now()): string {
  const secretBytes = base32Decode(secretBase32);
  const counter = Math.floor(timestamp / 1000 / 30);
  return hotp(secretBytes, counter);
}

// ── تحقّق من رمز مع نافذة ±1 (تسامح ~90 ثانية للفرق بالساعات) ──
export function verifyTotp(
  secretBase32: string,
  code: string,
  timestamp: number = Date.now(),
  window: number = 1
): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const secretBytes = base32Decode(secretBase32);
  if (secretBytes.length === 0) return false;
  const currentCounter = Math.floor(timestamp / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const candidate = hotp(secretBytes, currentCounter + i);
    // مقارنة ثابتة الوقت لمنع timing attacks
    if (constantTimeEqual(candidate, code)) return true;
  }
  return false;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ── بناء otpauth:// URI لقارئ Google Authenticator / Authy ──
export function buildOtpAuthUri(opts: {
  secret: string;
  accountName: string;  // email أو اسم المستخدم
  issuer: string;       // "Waseet Pro"
}): string {
  const label = encodeURIComponent(`${opts.issuer}:${opts.accountName}`);
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer: opts.issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

// ══════════════════════════════════════════════════════════════
// رموز الاسترداد (Recovery Codes)
// ══════════════════════════════════════════════════════════════

// توليد رمز واحد بصيغة "XXXX-XXXX-XXXX" (12 حرف + شرطتان)
export function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بدون 0/O/1/I (أقل التباس)
  const bytes = crypto.randomBytes(12);
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += chars[bytes[i] % chars.length];
    if (i === 3 || i === 7) out += "-";
  }
  return out;
}

// توليد 10 رموز استرداد
export function generateRecoveryCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () => generateRecoveryCode());
}

// تجزئة رمز الاسترداد (SHA-256) — نخزّن الهاش فقط
export function hashRecoveryCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}
