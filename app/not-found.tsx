import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      dir="rtl"
      style={{
        background: "#0A0A0C",
        color: "#F5F5F5",
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
          background: "linear-gradient(135deg, #C6914C 0%, #A6743A 60%, #2A2018 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          userSelect: "none",
        }}
      >
        404
      </div>

      {/* Message */}
      <div className="fade-up-delay text-center" style={{ marginTop: 24, maxWidth: 360, padding: "0 24px" }}>
        <h1
          className="font-kufi"
          style={{ fontSize: 22, fontWeight: 700, color: "#F5F5F5", marginBottom: 12 }}
        >
          الصفحة غير موجودة
        </h1>
        <p style={{ fontSize: 15, color: "#9A9AA0", lineHeight: 1.7, marginBottom: 32 }}>
          يبدو أن الرابط الذي تبحث عنه لم يعد موجوداً أو تم نقله.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 28px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #C6914C, #A6743A)",
              color: "#0A0A0C",
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
              background: "rgba(198,145,76,0.08)",
              border: "1px solid rgba(198,145,76,0.2)",
              color: "#C6914C",
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
        style={{ marginTop: 64, fontSize: 12, color: "#3A3A42", fontWeight: 700, letterSpacing: 1 }}
      >
        وسيط برو
      </div>
    </div>
  );
}
