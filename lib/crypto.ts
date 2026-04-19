// ── تشفير/فك تشفير مفاتيح API ─────────────────────────────────────────────
// يستخدم AES-256-GCM عبر Web Crypto API (متاح في Node.js 18+ و Edge Runtime)
// المفتاح: ENCRYPTION_SECRET في متغيرات البيئة (32 بايت hex = 64 حرف)

const ALG = "AES-GCM";
const KEY_LENGTH = 256;

function getSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ENCRYPTION_SECRET غير مضبوط أو قصير جداً");
  }
  return secret.slice(0, 64); // نأخذ أول 64 حرف hex = 32 بايت
}

async function importKey(secret: string): Promise<CryptoKey> {
  const raw = new Uint8Array(
    secret.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
  );
  return crypto.subtle.importKey("raw", raw, { name: ALG, length: KEY_LENGTH }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** تشفير نص — يُعيد base64 (iv:ciphertext) */
export async function encrypt(plaintext: string): Promise<string> {
  const secret = getSecret();
  const key = await importKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: ALG, iv }, key, encoded);
  const ivB64 = Buffer.from(iv).toString("base64");
  const ctB64 = Buffer.from(ciphertext).toString("base64");
  return `${ivB64}:${ctB64}`;
}

/** فك تشفير نص مُشفَّر بـ encrypt() */
export async function decrypt(encrypted: string): Promise<string> {
  const secret = getSecret();
  const key = await importKey(secret);
  const [ivB64, ctB64] = encrypted.split(":");
  if (!ivB64 || !ctB64) throw new Error("صيغة التشفير غير صحيحة");
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const plaintext = await crypto.subtle.decrypt({ name: ALG, iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

/** إذا كان النص مشفراً (يحتوي `:`) فك تشفيره — وإلا أعده كما هو (للتوافق مع القديم) */
export async function safeDecrypt(value: string): Promise<string> {
  if (!value) return "";
  if (value.includes(":")) {
    try { return await decrypt(value); } catch { /* ليس مشفراً */ }
  }
  return value; // plaintext قديم — يُعاد مباشرة للتوافق
}
