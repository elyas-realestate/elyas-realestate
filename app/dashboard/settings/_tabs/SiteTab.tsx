// ══════════════════════════════════════════════════════════════
// SiteTab — تبويب إعدادات الموقع العام
// ══════════════════════════════════════════════════════════════
// أكبر tab — يحتوي 11 sub-section (general/identity/licenses/hero/
// navbar/sections/services/why/pages/cta).
// ══════════════════════════════════════════════════════════════

import { Image, Upload, X, Loader2, Plus, Trash2 } from "lucide-react";
import ServiceIcon, { SERVICE_ICON_KEYS } from "@/app/components/ServiceIcon";
import { STATIC_PAGES } from "../_constants";
import { SaveBtn } from "../_components/SaveBtn";

interface SiteSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface SiteTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  s: any; // settings alias — heterogeneous shape across 100+ optional columns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sc: (field: string, value: any) => void;
  siteSection: string;
  setSiteSection: (v: string) => void;
  selectedPage: string;
  setSelectedPage: (v: string) => void;
  saving: boolean;
  saved: boolean;
  handleSaveSettings: () => void;
  uploadingLogo: boolean;
  logoError: string;
  handleLogoUpload: (file: File) => void;
  uploadingHero: boolean;
  heroError: string;
  heroDragActive: boolean;
  setHeroDragActive: (b: boolean) => void;
  handleHeroUpload: (file: File) => void;
  handleHeroDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  svcChange: (i: number, f: string, v: string) => void;
  whyChange: (i: number, f: string, v: string) => void;
  navChange: (i: number, f: string, v: string) => void;
  slug: string;
  inputClass: string;
  SITE_SECTIONS: SiteSection[];
}

