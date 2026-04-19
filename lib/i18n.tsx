"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "ar" | "en";

// ── Translations ─────────────────────────────────────────────────────────
const translations = {
  ar: {
    // Navigation
    dashboard: "لوحة التحكم",
    clients: "العملاء",
    properties: "العقارات",
    deals: "الصفقات",
    tasks: "المهام",
    requests: "الطلبات",
    financial: "التحليل المالي",
    commissions: "العمولات",
    marketing: "التسويق",
    content: "المحتوى",
    documents: "الوثائق",
    settings: "الإعدادات",
    projects: "المشاريع",
    invoices: "الفواتير",
    quotations: "عروض الأسعار",
    whatsapp: "الواتساب",
    // Common actions
    add: "إضافة",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    search: "بحث",
    loading: "جارٍ التحميل...",
    noData: "لا توجد بيانات",
    // Dashboard
    welcomeBack: "مرحباً",
    totalProperties: "إجمالي العقارات",
    publishedProperties: "عقارات منشورة",
    totalClients: "إجمالي العملاء",
    newRequests: "طلبات جديدة",
    totalDeals: "إجمالي الصفقات",
    // Properties
    addProperty: "إضافة عقار",
    propertyTitle: "عنوان العقار",
    price: "السعر",
    area: "المساحة",
    city: "المدينة",
    district: "الحي",
    published: "منشور",
    draft: "مسودة",
    forSale: "للبيع",
    forRent: "للإيجار",
    // Clients
    addClient: "إضافة عميل",
    fullName: "الاسم الكامل",
    phone: "رقم الجوال",
    budget: "الميزانية",
    notes: "ملاحظات",
    hot: "ساخن",
    warm: "دافئ",
    cold: "بارد",
    // Misc
    currency: "ريال",
    sqm: "م²",
  },
  en: {
    // Navigation
    dashboard: "Dashboard",
    clients: "Clients",
    properties: "Properties",
    deals: "Deals",
    tasks: "Tasks",
    requests: "Requests",
    financial: "Financial Analysis",
    commissions: "Commissions",
    marketing: "Marketing",
    content: "Content",
    documents: "Documents",
    settings: "Settings",
    projects: "Projects",
    invoices: "Invoices",
    quotations: "Quotations",
    whatsapp: "WhatsApp",
    // Common actions
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    search: "Search",
    loading: "Loading...",
    noData: "No data available",
    // Dashboard
    welcomeBack: "Welcome back",
    totalProperties: "Total Properties",
    publishedProperties: "Published Properties",
    totalClients: "Total Clients",
    newRequests: "New Requests",
    totalDeals: "Total Deals",
    // Properties
    addProperty: "Add Property",
    propertyTitle: "Property Title",
    price: "Price",
    area: "Area",
    city: "City",
    district: "District",
    published: "Published",
    draft: "Draft",
    forSale: "For Sale",
    forRent: "For Rent",
    // Clients
    addClient: "Add Client",
    fullName: "Full Name",
    phone: "Phone",
    budget: "Budget",
    notes: "Notes",
    hot: "Hot",
    warm: "Warm",
    cold: "Cold",
    // Misc
    currency: "SAR",
    sqm: "m²",
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;

// ── Context ──────────────────────────────────────────────────────────────
interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
}

const I18nContext = createContext<I18nCtx>({
  lang: "ar",
  setLang: () => {},
  t: (k) => translations.ar[k],
  dir: "rtl",
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("waseet-lang") as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("waseet-lang", l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }

  const t = (key: TranslationKey): string => translations[lang][key] ?? translations.ar[key];

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
