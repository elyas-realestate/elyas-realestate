import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ══════════════════════════════════════════════════════════════
// /api/ceo-identity — جلب وتحديث هوية المدير التنفيذي
// GET  → جلب هوية الـ tenant الحالي
// PUT  → upsert (إنشاء أو تحديث)
// ══════════════════════════════════════════════════════════════

interface PhoneEntry {
  label: string;
  number: string;
  is_primary: boolean;
}

interface CEOIdentityPayload {
  full_name?: string;
  title?: string;
  email?: string;
  photo_url?: string;
  phones?: PhoneEntry[];
  preferred_address?: string;
  tone_preference?: "professional" | "friendly" | "mixed";
  assistant_employee_code?: string;
  notes?: string;
}

function makeClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
}

async function getTenantId(
  supabase: ReturnType<typeof makeClient>,
  userId: string
): Promise<string | null> {
  const { data: t } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (t?.id) return t.id as string;

  const { data: m } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return (m?.tenant_id as string) || null;
}

/** تطبيع رقم سعودي إلى صيغة E.164 بدون + (مثلاً 966539920003) */
function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/\D/g, "");
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("05")) p = "966" + p.slice(1);
  if (p.startsWith("5") && p.length === 9) p = "966" + p;
  return p;
}

function validatePhones(
  phones: unknown
): { ok: true; data: PhoneEntry[] } | { ok: false; error: string } {
  if (!Array.isArray(phones)) return { ok: false, error: "phones يجب أن تكون مصفوفة" };

  const cleaned: PhoneEntry[] = [];
  let primaryCount = 0;

  for (const p of phones) {
    if (!p || typeof p !== "object") return { ok: false, error: "كل رقم يجب أن يكون كائنًا" };
    const obj = p as Record<string, unknown>;
    const label =
      String(obj.label || "")
        .trim()
        .slice(0, 40) || "بدون مسمى";
    const numberRaw = String(obj.number || "").trim();
    if (!numberRaw) return { ok: false, error: "رقم فارغ غير مسموح" };

    const number = normalizePhone(numberRaw);
    if (number.length < 10 || number.length > 15) {
      return { ok: false, error: `رقم غير صالح: ${numberRaw}` };
    }

    const is_primary = Boolean(obj.is_primary);
    if (is_primary) primaryCount++;

    cleaned.push({ label, number, is_primary });
  }

  // ضمان رقم أساسي واحد فقط (أو لا شيء)
  if (primaryCount > 1) {
    return { ok: false, error: "يمكن تعيين رقم أساسي واحد فقط" };
  }

  // إزالة التكرارات (نفس الرقم)
  const seen = new Set<string>();
  const deduped = cleaned.filter((p) => {
    if (seen.has(p.number)) return false;
    seen.add(p.number);
    return true;
  });

  return { ok: true, data: deduped };
}

// ─────────────────────────────────────────────────────────────
// GET — جلب هوية الـ CEO الحالية
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = makeClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const tenantId = await getTenantId(supabase, user.id);
  if (!tenantId) return NextResponse.json({ error: "لا يوجد tenant" }, { status: 404 });

  const { data, error } = await supabase
    .from("ceo_identity")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    identity: data || null,
    tenant_id: tenantId,
  });
}

// ─────────────────────────────────────────────────────────────
// PUT — upsert هوية الـ CEO
// ─────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const supabase = makeClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // فقط مالك الـ tenant يقدر يحدّث (لا يكفي عضو فريق)
  const { data: t } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  const tenantId = t?.id as string | undefined;
  if (!tenantId) {
    return NextResponse.json(
      { error: "فقط مالك المنشأة يستطيع تعديل هوية الـ CEO" },
      { status: 403 }
    );
  }

  let body: CEOIdentityPayload;
  try {
    body = (await req.json()) as CEOIdentityPayload;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  // تنظيف الحقول
  const full_name = String(body.full_name || "")
    .trim()
    .slice(0, 120);
  if (!full_name) return NextResponse.json({ error: "الاسم الكامل مطلوب" }, { status: 400 });

  const title = String(body.title || "الرئيس التنفيذي")
    .trim()
    .slice(0, 80);
  const email = body.email ? String(body.email).trim().slice(0, 200) : null;
  const photo_url = body.photo_url ? String(body.photo_url).trim().slice(0, 500) : null;
  const preferred_address = String(body.preferred_address || "الأستاذ")
    .trim()
    .slice(0, 40);
  const tone_preference = ["professional", "friendly", "mixed"].includes(body.tone_preference || "")
    ? body.tone_preference!
    : "professional";
  const assistant_employee_code = String(body.assistant_employee_code || "ceo_assistant")
    .trim()
    .slice(0, 60);
  const notes = body.notes ? String(body.notes).trim().slice(0, 2000) : null;

  // تحقق من البريد إن وُجد
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "صيغة البريد غير صحيحة" }, { status: 400 });
  }

  // تحقق من الأرقام
  const phonesResult = validatePhones(body.phones || []);
  if (!phonesResult.ok) {
    return NextResponse.json({ error: phonesResult.error }, { status: 400 });
  }

  // upsert
  const payload = {
    tenant_id: tenantId,
    user_id: user.id,
    full_name,
    title,
    email,
    photo_url,
    phones: phonesResult.data,
    preferred_address,
    tone_preference,
    assistant_employee_code,
    notes,
  };

  const { data: existing } = await supabase
    .from("ceo_identity")
    .select("id")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("ceo_identity")
      .update(payload)
      .eq("tenant_id", tenantId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ identity: data, action: "updated" });
  } else {
    const { data, error } = await supabase.from("ceo_identity").insert(payload).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ identity: data, action: "created" });
  }
}