export function SiteTab({
  s,
  sc,
  siteSection,
  setSiteSection,
  selectedPage,
  setSelectedPage,
  saving,
  saved,
  handleSaveSettings,
  uploadingLogo,
  logoError,
  handleLogoUpload,
  uploadingHero,
  heroError,
  heroDragActive,
  setHeroDragActive,
  handleHeroUpload,
  handleHeroDrop,
  svcChange,
  whyChange,
  navChange,
  slug,
  inputClass,
  SITE_SECTIONS,
}: SiteTabProps) {
  return (
    <div>
      {/* Mobile section selector */}
      <div className="mb-4 md:hidden">
        <select
          value={siteSection}
          onChange={(e) => {
            setSiteSection(e.target.value);
            setSelectedPage("");
          }}
          className="w-full rounded-xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-4 py-3 text-sm focus:border-[var(--gold-2)] focus:outline-none"
          style={{ color: "var(--text-strong)" }}
        >
          {SITE_SECTIONS.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.label}
            </option>
          ))}
        </select>
      </div>

      <div className="items-start md:flex md:gap-6">
        {/* Desktop sidebar */}
        <div className="hidden w-52 flex-shrink-0 space-y-1 md:block">
          {SITE_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                setSiteSection(sec.id);
                setSelectedPage("");
              }}
              className={
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-medium transition " +
                (siteSection === sec.id
                  ? "bg-[var(--gold-2)] text-white"
                  : "text-[var(--text-soft)] hover:bg-[var(--bg-surface-1)] hover:text-[var(--gold-1)]")
              }
            >
              <sec.icon size={15} />
              {sec.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-w-2xl min-w-0 flex-1 space-y-5">
          {/* ── معلومات عامة ── */}
          {siteSection === "general" && (
            <div className="space-y-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
              <h3 className="text-lg font-bold text-[var(--gold-2)]">معلومات عامة</h3>
              <div>
                <label className="mb-2 block text-sm text-[var(--text-soft)]">
                  اسم الموقع / اسمك
                </label>
                <input
                  value={s.site_name || ""}
                  onChange={(e) => sc("site_name", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--text-soft)]">منطقة التغطية</label>
                <input
                  value={s.coverage_text || ""}
                  onChange={(e) => sc("coverage_text", e.target.value)}
                  className={inputClass}
                  placeholder="مثال: شمال وشرق الرياض"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--text-soft)]">
                  نص زر تسجيل الدخول
                </label>
                <input
                  value={s.login_link_text || ""}
                  onChange={(e) => sc("login_link_text", e.target.value)}
                  className={inputClass}
                  placeholder="دخول الفريق"
                />
              </div>
              <SaveBtn onClick={handleSaveSettings} saving={saving} saved={saved} />
            </div>
          )}

          {/* ── الهوية البصرية ── */}
          {siteSection === "identity" && (
            <div className="space-y-6 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
              <h3 className="text-lg font-bold text-[var(--gold-2)]">الهوية البصرية</h3>
              {/* Logo */}
              <div>
                <label className="mb-3 block text-sm text-[var(--text-soft)]">شعار الموقع</label>
                <div className="flex items-start gap-4">
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)]">
                    {s.site_logo ? (
                      <img
                        src={s.site_logo}
                        alt="الشعار"
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Image size={26} className="text-[var(--text-faint)]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label
                      className={
                        "flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-4 py-3 text-sm font-medium text-[var(--text-soft)] transition " +
                        (uploadingLogo
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-[var(--bg-surface-3)]")
                      }
                    >
                      <Upload size={14} />
                      {uploadingLogo ? "جاري الرفع..." : "رفع شعار"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingLogo}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleLogoUpload(f);
                        }}
                      />
                    </label>
                    <p className="mt-2 text-xs text-[var(--text-faint)]">
                      PNG أو SVG — الحجم المثالي 200×200px
                    </p>
                    {logoError && <p className="mt-2 text-xs text-red-400">{logoError}</p>}
                    {s.site_logo && (
                      <button
                        onClick={() => sc("site_logo", "")}
                        className="mt-2 flex items-center gap-1 text-xs text-red-400 transition hover:text-red-300"
                      >
                        <X size={11} /> حذف الشعار
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <SaveBtn onClick={handleSaveSettings} saving={saving} saved={saved} />
            </div>
          )}

          {/* ── الرخص والاعتمادات (sub-section مستقل، بارز) ── */}
          {siteSection === "licenses" && (
            <div className="space-y-4 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--gold-2)]">الرخص والاعتمادات</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
                  هذه الأرقام تظهر تلقائياً على بطاقتك التعريفية{" "}
                  <code
                    className="rounded px-1.5 text-xs"
                    style={{ background: "var(--bg-surface-2)" }}
                  >
                    /c/{slug || "اسمك"}
                  </code>{" "}
                  بدون الحاجة لإدخالها مرة ثانية.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-soft)]">◇ رخصة فال</label>
                  <input
                    value={s.fal_license || ""}
                    onChange={(e) => sc("fal_license", e.target.value)}
                    className={inputClass}
                    placeholder="1100167397"
                    maxLength={10}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-soft)]">
                    📋 السجل التجاري / الرقم الموحَّد{" "}
                    <span className="text-[var(--text-faint)]">(يبدأ بـ 7، عشرة أرقام)</span>
                  </label>
                  <input
                    value={s.cr_number || ""}
                    onChange={(e) =>
                      sc("cr_number", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className={inputClass}
                    placeholder="7XXXXXXXXX"
                    maxLength={10}
                    inputMode="numeric"
                    dir="ltr"
                  />
                  {s.cr_number && s.cr_number.length === 10 && !s.cr_number.startsWith("7") && (
                    <p className="mt-1 text-xs" style={{ color: "var(--warning)" }}>
                      ⚠️ السجل التجاري السعودي عادةً يبدأ بـ 7
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-soft)]">
                    💼 الرقم الضريبي
                  </label>
                  <input
                    value={s.vat_number || ""}
                    onChange={(e) => sc("vat_number", e.target.value)}
                    className={inputClass}
                    placeholder="3XXXXXXXXXXXXX3"
                    maxLength={15}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-soft)]">
                    ✅ رخصة معروف
                  </label>
                  <input
                    value={s.maaroof_license || ""}
                    onChange={(e) => sc("maaroof_license", e.target.value)}
                    className={inputClass}
                    placeholder="351692"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-soft)]">
                    🛡️ رخصة موثوق
                  </label>
                  <input
                    value={s.mowathaq_license || ""}
                    onChange={(e) => sc("mowathaq_license", e.target.value)}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-soft)]">
                    📄 وثيقة العمل الحر
                  </label>
                  <input
                    value={s.freelance_license || ""}
                    onChange={(e) => sc("freelance_license", e.target.value)}
                    className={inputClass}
                    placeholder="FL-XXXXXXXXX"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-soft)]">
                    🏛️ رخصة هيئة العقار
                  </label>
                  <input
                    value={s.gam_license || ""}
                    onChange={(e) => sc("gam_license", e.target.value)}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
              </div>

              <SaveBtn onClick={handleSaveSettings} saving={saving} saved={saved} />
            </div>
          )}

          {/* ── القسم الرئيسي ── */}
          {siteSection === "hero" && (
            <div className="space-y-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
              <h3 className="text-lg font-bold text-[var(--gold-2)]">القسم الرئيسي (Hero)</h3>
              <div>
                <label className="mb-2 block text-sm text-[var(--text-soft)]">
                  الشارة العلوية{" "}
                  <span className="text-[var(--text-faint)]">(النص الصغير فوق العنوان)</span>
                </label>
                <input
                  value={s.hero_badge || ""}
                  onChange={(e) => sc("hero_badge", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--text-soft)]">
                  العنوان الرئيسي
                </label>
                <input
                  value={s.hero_title || ""}
                  onChange={(e) => sc("hero_title", e.target.value)}
                  className={inputClass + " text-lg font-bold"}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--text-soft)]">الوصف التعريفي</label>
                <textarea
                  value={s.hero_subtitle || ""}
                  onChange={(e) => sc("hero_subtitle", e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-[var(--text-soft)]">صورة الخلفية</label>

                {/* Drag & drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHeroDragActive(true);
                  }}
                  onDragLeave={() => setHeroDragActive(false)}
                  onDrop={handleHeroDrop}
                  className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition"
                  style={{
                    background: heroDragActive ? "var(--gold-bg-hover)" : "var(--bg-surface-2)",
                    borderColor: heroDragActive ? "var(--gold-1)" : "var(--gold-bg-hover)",
                    minHeight: s.hero_image ? 180 : 140,
                  }}
                >
                  {s.hero_image && !uploadingHero && (
                    <img
                      src={s.hero_image}
                      alt="معاينة"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.55,
                      }}
                    />
                  )}
                  <div
                    className="relative flex flex-col items-center justify-center gap-2 p-6 text-center"
                    style={{ minHeight: s.hero_image ? 180 : 140 }}
                  >
                    {uploadingHero ? (
                      <>
                        <Loader2
                          size={28}
                          className="animate-spin"
                          style={{ color: "var(--gold-1)" }}
                        />
                        <span className="text-sm" style={{ color: "var(--text-soft)" }}>
                          جاري الرفع…
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload
                          size={26}
                          style={{
                            color: heroDragActive ? "var(--gold-1)" : "var(--text-soft)",
                          }}
                        />
                        <div
                          className="text-sm font-medium"
                          style={{
                            color: s.hero_image ? "#FFFFFF" : "var(--text-strong)",
                            textShadow: s.hero_image ? "0 1px 4px rgba(0,0,0,0.6)" : "none",
                          }}
                        >
                          {s.hero_image ? "استبدال الصورة" : "اسحب صورة هنا أو اضغط للرفع"}
                        </div>
                        <div
                          className="text-xs"
                          style={{
                            color: s.hero_image ? "rgba(255,255,255,0.85)" : "var(--text-faint)",
                            textShadow: s.hero_image ? "0 1px 3px rgba(0,0,0,0.6)" : "none",
                          }}
                        >
                          JPG / PNG / WebP — حتى ٥ ميجا
                        </div>
                        <label
                          className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition"
                          style={{
                            background: "var(--gold-bg-hover)",
                            color: "var(--gold-2)",
                            border: "1px solid var(--gold-bg-strong)",
                          }}
                        >
                          <Upload size={13} /> اختيار ملف
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleHeroUpload(f);
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {heroError && (
                  <div className="mt-2 text-xs" style={{ color: "var(--danger)" }}>
                    {heroError}
                  </div>
                )}

                {/* OR — رابط URL خارجي */}
                <div className="mt-3">
                  <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                    أو ألصق رابط صورة (اختياري)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={s.hero_image || ""}
                      onChange={(e) => sc("hero_image", e.target.value)}
                      className={inputClass + " flex-1 text-sm"}
                      dir="ltr"
                      placeholder="https://images.unsplash.com/..."
                    />
                    {s.hero_image && (
                      <button
                        onClick={() => sc("hero_image", "")}
                        className="flex items-center gap-1 rounded-lg px-3 text-xs transition"
                        style={{
                          background: "var(--bg-surface-2)",
                          color: "var(--danger)",
                          border: "1px solid var(--gold-bg)",
                        }}
                        title="إزالة الصورة"
                      >
                        <X size={14} /> إزالة
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <SaveBtn onClick={handleSaveSettings} saving={saving} saved={saved} />
            </div>
          )}

          {/* ── روابط القائمة ── */}
          {siteSection === "navbar" && (
            <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--gold-2)]">روابط القائمة العلوية</h3>
                  <p className="mt-1 text-sm text-[var(--text-faint)]">
                    الروابط اللي تظهر في النافبار
                  </p>
                </div>
                <button
                  onClick={() =>
                    sc("navbar_links", [
                      ...(s.navbar_links || []),
                      { label: "", href: "/", type: "link" },
                    ])
                  }
                  className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] px-4 py-2 text-sm transition hover:bg-[var(--bg-surface-3)]"
                >
                  <Plus size={13} /> إضافة رابط
                </button>
              </div>
              <div className="space-y-3">
                {(s.navbar_links || []).map(
                  (link: { type?: string; label?: string; href?: string }, i: number) => (
                    <div key={i} className="rounded-xl bg-[var(--bg-surface-2)] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-[var(--text-faint)]">رابط {i + 1}</span>
                        <button
                          onClick={() =>
                            sc(
                              "navbar_links",
                              s.navbar_links.filter((_: unknown, j: number) => j !== i)
                            )
                          }
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={11} /> حذف
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs text-[var(--text-faint)]">
                            النص
                          </label>
                          <input
                            value={link.label || ""}
                            onChange={(e) => navChange(i, "label", e.target.value)}
                            className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                            placeholder="الرئيسية"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-[var(--text-faint)]">
                            الرابط
                          </label>
                          <input
                            value={link.href || ""}
                            onChange={(e) => navChange(i, "href", e.target.value)}
                            className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                            dir="ltr"
                            placeholder="/"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-[var(--text-faint)]">
                            النوع
                          </label>
                          <select
                            value={link.type || "link"}
                            onChange={(e) => navChange(i, "type", e.target.value)}
                            className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                          >
                            <option value="link">رابط صفحة</option>
                            <option value="anchor">رابط قسم (#)</option>
                            <option value="cta">زر بارز (CTA)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="mt-4">
                <SaveBtn onClick={handleSaveSettings} saving={saving} saved={saved} />
              </div>
            </div>
          )}

          {/* ── إظهار / إخفاء الأقسام ── */}
          {siteSection === "sections" && (
            <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
              <h3 className="mb-2 text-lg font-bold text-[var(--gold-2)]">
                إظهار / إخفاء أقسام الصفحة الرئيسية
              </h3>
              <p className="mb-5 text-sm text-[var(--text-faint)]">
                تحكّم بالأقسام اللي تبيها تظهر
              </p>
              <div className="space-y-3">
                {[
                  {
                    field: "show_why_section",
                    label: "قسم لماذا تختارنا",
                    desc: "البطاقات اللي تشرح مميزاتك",
                  },
                  {
                    field: "show_properties_section",
                    label: "قسم العقارات المختارة",
                    desc: "آخر ٣ عقارات منشورة",
                  },
                  {
                    field: "show_services_section",
                    label: "قسم الخدمات",
                    desc: "بطاقات خدماتك العقارية",
                  },
                  {
                    field: "show_cta_section",
                    label: "قسم التواصل (CTA)",
                    desc: "صندوق التواصل مع أزرار الواتساب والاتصال",
                  },
                ].map((item) => (
                  <div
                    key={item.field}
                    className="flex items-center justify-between rounded-xl bg-[var(--bg-surface-2)] p-4"
                  >
                    <div>
                      <h4 className="text-sm font-medium">{item.label}</h4>
                      <p className="mt-1 text-xs text-[var(--text-faint)]">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => sc(item.field, !s[item.field])}
                      className={
                        "relative h-8 w-14 rounded-full transition " +
                        (s[item.field] !== false
                          ? "bg-[var(--gold-2)]"
                          : "bg-[var(--bg-surface-3)]")
                      }
                    >
                      <div
                        className={
                          "absolute top-1 h-6 w-6 rounded-full bg-white transition-all " +
                          (s[item.field] !== false ? "left-1" : "right-1")
                        }
                      />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <SaveBtn onClick={handleSaveSettings} saving={saving} saved={saved} />
              </div>
            </div>
          )}

          {/* ── الخدمات ── */}
          {siteSection === "services" && (
            <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--gold-2)]">الخدمات</h3>
                <button
                  onClick={() =>
                    sc("services", [...(s.services || []), { title: "", desc: "", icon: "home" }])
                  }
                  className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] px-4 py-2 text-sm transition hover:bg-[var(--bg-surface-3)]"
                >
                  <Plus size={13} /> إضافة خدمة
                </button>
              </div>
              <div className="space-y-4">
                {(s.services || []).map(
                  (svc: { icon?: string; title?: string; desc?: string }, i: number) => (
                    <div key={i} className="space-y-3 rounded-xl bg-[var(--bg-surface-2)] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-faint)]">خدمة {i + 1}</span>
                        <button
                          onClick={() =>
                            sc(
                              "services",
                              s.services.filter((_: unknown, j: number) => j !== i)
                            )
                          }
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={11} /> حذف
                        </button>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs text-[var(--text-faint)]">
                          الأيقونة
                        </label>
                        <div
                          className="mb-3 flex flex-wrap gap-1.5 rounded-lg p-2"
                          style={{
                            background: "var(--bg-surface-1)",
                            border: "1px solid var(--gold-bg-hover)",
                          }}
                        >
                          {SERVICE_ICON_KEYS.map((key) => {
                            const isActive = (svc.icon || "home") === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => svcChange(i, "icon", key)}
                                className="flex items-center justify-center transition"
                                title={key}
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 8,
                                  background: isActive ? "var(--gold-bg-hover)" : "transparent",
                                  border: isActive
                                    ? "1px solid var(--gold-2)"
                                    : "1px solid transparent",
                                  color: isActive ? "var(--gold-2)" : "var(--text-faint)",
                                  cursor: "pointer",
                                }}
                              >
                                <ServiceIcon name={key} size={18} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-[var(--text-faint)]">
                          اسم الخدمة
                        </label>
                        <input
                          value={svc.title || ""}
                          onChange={(e) => svcChange(i, "title", e.target.value)}
                          className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-[var(--text-faint)]">
                          وصف الخدمة
                        </label>
                        <textarea
                          value={svc.desc || ""}
                          onChange={(e) => svcChange(i, "desc", e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="mt-4">
                <SaveBtn onClick={handleSaveSettings} saving={saving} saved={saved} />
              </div>
            </div>
          )}

          {/* ── لماذا تختارنا ── */}
          {siteSection === "why" && (
            <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--gold-2)]">لماذا تختارنا</h3>
                <button
                  onClick={() =>
                    sc("why_cards", [
                      ...(s.why_cards || []),
                      { title: "", desc: "", icon: "award" },
                    ])
                  }
                  className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] px-4 py-2 text-sm transition hover:bg-[var(--bg-surface-3)]"
                >
                  <Plus size={13} /> إضافة بطاقة
                </button>
              </div>
              <div className="space-y-4">
                {(s.why_cards || []).map(
                  (card: { icon?: string; title?: string; desc?: string }, i: number) => (
                    <div key={i} className="space-y-3 rounded-xl bg-[var(--bg-surface-2)] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-faint)]">بطاقة {i + 1}</span>
                        <button
                          onClick={() =>
                            sc(
                              "why_cards",
                              s.why_cards.filter((_: unknown, j: number) => j !== i)
                            )
                          }
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={11} /> حذف
                        </button>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs text-[var(--text-faint)]">
                          الأيقونة
                        </label>
                        <div
                          className="mb-3 flex flex-wrap gap-1.5 rounded-lg p-2"
                          style={{
                            background: "var(--bg-surface-1)",
                            border: "1px solid var(--gold-bg-hover)",
                          }}
                        >
                          {SERVICE_ICON_KEYS.map((key) => {
                            const isActive = (card.icon || "award") === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => whyChange(i, "icon", key)}
                                className="flex items-center justify-center transition"
                                title={key}
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 8,
                                  background: isActive ? "var(--gold-bg-hover)" : "transparent",
                                  border: isActive
                                    ? "1px solid var(--gold-2)"
                                    : "1px solid transparent",
                                  color: isActive ? "var(--gold-2)" : "var(--text-faint)",
                                  cursor: "pointer",
                                }}
                              >
                                <ServiceIcon name={key} size={18} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-[var(--text-faint)]">
                          العنوان
                        </label>
                        <input
                          value={card.title || ""}
                          onChange={(e) => whyChange(i, "title", e.target.value)}
                          className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-[var(--text-faint)]">الوصف</label>
                        <textarea
                          value={card.desc || ""}
                          onChange={(e) => whyChange(i, "desc", e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="mt-4">
                <SaveBtn onClick={handleSaveSettings} saving={saving} saved={saved} />
              </div>
            </div>
          )}

          {/* ── الصفحات الثابتة ── */}
          {siteSection === "pages" && !selectedPage && (
            <div>
              <h3 className="mb-2 text-lg font-bold text-[var(--gold-2)]">الصفحات الثابتة</h3>
              <p className="mb-5 text-sm text-[var(--text-faint)]">تعديل نصوص الصفحات في موقعك</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {STATIC_PAGES.map((page) => (
                  <button
                    key={page.key}
                    onClick={() => setSelectedPage(page.key)}
                    className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-5 text-right transition hover:border-[var(--gold-2)]"
                  >
                    <h4 className="font-bold text-[var(--gold-2)]">{page.label}</h4>
                  </button>
                ))}
              </div>
            </div>
          )}
          {siteSection === "pages" && selectedPage && (
            <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-bold text-[var(--gold-2)]">
                  {STATIC_PAGES.find((p) => p.key === selectedPage)?.label}
                </h3>
                <button
                  onClick={() => setSelectedPage("")}
                  className="text-sm text-[var(--text-soft)] transition hover:text-[var(--gold-1)]"
                >
                  ← رجوع
                </button>
              </div>
              <textarea
                value={s[selectedPage] || ""}
                onChange={(e) => sc(selectedPage, e.target.value)}
                rows={12}
                className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-4 py-3 focus:border-[var(--gold-2)] focus:outline-none"
                placeholder="اكتب محتوى الصفحة هنا..."
              />
              <div className="mt-4">
                <SaveBtn onClick={handleSaveSettings} saving={saving} saved={saved} />
              </div>
            </div>
          )}

          {/* ── التواصل والفوتر ── */}
          {siteSection === "cta" && (
            <div className="space-y-5">
              <div className="space-y-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                <h3 className="text-lg font-bold text-[var(--gold-2)]">قسم التواصل (CTA)</h3>
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-soft)]">
                    عنوان قسم التواصل
                  </label>
                  <input
                    value={s.cta_title || ""}
                    onChange={(e) => sc("cta_title", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-soft)]">
                    وصف قسم التواصل
                  </label>
                  <textarea
                    value={s.cta_subtitle || ""}
                    onChange={(e) => sc("cta_subtitle", e.target.value)}
                    rows={2}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                <h3 className="text-lg font-bold text-[var(--gold-2)]">الفوتر</h3>
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-soft)]">
                    نص الفوتر التعريفي
                  </label>
                  <textarea
                    value={s.footer_text || ""}
                    onChange={(e) => sc("footer_text", e.target.value)}
                    rows={3}
                    className={inputClass}
                  />
                </div>
              </div>
              <SaveBtn onClick={handleSaveSettings} saving={saving} saved={saved} />
            </div>
          )}
        </div>
        {/* end content */}
      </div>
    </div>
  );
}
