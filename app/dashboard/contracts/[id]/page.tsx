"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import {
  ArrowRight, Send, Printer, Trash2, Copy, Check,
  Loader2, AlertCircle, FileSignature, Shield, Clock,
  CheckCircle2, Edit3, XCircle, Link2, RotateCw,
} from "lucide-react";
import SignaturePad from "@/components/SignaturePad";

type Contract = {
  id: string;
  contract_number: string | null;
  title: string;
  category: string;
  body_html: string;
  status: string;
  amount: number | null;
  start_date: string | null;
  end_date: string | null;
  party_first: { name?: string; phone?: string; id_number?: string };
  party_second: { name?: string; phone?: string; id_number?: string };
  signing_token: string | null;
  signing_expires_at: string | null;
  final_hash: string | null;
  finalized_at: string | null;
  created_at: string;
  variables_used: Record<string, string>;
};

type Signature = {
  id: string;
  party: string;
  signer_name: string;
  signature_data: string;
  signed_at: string;
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: typeof Edit3 }> = {
  draft:               { label: "مسودة",            color: "#A1A1AA", bg: "rgba(161,161,170,0.10)", icon: Edit3 },
  sent_for_signature:  { label: "بانتظار التوقيع", color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  icon: Send },
  partially_signed:    { label: "وُقّع جزئياً",     color: "#E8B86D", bg: "rgba(232,184,109,0.10)", icon: Clock },
  signed:              { label: "موقَّع",            color: "#4ADE80", bg: "rgba(74,222,128,0.10)",  icon: CheckCircle2 },
  expired:             { label: "منتهي",            color: "#71717A", bg: "rgba(113,113,122,0.10)", icon: XCircle },
  void:                { label: "ملغي",              color: "#F87171", bg: "rgba(239,68,68,0.10)",   icon: XCircle },
};

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showFirstPartySign, setShowFirstPartySign] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true); setError("");
    try {
      const [{ data: c, error: cErr }, { data: sigs }] = await Promise.all([
        supabase.from("e_contracts").select("*").eq("id", id).single(),
        supabase.from("e_contract_signatures").select("*").eq("contract_id", id).order("signed_at"),
      ]);
      if (cErr) throw new Error(cErr.message);
      setContract(c as Contract);
      setSignatures((sigs || []) as Signature[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    }
    setLoading(false);
  }

  async function handleSendForSignature() {
    if (!contract) return;
    if (!confirm("هل تريد إرسال العقد للتوقيع؟ ستحصل على رابط مشاركة للطرف الثاني.")) return;
    setBusy(true);
    try {
      const token = generateToken();
      const expires = new Date(Date.now() + 30 * 86400_000).toISOString(); // 30 days
      const { error: e } = await supabase
        .from("e_contracts")
        .update({
          status: "sent_for_signature",
          signing_token: token,
          signing_expires_at: expires,
        })
        .eq("id", id);
      if (e) throw new Error(e.message);
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("e_contract_audit").insert({
        contract_id: id,
        action: "sent",
        actor_user_id: userData.user?.id,
        actor_label: `broker:${userData.user?.email}`,
        details: { token_expires_at: expires },
      });
      toast.success("تم إرسال العقد — انسخ رابط التوقيع وأرسله للطرف الثاني");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الإرسال");
    }
    setBusy(false);
  }

  async function handleFirstPartySignature(signatureData: string) {
    if (!contract) return;
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error: e } = await supabase.from("e_contract_signatures").insert({
        contract_id: contract.id,
        party: "first",
        signer_name: contract.party_first.name || "الطرف الأول",
        signer_id_number: contract.party_first.id_number,
        signer_phone: contract.party_first.phone,
        signature_data: signatureData,
      });
      if (e) throw new Error(e.message);
      await supabase.from("e_contract_audit").insert({
        contract_id: contract.id,
        action: "signed_first",
        actor_user_id: userData.user?.id,
        actor_label: `broker:${userData.user?.email}`,
      });
      toast.success("تم توقيع الطرف الأول");
      setShowFirstPartySign(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التوقيع");
    }
    setBusy(false);
  }

  async function handleFinalize() {
    if (!contract) return;
    if (signatures.filter(s => s.party === "first" || s.party === "second").length < 2) {
      toast.error("يجب توقيع كلا الطرفين قبل التثبيت");
      return;
    }
    setBusy(true);
    try {
      const sigsText = signatures.map(s => `${s.party}:${s.signer_name}:${s.signed_at}`).join("|");
      const hash = await sha256(contract.body_html + "|" + sigsText);
      const { error: e } = await supabase
        .from("e_contracts")
        .update({
          status: "signed",
          final_hash: hash,
          finalized_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (e) throw new Error(e.message);
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("e_contract_audit").insert({
        contract_id: id,
        action: "finalized",
        actor_user_id: userData.user?.id,
        actor_label: `broker:${userData.user?.email}`,
        details: { hash },
      });
      toast.success("تم تثبيت العقد بختم رقمي");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التثبيت");
    }
    setBusy(false);
  }

  async function handleVoid() {
    if (!contract) return;
    if (!confirm("هل تريد إلغاء العقد؟ لا يمكن التراجع.")) return;
    setBusy(true);
    try {
      const { error: e } = await supabase
        .from("e_contracts")
        .update({ status: "void", signing_token: null })
        .eq("id", id);
      if (e) throw new Error(e.message);
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("e_contract_audit").insert({
        contract_id: id,
        action: "voided",
        actor_user_id: userData.user?.id,
        actor_label: `broker:${userData.user?.email}`,
      });
      toast.success("تم إلغاء العقد");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
    setBusy(false);
  }

  async function handleDelete() {
    if (!contract) return;
    if (contract.status !== "draft") {
      toast.error("لا يمكن حذف عقد بعد إرساله — استخدم \"إلغاء\"");
      return;
    }
    if (!confirm("حذف هذه المسودة نهائياً؟")) return;
    setBusy(true);
    try {
      const { error: e } = await supabase.from("e_contracts").delete().eq("id", id);
      if (e) throw new Error(e.message);
      toast.success("تم الحذف");
      router.push("/dashboard/contracts");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
    setBusy(false);
  }

  function getSigningURL(): string {
    if (typeof window === "undefined" || !contract?.signing_token) return "";
    return `${window.location.origin}/sign/${contract.signing_token}`;
  }

  async function copySigningLink() {
    const url = getSigningURL();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function copyWhatsAppMessage() {
    const url = getSigningURL();
    const partyName = contract?.party_second?.name || "";
    const msg = `السلام عليكم${partyName ? ` ${partyName}` : ""}،\n\nمرفق رابط ${contract?.title || "العقد"} للاطلاع والتوقيع الإلكتروني:\n${url}\n\nالرابط صالح لمدة 30 يوماً.`;
    navigator.clipboard.writeText(msg);
    toast.success("نُسخت رسالة الواتساب");
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <Loader2 size={28} style={{ color: "#C6914C", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <AlertCircle size={16} style={{ color: "#F87171", display: "inline", marginInlineEnd: 8 }} />
        <span style={{ fontSize: 14, color: "#F87171" }}>{error || "لم يُعثر على العقد"}</span>
      </div>
    );
  }

  const sm = STATUS_META[contract.status] || STATUS_META.draft;
  const firstSigned = signatures.find(s => s.party === "first");
  const secondSigned = signatures.find(s => s.party === "second");
  const canEdit = contract.status === "draft";
  const canSend = contract.status === "draft";
  const canFinalize = (contract.status === "partially_signed" || (contract.status === "sent_for_signature" && firstSigned && secondSigned)) && !contract.final_hash;

  return (
    <div className="contract-detail">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .contract-print, .contract-print * { visibility: visible; }
          .contract-print { position: absolute; inset: 0; padding: 24px; background: white !important; color: black !important; }
          .no-print { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="no-print">
        <Link href="/dashboard/contracts"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#71717A", marginBottom: 12 }}>
          <ArrowRight size={12} /> العقود
        </Link>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#F4F4F5" }}>{contract.title}</h1>
              <span style={{ fontSize: 12, color: "#C6914C", direction: "ltr", fontWeight: 600 }}>
                {contract.contract_number}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: sm.color, background: sm.bg, padding: "3px 9px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <sm.icon size={11} /> {sm.label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#71717A" }}>
              {contract.party_first.name} ↔ {contract.party_second.name}
              {contract.amount && <> • {Number(contract.amount).toLocaleString("en-US")} ر.س</>}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {canSend && (
              <button onClick={handleSendForSignature} disabled={busy}
                style={btn("#60A5FA", "rgba(96,165,250,0.1)")}>
                <Send size={13} /> إرسال للتوقيع
              </button>
            )}
            {canFinalize && (
              <button onClick={handleFinalize} disabled={busy}
                style={btn("#4ADE80", "rgba(74,222,128,0.1)")}>
                <Shield size={13} /> تثبيت بختم رقمي
              </button>
            )}
            <button onClick={handlePrint} disabled={busy}
              style={btn("#A1A1AA", "rgba(255,255,255,0.04)")}>
              <Printer size={13} /> طباعة / PDF
            </button>
            {!canEdit && contract.status !== "void" && contract.status !== "signed" && (
              <button onClick={handleVoid} disabled={busy}
                style={btn("#F87171", "rgba(239,68,68,0.08)")}>
                <XCircle size={13} /> إلغاء
              </button>
            )}
            {canEdit && (
              <button onClick={handleDelete} disabled={busy}
                style={btn("#F87171", "rgba(239,68,68,0.08)")}>
                <Trash2 size={13} /> حذف
              </button>
            )}
          </div>
        </div>

        {/* Signing link */}
        {contract.signing_token && contract.status !== "signed" && contract.status !== "void" && (
          <div style={{ marginBottom: 16, padding: 14, borderRadius: 11, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#60A5FA", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Link2 size={13} /> رابط التوقيع للطرف الثاني
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <code style={{ flex: 1, padding: "9px 12px", background: "#0A0A0C", borderRadius: 7, fontSize: 11, color: "#A1A1AA", direction: "ltr", overflow: "auto", whiteSpace: "nowrap" }}>
                {getSigningURL()}
              </code>
              <button onClick={copySigningLink} style={btn("#60A5FA", "rgba(96,165,250,0.1)")}>
                {linkCopied ? <Check size={13} /> : <Copy size={13} />}
                {linkCopied ? "نُسخ" : "نسخ"}
              </button>
              <button onClick={copyWhatsAppMessage} style={btn("#34D399", "rgba(52,211,153,0.1)")}>
                <Copy size={13} /> رسالة واتساب
              </button>
            </div>
            {contract.signing_expires_at && (
              <div style={{ fontSize: 11, color: "#71717A", marginTop: 8 }}>
                ينتهي في: {new Date(contract.signing_expires_at).toLocaleDateString("ar-SA")}
              </div>
            )}
          </div>
        )}

        {/* Signatures status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <SigCard title="الطرف الأول" name={contract.party_first.name} sig={firstSigned}
            actionLabel={!firstSigned && contract.status !== "void" ? "وقّع كطرف أول" : null}
            onAction={() => setShowFirstPartySign(true)} />
          <SigCard title="الطرف الثاني" name={contract.party_second.name} sig={secondSigned}
            actionLabel={!secondSigned && contract.signing_token ? "(يوقّع عبر الرابط)" : null}
            onAction={null} />
        </div>

        {/* Hash badge */}
        {contract.final_hash && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={16} style={{ color: "#4ADE80" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#4ADE80" }}>عقد مُثبَّت بختم رقمي</div>
              <div style={{ fontSize: 10, color: "#71717A", direction: "ltr", marginTop: 2 }}>SHA-256: {contract.final_hash}</div>
            </div>
          </div>
        )}
      </div>

      {/* Contract body */}
      <div className="contract-print"
        style={{ background: "#FAFAFA", color: "#000", borderRadius: 12, padding: 32, direction: "rtl" }}>
        <div className="contract-body"
          dangerouslySetInnerHTML={{ __html: contract.body_html }}
          style={{ fontFamily: "'Tajawal', serif", fontSize: 14, lineHeight: 1.9 }} />

        {/* Signatures inline */}
        <div style={{ marginTop: 30, paddingTop: 20, borderTop: "1px dashed #999", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
          <SigInline label="توقيع الطرف الأول" sig={firstSigned} />
          <SigInline label="توقيع الطرف الثاني" sig={secondSigned} />
        </div>

        {contract.final_hash && (
          <div style={{ marginTop: 24, fontSize: 9, color: "#666", textAlign: "center", direction: "ltr", fontFamily: "monospace" }}>
            Digital Seal SHA-256: {contract.final_hash}<br />
            Finalized: {contract.finalized_at}
          </div>
        )}
      </div>

      <style>{`
        .contract-body h1 { font-size: 22px; font-weight: 800; margin: 16px 0 14px; }
        .contract-body h2 { font-size: 17px; font-weight: 700; margin: 16px 0 8px; color: #333; }
        .contract-body h3 { font-size: 15px; font-weight: 700; margin: 12px 0 6px; color: #555; }
        .contract-body p { margin: 8px 0; }
        .contract-body ul { margin: 8px 0; padding-inline-start: 24px; }
        .contract-body li { margin: 5px 0; }
        .contract-body strong { font-weight: 700; }
      `}</style>

      {/* First party signature modal */}
      {showFirstPartySign && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, maxWidth: 600, width: "100%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#E4E4E7", marginBottom: 14 }}>توقيع الطرف الأول — {contract.party_first.name}</h3>
            <SignaturePad
              onConfirm={handleFirstPartySignature}
              onCancel={() => setShowFirstPartySign(false)}
              busy={busy}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function btn(fg: string, bg: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
    background: bg, border: `1px solid ${fg}30`, color: fg,
    fontSize: 12, cursor: "pointer", fontFamily: "'Tajawal', sans-serif", fontWeight: 600,
  };
}

function SigCard({ title, name, sig, actionLabel, onAction }: {
  title: string; name?: string; sig?: Signature;
  actionLabel: string | null; onAction: (() => void) | null;
}) {
  return (
    <div style={{ padding: 14, background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11 }}>
      <div style={{ fontSize: 12, color: "#71717A", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 14, color: "#E4E4E7", fontWeight: 600, marginBottom: 8 }}>{name || "—"}</div>
      {sig ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={14} style={{ color: "#4ADE80" }} />
          <span style={{ fontSize: 11, color: "#4ADE80" }}>وقّع في {new Date(sig.signed_at).toLocaleDateString("ar-SA")}</span>
        </div>
      ) : actionLabel && onAction ? (
        <button onClick={onAction} style={btn("#C6914C", "rgba(198,145,76,0.1)")}>
          <FileSignature size={12} /> {actionLabel}
        </button>
      ) : actionLabel ? (
        <span style={{ fontSize: 11, color: "#71717A" }}>{actionLabel}</span>
      ) : (
        <span style={{ fontSize: 11, color: "#71717A" }}>لم يوقّع بعد</span>
      )}
    </div>
  );
}

function SigInline({ label, sig }: { label: string; sig?: Signature }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{label}</div>
      <div style={{ height: 80, border: "1px solid #ccc", borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {sig ? (
          <img src={sig.signature_data} alt="signature" style={{ maxHeight: 70, maxWidth: "100%" }} />
        ) : (
          <span style={{ fontSize: 11, color: "#999" }}>لم يوقّع</span>
        )}
      </div>
      {sig && (
        <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
          {sig.signer_name} — {new Date(sig.signed_at).toLocaleString("ar-SA")}
        </div>
      )}
    </div>
  );
}
