import Link from "next/link";

export default function NotFound() {
  return (
    <div dir="rtl" className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="mb-4 text-6xl font-bold text-[var(--gold-2)]">404</h2>
      <p className="mb-2 text-lg text-[var(--text-strong)]">الصفحة غير موجودة</p>
      <p className="mb-6 text-sm text-[var(--text-soft)]">
        يبدو أن هذه الصفحة غير متوفرة أو تم نقلها
      </p>
      <Link
        href="/dashboard"
        className="rounded-xl bg-[var(--gold-2)] px-6 py-3 font-medium text-white transition hover:bg-[var(--gold-3)]"
      >
        العودة للوحة التحكم
      </Link>
    </div>
  );
}
