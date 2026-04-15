import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkLimit } from "@/lib/plan-limits";
import { checkRateLimit, AI_RATE_LIMIT, getClientKey } from "@/lib/rate-limit";

// هذا الـ API سيتلقى نص المحادثة ويطلب من الذكاء الاصطناعي الحالي استخراج العملاء
export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Protection
    const clientKey = getClientKey(req);
    const rateLimitRes = checkRateLimit(clientKey, AI_RATE_LIMIT);
    if (!rateLimitRes.allowed) {
      return NextResponse.json({ error: "تم تجاوز الحد المسموح للطلبات. يرجى المحاولة لاحقاً." }, { status: 429 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll(_cookiesToSet) {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    // 2. Plan limits protection
    // Get tenant ID
    const { data: tData } = await supabase.from("tenants").select("id").eq("owner_id", user.id).limit(1).single();
    if (!tData) return NextResponse.json({ error: "لم يتم العثور على حساب المستأجر" }, { status: 403 });
    
    const limitCheck = await checkLimit(supabase, "ai_requests");
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason }, { status: 403 });
    }

    const body = await req.json();
    const { chatText } = body;

    if (!chatText || chatText.length < 10) {
      return NextResponse.json({ error: "النص المرفوع قصير جداً لفحصه" }, { status: 400 });
    }

    // بناء التوجيه الخاص بنا لتحليل بيانات الواتساب
    const systemPrompt = `
أنت محلل بيانات عقاري خبير. 
المطلوب منك هو تحليل التاريخ المرفق (Export Chat من تطبيق الواتساب) واستخراج بيانات العملاء (Leads) أو الوسطاء أو عروض العقارات التي طُرحت في المحادثة.
مخرجاتك يجب أن تكون بصيغة JSON حصراً، بدون أي نصوص إضافية أو علامات Markdown.

التنسيق المطلوب للـ JSON:
{
  "leads": [
    {
      "name": "اسم الشخص أو المرسل",
      "phone": "رقم الهاتف المستخرج من المحادثة",
      "category": "مشتري / مالك / وسيط / مستأجر",
      "budget": "الميزانية المتوقعة (إن وجدت)",
      "notes": "ملخص طلب العميل أو عرضه بأقل من 20 كلمة"
    }
  ]
}

- إذا لم تجد بيانات واضحة لعملاء، أرجع مصفوفة "leads" فارغة [].
- اقتصر التحليل على أبرز 10 جهات اتصال في الملف (لتجنب الحجم الزائد).
- تجاهل المحادثات الجانبية وركز على العروض والطلبات والأسماء.
    `;

    // تقصير النص إذا كان هائلاً لتجنب مشاكل التوكنز (في النسخة المتقدمة يجب استخدام Chunking)
    const truncatedText = chatText.substring(0, 15000); 

    // جلب المفتاح الخاص ب OpenAI، أو يفضل نداء الـ Route الداخلي الخاص بنا (ai-content)
    // هنا سنستدعي OpenAI مباشرة لتسريع التنفيذ، وربطناها بمفتاح البيئة
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "مفتاح OpenAI غير مهيأ" }, { status: 500 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY 
      },
      body: JSON.stringify({ 
        model: "gpt-4o-mini", // نموذج سريع واقتصادي
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt }, 
          { role: "user", content: "قم بتحليل المحادثة التالية:\n" + truncatedText }
        ], 
        temperature: 0.1
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const jsonText = data.choices?.[0]?.message?.content || "{}";
    const extractedData = JSON.parse(jsonText);

    return NextResponse.json({ extracted: extractedData });

  } catch (error: any) {
    console.error("[WhatsApp Parse Error]", error.message);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة المحادثة بـ AI" }, { status: 500 });
  }
}
