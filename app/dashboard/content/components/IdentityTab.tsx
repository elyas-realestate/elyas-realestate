"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { BrokerIdentity } from "@/types/database";
import { SkeletonList } from "@/components/ui/Skeleton";

export default function IdentityTab() {
  const [identity, setIdentity] = useState<BrokerIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadIdentity();
  }, []);

  async function loadIdentity() {
    const { data } = await supabase
      .from("broker_identity")
      .select("*")
      .limit(1)
      .single();
    if (data) {
      setIdentity(data as BrokerIdentity);
    } else {
      setIdentity({
        id: "",
        broker_name: "إلياس الدخيل",
        fal_license: "",
        specialization: "وساطة وتسويق عقاري",
        coverage_areas: ["الرياض"],
        target_audiences: ["مالك عقار", "مشتري", "مستأجر", "مستثمر"],
        brand_keywords: ["وسيط مرخص", "الرياض", "عقارات"],
        avoid_phrases: ["سمسار", "فرصة لا تعوض", "حصرياً"],
        bio_short: "",
        bio_long: "",
      } as BrokerIdentity);
    }
    setLoading(false);
  }

  function handleChange(field: string, value: string) {
    setIdentity((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function handleArrayChange(field: string, value: string) {
    setIdentity((prev) =>
      prev
        ? {
            ...prev,
            [field]: value
              .split("،")
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : prev
    );
  }

  async function handleSave() {
    if (!identity) return;
    setSaving(true);
    if (identity.id) {
      await supabase
        .from("broker_identity")
        .update({
          broker_name: identity.broker_name,
          fal_license: identity.fal_license,
          specialization: identity.specialization,
          coverage_areas: identity.coverage_areas,
          target_audiences: identity.target_audiences,
          brand_keywords: identity.brand_keywords,
          avoid_phrases: identity.avoid_phrases,
          bio_short: identity.bio_short,
          bio_long: identity.bio_long,
          updated_at: new Date().toISOString(),
        })
        .eq("id", identity.id);
    } else {
      const { data } = await supabase
        .from("broker_identity")
        .insert([identity])
        .select()
        .single();
      if (data) setIdentity(data as BrokerIdentity);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <SkeletonList count={4} />;
  if (!identity) return null;

  const inputClass =
    "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C6914C]";

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">هوية الوسيط</h3>
        <p className="text-[#9A9AA0] text-sm">
          هذه المعلومات تُستخدم تلقائياً في كل محتوى يُنتج — عبّئها مرة واحدة
          بدقة.
        </p>
      </div>

      <div className="space-y-6">
        {/* المعلومات الأساسية */}
        <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 space-y-5">
          <h4 className="font-bold text-[#C6914C] mb-2">
            المعلومات الأساسية
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">
                اسم الوسيط
              </label>
              <input
                value={identity.broker_name || ""}
                onChange={(e) => handleChange("broker_name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">
                رقم رخصة فال
              </label>
              <input
                value={identity.fal_license || ""}
                onChange={(e) => handleChange("fal_license", e.target.value)}
                className={inputClass}
                placeholder="أدخل رقم الرخصة"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#9A9AA0] mb-2">
              التخصص
            </label>
            <input
              value={identity.specialization || ""}
              onChange={(e) => handleChange("specialization", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm text-[#9A9AA0] mb-2">
              مناطق التغطية{" "}
              <span className="text-[#5A5A62]">(افصل بفاصلة عربية ،)</span>
            </label>
            <input
              value={(identity.coverage_areas || []).join("، ")}
              onChange={(e) =>
                handleArrayChange("coverage_areas", e.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm text-[#9A9AA0] mb-2">
              الجمهور المستهدف{" "}
              <span className="text-[#5A5A62]">(افصل بفاصلة عربية ،)</span>
            </label>
            <input
              value={(identity.target_audiences || []).join("، ")}
              onChange={(e) =>
                handleArrayChange("target_audiences", e.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm text-[#9A9AA0] mb-2">
              كلمات مفتاحية للبراند{" "}
              <span className="text-[#5A5A62]">(افصل بفاصلة عربية ،)</span>
            </label>
            <input
              value={(identity.brand_keywords || []).join("، ")}
              onChange={(e) =>
                handleArrayChange("brand_keywords", e.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm text-[#9A9AA0] mb-2">
              عبارات تتجنبها{" "}
              <span className="text-[#5A5A62]">(افصل بفاصلة عربية ،)</span>
            </label>
            <input
              value={(identity.avoid_phrases || []).join("، ")}
              onChange={(e) =>
                handleArrayChange("avoid_phrases", e.target.value)
              }
              className={inputClass}
            />
          </div>
        </div>

        {/* النبذة التعريفية */}
        <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 space-y-5">
          <h4 className="font-bold text-[#C6914C] mb-2">
            النبذة التعريفية
          </h4>
          <div>
            <label className="block text-sm text-[#9A9AA0] mb-2">
              نبذة قصيرة
            </label>
            <textarea
              value={identity.bio_short || ""}
              onChange={(e) => handleChange("bio_short", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="وسيط عقاري مرخص في الرياض..."
            />
          </div>
          <div>
            <label className="block text-sm text-[#9A9AA0] mb-2">
              نبذة تفصيلية
            </label>
            <textarea
              value={identity.bio_long || ""}
              onChange={(e) => handleChange("bio_long", e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="اكتب نبذة تفصيلية..."
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={
            "px-8 py-3 rounded-lg font-bold text-lg transition " +
            (saved
              ? "bg-green-600"
              : "bg-[#C6914C] hover:bg-[#A6743A]")
          }
        >
          {saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ الهوية"}
        </button>
      </div>
    </div>
  );
}
