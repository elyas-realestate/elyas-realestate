import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ══════════════════════════════════════════════════════════════
// /api/onboarding — حالة الـ onboarding للـ tenant الحالي
// GET: يجلب الحالة (يُنشئها لو غير موجودة + يحدّث تلقائياً)
// PUT: يحدّث خطوة معينة أو dismissed
// ══════════════════════════════════════════════════════════════

interface OnboardingState {
  step_profile_completed: boolean;
  step_property_added: boolean;
  step_whatsapp_connected: boolean;
  step_assistant_tested: boolean;
  dismissed: boolean;
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

async function getOwnerTenantId(
  supabase: ReturnType<typeof makeClient>,
  userId: string
): Promise<string | null> {
  const { data: t } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  return (t?.id as string) || null;
}

export async function GET(req: NextRequest) {
  const supabase = makeClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const tenantId = await getOwnerTenantId(supabase, user.id);
  if (!tenantId) return NextResponse.json({ state: null });

  // جلب الحالة (لو غير موجودة، نُنشئها)
  let { data: state } = await supabase
    .from("tenant_onboarding")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!state) {
    const { data: created } = await supabase
      .from("tenant_onboarding")
      .insert({ tenant_id: tenantId })
      .select()
      .single();
    state = created;
  }

  if (!state) return NextResponse.json({ state: null });

  // ── auto-detect: تحقق من الخطوات تلقائياً وحدّثها ──
  const updates: Partial<OnboardingState> = {};

  // 1) Profile completed: site_settings فيه broker_name + phone
  if (!state.step_profile_completed) {
    const { data: settings } = await supabase
      .from("site_settings")
      .select("broker_name, phone")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (settings?.broker_name && settings?.phone) {
      updates.step_profile_completed = true;
    }
  }

  // 2) Property added: على الأقل property واحدة
  if (!state.step_property_added) {
    const { count } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
    if ((count || 0) > 0) {
      updates.step_property_added = true;
    }
  }

  // 3) WhatsApp connected: whatsapp_config مفعّل
  if (!state.step_whatsapp_connected) {
    const { data: wa } = await supabase
      .from("whatsapp_config")
      .select("is_active, phone_number_id")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (wa?.is_active && wa?.phone_number_id) {
      updates.step_whatsapp_connected = true;
    }
  }

  // 4) Assistant tested: org_activity_log فيه نشاط لـ AI
  if (!state.step_assistant_tested) {
    const { count } = await supabase
      .from("org_activity_log")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("actor_kind", "employee");
    if ((count || 0) > 0) {
      updates.step_assistant_tested = true;
    }
  }

  // طبّق التحديثات لو فيه شي تغيّر
  if (Object.keys(updates).length > 0) {
    await supabase.from("tenant_onboarding").update(updates).eq("tenant_id", tenantId);
    state = { ...state, ...updates };
  }

  return NextResponse.json({ state });
}

export async function PUT(req: NextRequest) {
  const supabase = makeClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const tenantId = await getOwnerTenantId(supabase, user.id);
  if (!tenantId) return NextResponse.json({ error: "ليس مالك tenant" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const allowedKeys: (keyof OnboardingState)[] = [
    "step_profile_completed",
    "step_property_added",
    "step_whatsapp_connected",
    "step_assistant_tested",
    "dismissed",
  ];

  const updates: Partial<OnboardingState> & { dismissed_at?: string } = {};
  for (const key of allowedKeys) {
    if (key in body) {
      updates[key] = Boolean(body[key]);
    }
  }
  if (updates.dismissed === true) {
    updates.dismissed_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "لا حقول للتحديث" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tenant_onboarding")
    .upsert({ tenant_id: tenantId, ...updates }, { onConflict: "tenant_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ state: data });
}
