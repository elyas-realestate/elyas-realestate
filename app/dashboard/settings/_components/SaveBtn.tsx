// ══════════════════════════════════════════════════════════════
// SaveBtn — زر حفظ موحّد بـ 3 حالات (idle / loading / saved)
// ══════════════════════════════════════════════════════════════
// مُستخرَج من page.tsx ليُعاد استخدامه عبر كل التابات.
// ══════════════════════════════════════════════════════════════

import { Check, Loader2, Save } from "lucide-react";

interface SaveBtnProps {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
}

export function SaveBtn({ onClick, saving, saved }: SaveBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={
        "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition " +
        (saved
          ? "bg-green-600 text-white"
          : "bg-[var(--gold-2)] text-[var(--bg-page)] hover:bg-[var(--gold-3)]")
      }
    >
      {saved ? (
        <>
          <Check size={15} /> تم الحفظ
        </>
      ) : saving ? (
        <>
          <Loader2 size={15} className="animate-spin" /> جاري...
        </>
      ) : (
        <>
          <Save size={15} /> حفظ التغييرات
        </>
      )}
    </button>
  );
}
