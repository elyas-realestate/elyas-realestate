"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LogIn } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const navLinks = [
  { label: "الرئيسية", href: "/properties" },
  { label: "الخدمات", href: "/services" },
  { label: "من نحن", href: "/about" },
  { label: "تواصل معنا", href: "/contact" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [siteName, setSiteName] = useState("إلياس الدخيل");
  const [siteLogo, setSiteLogo] = useState("");

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await supabase.from("site_settings").select("*").single();
    if (data) {
      setSiteName(data.site_name || "إلياس الدخيل");
      setSiteLogo(data.site_logo || "");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col" dir="rtl">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition">
            <LogIn size={16} />
            {"تسجيل الدخول (للفريق)"}
          </Link>
          <nav className="flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-gray-300 hover:text-white text-sm transition">
                {link.label}
              </Link>
            ))}
          </nav>
          <Link href="/properties" className="flex items-center gap-2">
            {siteLogo
              ? <img src={siteLogo} alt={siteName} className="w-8 h-8 rounded-lg object-cover" />
              : <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">{siteName.charAt(0)}</div>
            }
            <span className="font-bold text-sm">{siteName}</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 px-6 py-8 mt-12">
        <div className="max-w-6xl mx-auto flex flex-wrap items-start justify-between gap-8">
          <div>
            <p className="font-bold text-lg mb-1">{siteName}</p>
            <p className="text-gray-400 text-sm">{"وسيط عقاري مرخص — الرياض"}</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-3 text-gray-300">{"روابط"}</p>
            <div className="space-y-2">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} className="block text-gray-400 hover:text-white text-sm transition">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-3 text-gray-300">{"تواصل معنا"}</p>
            <p className="text-gray-500 text-xs">{"سيتم عرض أيقونات التواصل بعد إضافتها من الإعدادات"}</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-xs">{"جميع الحقوق محفوظة © 2026 " + siteName}</p>
        </div>
      </footer>
    </div>
  );
}