"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import {
  FileSignature, Plus, Search, RefreshCw, AlertCircle,
  CheckCircle2, Clock, XCircle, Send, Edit3,
} from "lucide-react";

type EContract = {
  id: string;
  contract_number: string | null;
  title: string;
  category: string;
  status: string;
  amount: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  party_first: { name?: string };
  party_second: { name?: string };
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  draft:               { label: "مسودة",        color: "#A1A1AA", bg: "rgba(161,161,170,0.10)", icon: Edit3        },
  sent_for_signature:  { label: "بانتظار التوقيع", color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  icon: Send         },
  partially_signed:    { label: "وُقّع جزئياً",    color: "#E8B86D", bg: "rgba(232,184,109,0.10)", icon: Clock        },
  signed:              { label: "موقَّع",         color: "#4ADE80", bg: "rgba(74,222,128,0.10)",  icon: CheckCircle2 },
  expired:             { label: "منتهي",          color: "#71717A", bg: "rgba(113,113,122,0.10)", icon: XCircle      },
  void:                { label: "ملغي",           color: "#F87171", bg: "rgba(239,68,68,0.10)",   icon: XCircle      },
};

const CATEGORY_LABEL: Record<string, string> = {
  rent: "إيجار", sale: "بيع", listing: "حصر",
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<EContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const { data, error: e } = await supabase
        .from("e_contracts")
        .select("id, contract_number, title, category, status, amount, start_date, end_date, created_at, party_first, party_second")
        .order("created_at", { ascending: false });
      if (e) throw new Error(e.message);
      setContracts((data || []) as EContract[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ في التحميل");
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contracts.filter(c => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.contract_number || "").toLowerCase().includes(q) ||
        (c.party_first?.name || "").toLowerCase().includes(q) ||
        (c.party_second?.name || "").toLowerCase().includes(q)
      );
    });
  }, [contracts, query, statusFilter, categoryFilter]);

  const counts = useMemo(() => {
    return contracts.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [contracts]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <FileSignature size={20} style={{ color: "#C6914C" }} /> العقود الإلكترونية
          </h1>
          <p style={{ fontSize: 13, color: "#71717A" }}>
            {loading ? "..." : `${filtered.length} من ${contracts.length}`} عقد
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#A1A1AA", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            تحديث
          </button>
          <Link href="/dashboard/contracts/new"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, background: "linear-gradient(135deg, #C6914C, #8A5F2E)", color: "#0A0A0C", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            <Plus size={14} /> عقد جديد
          </Link>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Status strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginBottom: 16 }}>
        {Object.entries(STATUS_META).map(([key, m]) => {
          const Icon = m.icon;
          const count = counts[key] || 0;
          return (
            <button key={key} onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
              style={{
                background: statusFilter === key ? m.bg : "#0F0F12",
                border: `1px solid ${statusFilter === key ? m.color + "55" : "rgba(255,255,255,0.05)"}`,
                borderRadius: 11, padding: "10px 12px", cursor: "pointer", textAlign: "right",
                fontFamily: "'Tajawal', sans-serif",
              }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <Icon size={13} style={{ color: m.color }} />
                <span style={{ fontSize: 18, fontWeight: 800, color: "#F4F4F5" }}>{count}</span>
              </div>
              <div style={{ fontSize: 11, color: "#71717A" }}>{m.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#52525B" }} />
          <input
            placeholder="بحث برقم العقد، العنوان، أو اسم الطرف..."
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ width: "100%", padding: "10px 36px 10px 14px", background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif", outline: "none" }} />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: "10px 12px", background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif", outline: "none", cursor: "pointer" }}>
          <option value="all">كل الفئات</option>
          <option value="rent">إيجار</option>
          <option value="sale">بيع</option>
          <option value="listing">حصر</option>
        </select>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle size={14} style={{ color: "#F87171" }} />
          <span style={{ fontSize: 13, color: "#F87171" }}>{error}</span>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
            <thead>
              <tr style={{ background: "#141418", color: "#71717A", textAlign: "right" }}>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>الرقم</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>العقد</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>الفئة</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>الأطراف</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12, textAlign: "center" }}>القيمة</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>الحالة</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td colSpan={7} style={{ padding: 12 }}>
                      <div style={{ height: 24, background: "#1C1C1E", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
                      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#52525B" }}>
                    {contracts.length === 0 ? (
                      <div>
                        <FileSignature size={32} style={{ color: "#3F3F46", marginBottom: 10 }} />
                        <div style={{ fontSize: 14, color: "#A1A1AA", marginBottom: 4 }}>لا توجد عقود بعد</div>
                        <div style={{ fontSize: 12, marginBottom: 14 }}>ابدأ بعقد جديد من قالب جاهز</div>
                        <Link href="/dashboard/contracts/new"
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(198,145,76,0.1)", border: "1px solid rgba(198,145,76,0.3)", color: "#C6914C", fontSize: 13, textDecoration: "none" }}>
                          <Plus size={13} /> إنشاء أول عقد
                        </Link>
                      </div>
                    ) : "لا نتائج مطابقة"}
                  </td>
                </tr>
              ) : (
                filtered.map(c => {
                  const sm = STATUS_META[c.status] || STATUS_META.draft;
                  return (
                    <tr key={c.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                      <td style={{ padding: "11px 14px" }}>
                        <Link href={`/dashboard/contracts/${c.id}`} style={{ color: "#C6914C", fontSize: 12, direction: "ltr", display: "inline-block", fontWeight: 600 }}>
                          {c.contract_number || c.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <Link href={`/dashboard/contracts/${c.id}`} style={{ color: "#E4E4E7", fontWeight: 500 }}>
                          {c.title}
                        </Link>
                      </td>
                      <td style={{ padding: "11px 14px", color: "#A1A1AA", fontSize: 12 }}>
                        {CATEGORY_LABEL[c.category] || c.category}
                      </td>
                      <td style={{ padding: "11px 14px", color: "#A1A1AA", fontSize: 12 }}>
                        {(c.party_first?.name || "—")} ↔ {(c.party_second?.name || "—")}
                      </td>
                      <td style={{ padding: "11px 14px", textAlign: "center", color: "#E4E4E7", fontWeight: 600 }}>
                        {c.amount ? `${Number(c.amount).toLocaleString("en-US")} ر.س` : "—"}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: sm.color, background: sm.bg, padding: "3px 9px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <sm.icon size={11} /> {sm.label}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", color: "#71717A", fontSize: 11, whiteSpace: "nowrap" }}>
                        {new Date(c.created_at).toLocaleDateString("ar-SA")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
