"use client";
import React, { useState, useRef } from "react";
import { MessageCircle, UploadCloud, FileText, CheckCircle2, Bot, AlertCircle, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";

// ── قوالب الرسائل ──
const MESSAGE_TEMPLATES = [
  {
    category: "متابعة العملاء",
    color: "#C6914C",
    templates: [
      {
        title: "متابعة طلب أولي",
        text: `السلام عليكم {اسم العميل} 👋\nتواصلت معنا بخصوص طلب عقاري — هل ما زلت تبحث؟\nيسعدنا مساعدتك في إيجاد العقار المناسب 🏠\nفريق وسيط برو`,
      },
      {
        title: "تذكير بعد الصمت",
        text: `أهلاً {اسم العميل}،\nنأمل أن تكون بخير! لاحظنا عدم تواصلك منذ فترة.\nلدينا عقارات جديدة قد تناسب احتياجاتك تماماً.\nهل يمكنني مشاركك بعض الخيارات؟ 😊`,
      },
    ],
  },
  {
    category: "عرض العقارات",
    color: "#3B82F6",
    templates: [
      {
        title: "إرسال عقار جديد",
        text: `وجدت عقاراً يطابق طلبك تماماً يا {اسم العميل} 🏡\n\n✅ النوع: {نوع العقار}\n📍 الموقع: {الحي}، {المدينة}\n💰 السعر: {السعر} ر.س\n📐 المساحة: {المساحة} م²\n\nهل تودّ تحديد موعد معاينة؟`,
      },
      {
        title: "عرض متعدد العقارات",
        text: `أهلاً {اسم العميل}،\nبناءً على طلبك، إليك أفضل الخيارات المتاحة:\n\n1️⃣ {عقار 1} — {سعر 1} ر.س\n2️⃣ {عقار 2} — {سعر 2} ر.س\n3️⃣ {عقار 3} — {سعر 3} ر.س\n\nأيّها يستأثر باهتمامك أكثر؟`,
      },
    ],
  },
  {
    category: "المعاينة والصفقة",
    color: "#10B981",
    templates: [
      {
        title: "تأكيد موعد المعاينة",
        text: `تأكيد موعدك يا {اسم العميل} ✅\n\n📅 اليوم: {اليوم}\n⏰ الوقت: {الوقت}\n📍 العنوان: {العنوان}\n\nسأكون بانتظارك. إذا احتجت أي تعديل على الموعد أبلغني. 🙏`,
      },
      {
        title: "إغلاق الصفقة",
        text: `تهانينا {اسم العميل}! 🎉🏠\nيسعدنا إتمام صفقتك بنجاح.\n\nنتمنى لك حياةً سعيدة في منزلك الجديد.\nلا تتردد في التواصل معنا لأي خدمة مستقبلية. ⭐\n\nفريق وسيط برو`,
      },
    ],
  },
  {
    category: "خدمة ما بعد البيع",
    color: "#8B5CF6",
    templates: [
      {
        title: "طلب تقييم الخدمة",
        text: `أهلاً {اسم العميل}،\nشكراً لثقتك بنا! 🙏\nنودّ الاطمئنان على رضاك عن الخدمة.\nهل يمكنك تقييم تجربتك معنا من 1 إلى 5؟ ⭐\n\nملاحظتك تساعدنا على التحسن المستمر.`,
      },
      {
        title: "عرض خدمات إضافية",
        text: `مرحباً {اسم العميل}،\nنتمنى أن تكون بخير في مسكنك الجديد! 🏡\n\nنقدم لك خدمات إضافية:\n🔧 صيانة وترميم\n📋 إدارة العقار للإيجار\n💼 خدمات قانونية\n\nهل تحتاج أياً منها؟`,
      },
    ],
  },
];

export default function WhatsAppPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>("متابعة العملاء");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function copyTemplate(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".txt")) {
      toast.error("يرجى رفع ملف نصي (.txt) المستخرج من الواتساب فقط");
      return;
    }
    setFile(selectedFile);
    setResults(null);
  };

  const processFile = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      const text = await file.text();
      
      // هنا سنستدعي الـ API الخاص بتحليل النص عبر الذكاء الاصطناعي
      const res = await fetch("/api/ai-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatText: text }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "فشل تحليل الملف");
      }

      setResults(data.extracted);
      toast.success("تم تحليل المحادثة بنجاح!");
      
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ غير متوقع أثناء المعالجة");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "إدارة الواتساب" }]} />

      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="font-cairo font-bold flex items-center gap-2" style={{ fontSize: 22 }}>
            <MessageCircle className="text-[#25D366]" size={26} /> 
            تكامل الواتساب
          </h2>
          <p style={{ color: "#5A5A62", fontSize: 13, marginTop: 2 }}>
            استورد الدردشات ليقوم الذكاء الاصطناعي باستخراج العملاء والعقارات تلقائياً
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side / Details & Uploader */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-luxury p-6 relative overflow-hidden">
            <div style={{ position: "absolute", top: 0, right: 0, width: "150px", height: "150px", background: "radial-gradient(circle, rgba(37,211,102,0.1) 0%, transparent 70%)" }} />
            
            <h3 className="font-cairo font-bold mb-4" style={{ fontSize: 16 }}>الاستيراد الذكي (Chat Export)</h3>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? "border-[#25D366] bg-[#25D366]/5" : "border-[#1C1C22] bg-[#16161A]/50"} `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input type="file" accept=".txt" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              
              {!file ? (
                <>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(37,211,102,0.1)", color: "#25D366" }}>
                    <UploadCloud size={28} />
                  </div>
                  <p className="font-bold text-[#F5F5F5] mb-2">اسحب وأفلت الملف النصي هنا</p>
                  <p className="text-sm text-[#5A5A62] mb-6">يجب تصدير الدردشة من الواتساب (بدون وسائط) كملف بصيغة .txt</p>
                  <button onClick={() => fileInputRef.current?.click()} className="btn-ghost px-6 py-2.5 text-sm">
                    تصفح الملفات
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(198,145,76,0.1)", color: "#C6914C" }}>
                    <FileText size={28} />
                  </div>
                  <p className="font-bold text-[#F5F5F5] mb-1">{file.name}</p>
                  <p className="text-xs text-[#5A5A62] mb-6">{(file.size / 1024).toFixed(2)} KB</p>
                  
                  <div className="flex justify-center gap-3">
                    <button onClick={processFile} disabled={isUploading} className="btn-gold px-6 py-2.5 text-sm flex items-center gap-2">
                       {isUploading ? <><Bot className="animate-pulse" size={16}/> جاري التحليل الذكي...</> : "بدء الاستخراج والتصنيف"}
                    </button>
                    <button onClick={() => {setFile(null); setResults(null);}} disabled={isUploading} className="btn-ghost px-4 py-2.5 text-sm text-[#F87171] bg-[#F87171] bg-opacity-10">
                      إلغاء
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Results Area */}
          {results && (
            <div className="card-luxury p-6 fade-up border !border-[#25D366]/30">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-cairo font-bold flex items-center gap-2" style={{ fontSize: 16 }}>
                  <CheckCircle2 className="text-[#25D366]" size={18} />
                  النتائج المستخرجة
                </h3>
                <button className="bg-[#25D366] text-[#0A0A0C] font-bold text-sm px-4 py-2 rounded-lg hover:bg-opacity-90 transition">
                  حفظ الكل كعملاء مباشرين
                </button>
              </div>

               {results.leads && results.leads.length > 0 ? (
                 <div className="space-y-3">
                   {results.leads.map((lead: any, i: number) => (
                     <div key={i} className="flex justify-between items-center p-4 bg-[#1C1C22] rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{background: "#25D366/20", color: "#25D366"}}>
                            {lead.name ? lead.name.charAt(0) : "؟"}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">{lead.name || "عميل محتمل"}</p>
                            <p className="text-xs text-[#9A9AA0] mt-1" dir="ltr">{lead.phone || "بدون رقم"}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          {lead.category && <span className="bg-[#A78BFA]/10 text-[#A78BFA] text-xs px-2 py-1 rounded">{lead.category}</span>}
                          {lead.budget && <p className="text-xs text-[#C6914C] mt-2 font-bold">{lead.budget}</p>}
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center p-6 bg-[#1C1C22] rounded-xl">
                   <p className="text-[#9A9AA0] text-sm">لم يجد الذكاء الاصطناعي بيانات عملاء واضحة في المحادثة.</p>
                 </div>
               )}
            </div>
          )}

        </div>

        {/* Right Side / Instructions */}
        <div className="space-y-4">
           <div className="card-luxury p-5 border-t-4 !border-t-[#25D366]">
              <h4 className="font-bold text-[#F5F5F5] mb-3 text-sm">طريقة الإستخدام</h4>
              <ul className="text-sm text-[#9A9AA0] space-y-3 leading-relaxed">
                 <li className="flex gap-2"><span className="text-[#25D366]">1.</span> افتح الدردشة المطلوبة من تطبيق الواتساب.</li>
                 <li className="flex gap-2"><span className="text-[#25D366]">2.</span> اذهب لخيارات الدردشة واختر "تصدير الدردشة" (Export Chat).</li>
                 <li className="flex gap-2"><span className="text-[#25D366]">3.</span> اختر "بدون وسائط" ليكون حجم الملف خفيف.</li>
                 <li className="flex gap-2"><span className="text-[#25D366]">4.</span> سيتم حفظ الملف بصيغة (.txt). ارفعه هنا.</li>
              </ul>
           </div>

           <div className="bg-[#1C1C22] p-5 rounded-xl border border-white/5 flex gap-3 text-sm">
             <AlertCircle className="text-[#C6914C] flex-shrink-0 mt-0.5" size={16} />
             <p className="text-[#9A9AA0] leading-relaxed">
               <strong className="text-white">ملاحظة الخصوصية:</strong> الملفات المرفوعة يتم تحليلها لحظياً عبر نماذج الذكاء الاصطناعي لاستخراج البيانات وفوراً مسحها دون حفظ المحادثات.
             </p>
           </div>
        </div>

      </div>

      {/* ══════════ قوالب الرسائل ══════════ */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageCircle size={16} style={{ color: "#25D366" }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F5" }}>قوالب الرسائل الجاهزة</h3>
          <span style={{ fontSize: 11, color: "#5A5A62", background: "#1C1C22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 99, padding: "2px 10px" }}>
            {MESSAGE_TEMPLATES.reduce((n, c) => n + c.templates.length, 0)} قالب
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#5A5A62", marginBottom: 20 }}>
          انسخ القالب بضغطة واحدة — عدّل المتغيرات بين الأقواس بالمعلومات الفعلية قبل الإرسال
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {MESSAGE_TEMPLATES.map(cat => {
            const isOpen = expandedCat === cat.category;
            return (
              <div key={cat.category} style={{ background: "#16161A", border: `1px solid ${cat.color}18`, borderRadius: 14, overflow: "hidden" }}>
                {/* Category header */}
                <button
                  onClick={() => setExpandedCat(isOpen ? null : cat.category)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", borderBottom: isOpen ? `1px solid ${cat.color}14` : "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#E4E4E7" }}>{cat.category}</span>
                    <span style={{ fontSize: 10, color: "#52525B" }}>{cat.templates.length} قوالب</span>
                  </div>
                  {isOpen ? <ChevronUp size={14} style={{ color: "#52525B" }} /> : <ChevronDown size={14} style={{ color: "#52525B" }} />}
                </button>

                {/* Templates */}
                {isOpen && (
                  <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {cat.templates.map((tpl, idx) => {
                      const id = `${cat.category}-${idx}`;
                      const copied = copiedId === id;
                      return (
                        <div key={idx} style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: cat.color }}>{tpl.title}</span>
                            <button
                              onClick={() => copyTemplate(tpl.text, id)}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 7, background: copied ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${copied ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.08)"}`, color: copied ? "#4ADE80" : "#9A9AA0", fontSize: 11, cursor: "pointer", transition: "all 0.2s" }}
                            >
                              {copied ? <Check size={11} /> : <Copy size={11} />}
                              {copied ? "تم النسخ!" : "نسخ"}
                            </button>
                          </div>
                          <pre style={{ margin: 0, padding: "10px 12px", fontSize: 12, color: "#9A9AA0", whiteSpace: "pre-wrap", lineHeight: 1.7, fontFamily: "inherit" }}>
                            {tpl.text}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
