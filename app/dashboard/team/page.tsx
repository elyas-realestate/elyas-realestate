"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import {
  Users, UserPlus, Trash2, Crown, Shield, User, Eye,
  Mail, Clock, CheckCircle2, X,
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";

type Member = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  status: "invited" | "active" | "removed";
  invited_at: string | null;
  activated_at: string | null;
  last_seen_at: string | null;
};

const ROLE_CONFIG: Record<Member["role"], { label: string; icon: any; color: string }> = {
  owner:  { label: "المالك",   icon: Crown,  color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
  admin:  { label: "مدير",     icon: Shield, color: "text-blue-400 bg-blue-500/10 border-blue-500/30"     },
  member: { label: "عضو",      icon: User,   color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  viewer: { label: "مشاهد",    icon: Eye,    color: "text-slate-400 bg-slate-500/10 border-slate-500/30"    },
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole]   = useState<string>("member");
  const [plan, setPlan]       = useState<string>("free");
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", role: "member" });
  const [submitting, setSubmitting] = useState(false);

  const PLAN_LIMITS: Record<string, number> = { free: 1, basic: 3, pro: 10 };
  const maxMembers = PLAN_LIMITS[plan] ?? 1;

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // resolve tenant + role
    let tenantId: string | null = null;
    let role: string = "member";

    const { data: tenant } = await supabase
      .from("tenants").select("id, plan").eq("owner_id", user.id).maybeSingle();

    if (tenant) {
      tenantId = tenant.id;
      role = "owner";
      setPlan(tenant.plan || "free");
    } else {
      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("user_id", user.id).eq("status", "active").maybeSingle();
      tenantId = membership?.tenant_id || null;
      role = membership?.role || "member";
      if (tenantId) {
        const { data: t } = await supabase.from("tenants").select("plan").eq("id", tenantId).maybeSingle();
        setPlan(t?.plan || "free");
      }
    }

    setMyRole(role);

    if (!tenantId) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("tenant_members")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("status", ["invited", "active"])
      .order("role", { ascending: true })
      .order("invited_at", { ascending: false });

    if (error) toast.error("فشل تحميل الأعضاء: " + error.message);
    else setMembers((data || []) as Member[]);

    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) return;
    setSubmitting(true);

    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "فشل إرسال الدعوة");
    } else {
      toast.success(data.member?.status === "active"
        ? "تم إضافة العضو مباشرة (لديه حساب)"
        : "تم إرسال الدعوة — سيصير عضواً بعد تسجيله بنفس البريد"
      );
      setShowInvite(false);
      setForm({ email: "", full_name: "", role: "member" });
      loadAll();
    }
    setSubmitting(false);
  }

  async function handleDelete(member: Member) {
    if (member.role === "owner") { toast.error("لا يمكن حذف المالك"); return; }
    if (!confirm(`حذف ${member.email} من الفريق؟`)) return;

    const res = await fetch(`/api/team/invite?id=${member.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) toast.error(data.error || "فشل الحذف");
    else { toast.success("تم الحذف"); loadAll(); }
  }

  const canManage = ["owner", "admin"].includes(myRole);
  const activeCount = members.filter(m => m.status === "active").length;
  const pendingCount = members.filter(m => m.status === "invited").length;
  const totalCount = activeCount + pendingCount;
  const atLimit = totalCount >= maxMembers;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "الفريق" }]} />

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-400" />
              إدارة الفريق
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              ادعُ أعضاء لإدارة الحساب معك بأدوار مختلفة
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setShowInvite(true)}
              disabled={atLimit}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition"
            >
              <UserPlus className="w-4 h-4" />
              دعوة عضو
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-400">{activeCount}</div>
            <div className="text-xs text-slate-400">نشط</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
            <div className="text-xs text-slate-400">بانتظار التسجيل</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-400">{totalCount} / {maxMembers}</div>
            <div className="text-xs text-slate-400">مستخدَم / متاح</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-slate-200 uppercase">{plan}</div>
            <div className="text-xs text-slate-400">الخطة الحالية</div>
          </div>
        </div>

        {atLimit && canManage && (
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 mb-6 text-amber-200 text-sm">
            وصلت للحد الأقصى لأعضاء خطتك ({maxMembers}). <a href="/dashboard/subscription" className="underline font-medium">رقّ الخطة</a> لإضافة المزيد.
          </div>
        )}

        {/* Members list */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">جاري التحميل...</div>
        ) : members.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">لا يوجد أعضاء بعد</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {members.map((m) => {
              const cfg = ROLE_CONFIG[m.role];
              const Icon = cfg.icon;
              return (
                <div key={m.id} className="flex items-center gap-4 p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${cfg.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{m.full_name || m.email.split("@")[0]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${cfg.color}`}>{cfg.label}</span>
                      {m.status === "invited" && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          بانتظار التسجيل
                        </span>
                      )}
                      {m.status === "active" && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          نشط
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" />
                      {m.email}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 text-left hidden md:block">
                    <div>دعوة: {fmtDate(m.invited_at)}</div>
                    {m.activated_at && <div>نشّط: {fmtDate(m.activated_at)}</div>}
                  </div>

                  {canManage && m.role !== "owner" && (
                    <button
                      onClick={() => handleDelete(m)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Role explainer */}
        <div className="mt-6 bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3 text-slate-200">الأدوار والصلاحيات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2"><Crown className="w-4 h-4 text-yellow-400 mt-0.5" /><div><b className="text-yellow-400">المالك:</b> <span className="text-slate-400">كامل الصلاحيات + الفوترة + حذف الحساب</span></div></div>
            <div className="flex items-start gap-2"><Shield className="w-4 h-4 text-blue-400 mt-0.5" /><div><b className="text-blue-400">مدير:</b> <span className="text-slate-400">كل شي ماعدا الفوترة وحذف الحساب</span></div></div>
            <div className="flex items-start gap-2"><User className="w-4 h-4 text-emerald-400 mt-0.5" /><div><b className="text-emerald-400">عضو:</b> <span className="text-slate-400">إدارة العقارات/العملاء/الصفقات</span></div></div>
            <div className="flex items-start gap-2"><Eye className="w-4 h-4 text-slate-400 mt-0.5" /><div><b className="text-slate-400">مشاهد:</b> <span className="text-slate-400">قراءة فقط — لا يعدّل أو يحذف</span></div></div>
          </div>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowInvite(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                دعوة عضو جديد
              </h2>
              <button onClick={() => setShowInvite(false)} className="p-1 hover:bg-slate-800 rounded"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">البريد الإلكتروني *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">الاسم (اختياري)</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="محمد أحمد"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">الدور</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                >
                  <option value="admin">مدير — كل الصلاحيات ماعدا الفوترة</option>
                  <option value="member">عضو — إدارة العمل اليومي</option>
                  <option value="viewer">مشاهد — قراءة فقط</option>
                </select>
              </div>

              <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200">
                💡 إذا كان المستخدم مسجّل أصلاً بنفس البريد، يصير عضواً مباشرة. لو جديد، يتم تفعيله تلقائياً بمجرد ما يسجّل بنفس البريد.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 px-4 py-2 rounded-lg font-medium transition"
                >
                  {submitting ? "جارٍ الإرسال..." : "إرسال الدعوة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
