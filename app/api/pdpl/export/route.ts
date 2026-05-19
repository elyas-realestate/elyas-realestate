import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createLogger } from "@/lib/logger";

const log = createLogger({ route: "/api/pdpl/export" });
// ══════════════════════════════════════════════════════════════════
// /api/pdpl/export — تصدير كل بيانات المستخدم (PDPL right)
// GET → JSON بكل البيانات المرتبطة بالـ tenant
// ══════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData } = await supabaseAuth.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tenant } = await admin
    .from("tenants")
    .select("*")
    .eq("owner_id", userData.user.id)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "لم يُعثر على بيانات" }, { status: 404 });
  }

  // جلب كل الـ tables المرتبطة بـ tenant_id
  const tables = [
    "site_settings",
    "broker_identity",
    "ceo_identity",
    "properties",
    "clients",
    "deals",
    "tasks",
    "property_requests",
    "content",
    "legal_documents",
    "site_analytics",
    "profile_cards",
    "profile_links",
    "subscription_plans",
    "subscription_invoices",
    "lead_captures",
    "testimonials",
    "client_property_alerts",
    "rent_contracts",
    "rent_payments",
  ];

  const exportData: {
    exported_at: string;
    user: { id: string; email?: string; created_at?: string };
    tenant: unknown;
    data: Record<string, unknown[]>;
  } = {
    exported_at: new Date().toISOString(),
    user: {
      id: userData.user.id,
      email: userData.user.email,
      created_at: userData.user.created_at,
    },
    tenant,
    data: {},
  };

  for (const table of tables) {
    try {
      const { data } = await admin.from(table).select("*").eq("tenant_id", tenant.id);
      if (data && data.length > 0) {
        exportData.data[table] = data;
      }
    } catch (err) {
      log.warn(`[pdpl/export] failed to export ${table}:`, err);
    }
  }

  const json = JSON.stringify(exportData, null, 2);
  const filename = `wasit-pro-data-${tenant.slug || tenant.id}-${Date.now()}.json`;

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
