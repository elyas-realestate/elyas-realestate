import Link from "next/link";

export default function NotFound() {
  return (
    <div dir="rtl" className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-6xl font-bold text-[var(--gold-2)] mb-4">404</h2>
      <p className="text-lg text-[var(--text-strong)] mb-2">الصفحة غير موجودة</p>
      <p className="text-sm text-[var(--text-soft)] mb-6">
        يبدو أن هذه الصفحة غير متوفرة أو تم نقلها
      </p>
      <Link
        href="/dashboard"
        className="bg-[var(--gold-2)] hover:bg-[var(--gold-3)] text-white px-6 py-3 rounded-xl font-medium transition"
      >
        العودة للوحة التحكم
      </Link>
    </div>
  );
}
