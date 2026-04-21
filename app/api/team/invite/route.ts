import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// ── POST /api/team/invite — دعوة عضو جديد (owner/admin فقط) ──
export async function POST(req: NextRequest) {
  try {
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await req.json();
    const email    = String(body.email || "").trim().toLowerCase().slice(0, 200);
    const fullName = String(body.full_name || "").trim().slice(0, 100);
    const role     = String(body.role || "member").trim();

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ error: "بريد إلكتروني غير صالح" }, { status: 400 });
    }
    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "الدور غير صالح" }, { status: 400 });
    }

    // ── التحقق من صلاحية المستخدم (owner/admin) ──
    const { data: tenant } = await authClient
      .from("tenants").select("id").eq("owner_id", user.id).maybeSingle();

    let tenantId: string | null = tenant?.id || null;
    let myRole: string = tenant ? "owner" : "none";

    if (!tenantId) {
      const { data: membership } = await authClient
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("user_id", user.id).eq("status", "active").maybeSingle();
      tenantId = membership?.tenant_id || null;
      myRole = membership?.role || "none";
    }

    if (!tenantId) return NextResponse.json({ error: "لا تملك حساباً" }, { status: 403 });
    if (!["owner", "admin"].includes(myRole)) {
      return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
    }

    // ── plan limit check (حد أقصى للأعضاء حسب الخطة) ──
    const { data: tenantRow } = await authClient
      .from("tenants").select("plan").eq("id", tenantId).maybeSingle();
    const plan = tenantRow?.plan || "free";
    const limits: Record<string, number> = { free: 1, basic: 3, pro: 10 };
    const maxMembers = limits[plan] ?? 1;

    const { count } = await authClient
      .from("tenant_members").select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId).in("status", ["invited", "active"]);

    if ((count ?? 0) >= maxMembers) {
      return NextResponse.json({
        error: `وصلت الحد الأقصى للأعضاء في خطتك (${maxMembers}). رقّ الخطة لإضافة المزيد.`
      }, { status: 403 });
    }

    // ── Insert invite (service-role to bypass RLS — tenant_id enforced above) ──
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // إذا المستخدم موجود أصلاً، نحاول نربطه مباشرة
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );

    const row = {
      tenant_id:   tenantId,
      user_id:     existingUser?.id ?? null,
      email,
      full_name:   fullName || null,
      role,
      status:      existingUser ? "active" : "invited",
      invited_by:  user.id,
      activated_at: existingUser ? new Date().toISOString() : null,
    };

    const { data: inserted, error } = await admin
      .from("tenant_members")
      .insert(row)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "هذا البريد مدعو أصلاً" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, member: inserted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ غير معروف";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── DELETE /api/team/invite?id=xxx — حذف عضو ──
export async function DELETE(req: NextRequest) {
  try {
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("id");
    if (!memberId) return NextResponse.json({ error: "معرّف ناقص" }, { status: 400 });

    // resolve tenant + role
    const { data: tenant } = await authClient
      .from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
    let tenantId: string | null = tenant?.id || null;
    let myRole: string = tenant ? "owner" : "none";

    if (!tenantId) {
      const { data: membership } = await authClient
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("user_id", user.id).eq("status", "active").maybeSingle();
      tenantId = membership?.tenant_id || null;
      myRole = membership?.role || "none";
    }

    if (!tenantId) return NextResponse.json({ error: "لا تملك حساباً" }, { status: 403 });
    if (!["owner", "admin"].includes(myRole)) {
      return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // منع حذف المالك
    const { data: target } = await admin
      .from("tenant_members").select("role, tenant_id").eq("id", memberId).maybeSingle();

    if (!target) return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
    if (target.tenant_id !== tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    if (target.role === "owner") {
      return NextResponse.json({ error: "لا يمكن حذف المالك" }, { status: 400 });
    }

    const { error } = await admin.from("tenant_members").delete().eq("id", memberId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ غير معروف";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
