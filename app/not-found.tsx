import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center"
      dir="rtl"
      style={{
        background: "var(--bg-page)",
        color: "var(--text-strong)",
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&family=Noto+Kufi+Arabic:wght@700;900&display=swap');
        .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .fade-up-delay { animation: fadeUp 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Big 404 */}
      <div
        className="font-kufi fade-up"
        style={{
          fontSize: "clamp(96px, 20vw, 180px)",
          fontWeight: 900,
          lineHeight: 1,
          background: "linear-gradient(135deg, var(--gold-2) 0%, var(--gold-3) 60%, #2A2018 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          userSelect: "none",
        }}
      >
        404
      </div>

      {/* Message */}
      <div
        className="fade-up-delay text-center"
        style={{ marginTop: 24, maxWidth: 360, padding: "0 24px" }}
      >
        <h1
          className="font-kufi"
          style={{ fontSize: 22, fontWeight: 700, color: "var(--text-strong)", marginBottom: 12 }}
        >
          الصفحة غير موجودة
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-soft)", lineHeight: 1.7, marginBottom: 32 }}>
          يبدو أن الرابط الذي تبحث عنه لم يعد موجوداً أو تم نقله.
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 28px",
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
              color: "var(--bg-page)",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
          >
            الصفحة الرئيسية
          </Link>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 28px",
              borderRadius: 10,
              background: "var(--gold-bg-soft)",
              border: "1px solid var(--gold-bg-hover)",
              color: "var(--gold-2)",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
          >
            لوحة التحكم
          </Link>
        </div>
      </div>

      {/* Subtle brand */}
      <div
        className="fade-up-delay font-kufi"
        style={{
          marginTop: 64,
          fontSize: 12,
          color: "var(--border-1)",
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        وسيط برو
      </div>
    </div>
  );
}
