"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Crown, Bot, ChevronLeft, FileText, Network } from "lucide-react";

type Manager = { id: string; code: string; name: string; department: string; default_ai_provider: string; default_ai_model: string; tenant_enabled: boolean };
type Employee = { id: string; code: string; name: string; manager_id: string | null; manager_name: string | null; default_ai_provider: string; default_ai_model: string; tenant_enabled: boolean };

export default function AssistantsTab() {
  const [data, setData] = useState<{ managers: Manager[]; employees: Employee[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/operations/status").then(r => r.json()).then(d => {
      setData({ managers: d.managers || [], employees: d.employees || [] });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} /></div>;
  }

  const managers = data?.managers || [];
  const employees = data?.employees || [];

  return (
    <div className="space-y-5">
      <div className="text-sm" style={{ color: "var(--text-faint)" }}>
        هرم المنظومة: ٥ مدراء + ١٦ مساعداً. كل مساعد يتبع مديره. اضغط لفتح التفاصيل والتوجيهات.
      </div>

      {/* Managers */}
      <div className="space-y-3">
        {managers.map(m => {
          const team = employees.filter(e => e.manager_id === m.id);
          return (
            <div key={m.id} className="rounded-xl p-4" style={{
              background: "var(--bg-surface-1)",
              border: `1px solid ${m.tenant_enabled ? "var(--gold-2)" : "var(--gold-bg)"}`,
            }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: m.tenant_enabled ? "var(--success)" : "var(--text-faint)" }} />
                  <Crown size={16} style={{ color: "var(--gold-2)" }} />
                  <h3 className="font-bold text-sm" style={{ color: "var(--text-strong)" }}>{m.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-surface-2)", color: "var(--text-faint)" }}>
                    {m.department}
                  </span>
                </div>
                <Link href={`/dashboard/organization/manager/${m.id}`}
                  className="text-xs flex items-center gap-1 no-underline"
                  style={{ color: "var(--gold-2)" }}>
                  التفاصيل <ChevronLeft size={12} />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {team.map(e => (
                  <Link key={e.id} href={`/dashboard/organization/employee/${e.id}`}
                    className="flex items-center justify-between rounded-lg p-2.5 no-underline transition"
                    style={{
                      background: e.tenant_enabled ? "var(--gold-bg)" : "var(--bg-surface-2)",
                      border: `1px solid ${e.tenant_enabled ? "var(--gold-2)" : "var(--gold-bg-soft)"}`,
                    }}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: e.tenant_enabled ? "var(--success)" : "var(--text-faint)" }} />
                      <Bot size={12} style={{ color: "var(--text-soft)" }} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: "var(--text-strong)" }}>{e.name}</div>
                        <div className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{e.default_ai_provider}/{e.default_ai_model}</div>
                      </div>
                    </div>
                    <ChevronLeft size={12} style={{ color: "var(--text-faint)" }} />
                  </Link>
                ))}
                {team.length === 0 && (
                  <div className="text-xs col-span-2 py-3 text-center" style={{ color: "var(--text-faint)" }}>
                    لا يوجد مساعدون مرتبطون بهذا المدير
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link href="/dashboard/organization" className="flex items-center gap-2 p-3 rounded-lg no-underline"
          style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
          <Network size={16} style={{ color: "var(--gold-2)" }} />
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>الهرم الكامل</div>
            <div className="text-xs" style={{ color: "var(--text-faint)" }}>عرض المنظومة بتفاصيلها</div>
          </div>
        </Link>
        <Link href="/dashboard/ceo" className="flex items-center gap-2 p-3 rounded-lg no-underline"
          style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
          <FileText size={16} style={{ color: "var(--gold-2)" }} />
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>مراجعات المدراء اليومية</div>
            <div className="text-xs" style={{ color: "var(--text-faint)" }}>ماذا قال كل مدير عن فريقه أمس</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
