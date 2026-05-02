import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/property-requests/[id]/convert
 * يحوّل طلب عقار → صفقة Deal
 * body: { stage?: string, expected_close_date?: string, summary?: string }
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false },
        global: { headers: { Cookie: allCookies.map(c => `${c.name}=${c.value}`).join("; ") } },
      }
    );

    // اقرأ الطلب
    const { data: pr, error: prErr } = await supabase
      .from("property_requests")
      .select("*")
      .eq("id", id)
      .single();
    if (prErr || !pr) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (pr.converted_to_deal_id) {
      return NextResponse.json({ error: "تم تحويله مسبقاً", deal_id: pr.converted_to_deal_id }, { status: 409 });
    }

    // أنشئ الصفقة
    const dealTitle = `${pr.contact_name || "طلب"} — ${pr.request_type || ""} ${pr.main_category || ""}${pr.district ? " في " + pr.district : ""}`.trim();
    const dealPayload: any = {
      title: dealTitle,
      deal_type: pr.request_type || null,
      current_stage: body.stage || "استفسار",
      target_value: pr.budget_max || pr.budget_min || null,
      priority: pr.urgency_level === "عاجل" ? "مرتفع" : "متوسط",
      summary: pr.message || `محوّل من طلب عقاري #${id.slice(0, 8)}`,
      expected_close_date: body.expected_close_date || null,
    };

    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .insert(dealPayload)
      .select("id")
      .single();
    if (dealErr || !deal) {
      return NextResponse.json({ error: dealErr?.message || "فشل إنشاء الصفقة" }, { status: 500 });
    }

    // حدّث الطلب
    const { error: updErr } = await supabase
      .from("property_requests")
      .update({
        converted_to_deal_id: deal.id,
        converted_at: new Date().toISOString(),
        status: "محول",
      })
      .eq("id", id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deal_id: deal.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "خطأ" }, { status: 500 });
  }
}
