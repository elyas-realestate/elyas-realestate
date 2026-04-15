"use client";
import React, { useState, useRef } from "react";
import { MessageCircle, UploadCloud, FileText, CheckCircle2, ChevronLeft, Bot, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";

export default function WhatsAppPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    </div>
  );
}
