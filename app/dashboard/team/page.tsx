"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Crown,
  Shield,
  User,
  Eye,
  Mail,
  Clock,
  CheckCircle2,
  X,
  Copy,
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
  owner: {
    label: "المالك",
    icon: Crown,
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  },
  admin: { label: "مدير", icon: Shield, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  member: {
    label: "عضو",
    icon: User,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  viewer: {
    label: "مشاهد",
    icon: Eye,
    color: "text-[var(--text-faint)] bg-slate-500/10 border-slate-500/30",
  },
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string>("member");
  const [plan, setPlan] = useState<string>("free");
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", role: "member" });
  const [submitting, setSubmitting] = useState(false);

  const PLAN_LIMITS: Record<string, number> = { free: 1, basic: 3, pro: 10 };
  const maxMembers = PLAN_LIMITS[plan] ?? 1;

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // resolve tenant + role
    let tenantId: string | null = null;
    let role: string = "member";

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, plan")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (tenant) {
      tenantId = tenant.id;
      role = "owner";
      setPlan(tenant.plan || "free");
    } else {
      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      tenantId = membership?.tenant_id || null;
      role = membership?.role || "member";
      if (tenantId) {
        const { data: t } = await supabase
          .from("tenants")
          .select("plan")
          .eq("id", tenantId)
          .maybeSingle();
        setPlan(t?.plan || "free");
      }
    }

    setMyRole(role);

    if (!tenantId) {
      setLoading(false);
      return;
    }

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
      toast.success(
        data.member?.status === "active"
          ? "تم إضافة العضو مباشرة (لديه حساب)"
          : "تم إرسال الدعوة — سيصير عضواً بعد تسجيله بنفس البريد"
      );
      setShowInvite(false);
      setForm({ email: "", full_name: "", role: "member" });
      loadAll();
    }
    setSubmitting(false);
  }

  function copyInviteMessage(m: Member) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const roleLabel = ROLE_CONFIG[m.role]?.label || m.role;
    const msg = `السلام عليكم ${m.full_name || ""}\n\nتم دعوتك للانضمام لفريقنا في منصة وسيط برو بصلاحية: ${roleLabel}.\n\nسجّل باستخدام هذا البريد:\n${m.email}\n\nرابط التسجيل:\n${origin}/login\n\nبعد التسجيل، ستصبح عضواً نشطاً في الفريق تلقائياً.`;
    navigator.clipboard.writeText(msg).then(() => toast.success("تم نسخ رسالة الدعوة"));
  }

  async function handleDelete(member: Member) {
    if (member.role === "owner") {
      toast.error("لا يمكن حذف المالك");
      return;
    }
    if (!confirm(`حذف ${member.email} من الفريق؟`)) return;

    const res = await fetch(`/api/team/invite?id=${member.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) toast.error(data.error || "فشل الحذف");
    else {
      toast.success("تم الحذف");
      loadAll();
    }
  }

  const canManage = ["owner", "admin"].includes(myRole);
  const activeCount = members.filter((m) => m.status === "active").length;
  const pendingCount = members.filter((m) => m.status === "invited").length;
  const totalCount = activeCount + pendingCount;
  const atLimit = totalCount >= maxMembers;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-strong)]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "الفريق" }]} />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Users className="h-7 w-7 text-blue-400" />
              إدارة الفريق
            </h1>
            <p className="mt-1 text-sm text-[var(--text-faint)]">
              ادعُ أعضاء لإدارة الحساب معك بأدوار مختلفة
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setShowInvite(true)}
              disabled={atLimit}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              <UserPlus className="h-4 w-4" />
              دعوة عضو
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-4">
            <div className="text-2xl font-bold text-emerald-400">{activeCount}</div>
            <div className="text-xs text-[var(--text-faint)]">نشط</div>
          </div>
          <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-4">
            <div className="text-2xl font-bold text-[var(--gold-1)]">{pendingCount}</div>
            <div className="text-xs text-[var(--text-faint)]">بانتظار التسجيل</div>
          </div>
          <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-4">
            <div className="text-2xl font-bold text-blue-400">
              {totalCount} / {maxMembers}
            </div>
            <div className="text-xs text-[var(--text-faint)]">مستخدَم / متاح</div>
          </div>
          <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-4">
            <div className="text-2xl font-bold text-[var(--text-strong)] uppercase">{plan}</div>
            <div className="text-xs text-[var(--text-faint)]">الخطة الحالية</div>
          </div>
        </div>

        {atLimit && canManage && (
          <div className="mb-6 rounded-xl border border-[var(--gold-bg-hover)] bg-amber-950/30 p-4 text-sm text-amber-200">
            وصلت للحد الأقصى لأعضاء خطتك ({maxMembers}).{" "}
            <a href="/dashboard/subscription" className="font-medium underline">
              رقّ الخطة
            </a>{" "}
            لإضافة المزيد.
          </div>
        )}

        {/* Members list */}
        {loading ? (
          <div className="py-12 text-center text-[var(--text-faint)]">جاري التحميل...</div>
        ) : members.length === 0 ? (
          <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-12 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-slate-600" />
            <p className="text-[var(--text-faint)]">لا يوجد أعضاء بعد</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)]">
            {members.map((m) => {
              const cfg = ROLE_CONFIG[m.role];
              const Icon = cfg.icon;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-4 border-b border-[var(--gold-bg)] p-4 transition last:border-0 hover:bg-[var(--bg-surface-2)]/30"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border ${cfg.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{m.full_name || m.email.split("@")[0]}</span>
                      <span className={`rounded border px-2 py-0.5 text-xs ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {m.status === "invited" && (
                        <span className="flex items-center gap-1 rounded border border-[var(--gold-bg-hover)] bg-[var(--gold-2)]/10 px-2 py-0.5 text-xs text-[var(--gold-1)]">
                          <Clock className="h-3 w-3" />
                          بانتظار التسجيل
                        </span>
                      )}
                      {m.status === "active" && (
                        <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          نشط
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-[var(--text-faint)]">
                      <Mail className="h-3 w-3" />
                      {m.email}
                    </div>
                  </div>

                  <div className="hidden text-left text-xs text-[var(--text-faint)] md:block">
                    <div>دعوة: {fmtDate(m.invited_at)}</div>
                    {m.activated_at && <div>نشّط: {fmtDate(m.activated_at)}</div>}
                  </div>

                  {canManage && m.status === "invited" && (
                    <button
                      onClick={() => copyInviteMessage(m)}
                      className="rounded-lg p-2 text-blue-400 transition hover:bg-blue-500/10"
                      title="نسخ رسالة الدعوة"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  {canManage && m.role !== "owner" && (
                    <button
                      onClick={() => handleDelete(m)}
                      className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Role explainer */}
        <div className="mt-6 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)]/50 p-5">
          <h3 className="mb-3 font-semibold text-[var(--text-strong)]">الأدوار والصلاحيات</h3>
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="flex items-start gap-2">
              <Crown className="mt-0.5 h-4 w-4 text-yellow-400" />
              <div>
                <b className="text-yellow-400">المالك:</b>{" "}
                <span className="text-[var(--text-faint)]">
                  كامل الصلاحيات + الفوترة + حذف الحساب
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 text-blue-400" />
              <div>
                <b className="text-blue-400">مدير:</b>{" "}
                <span className="text-[var(--text-faint)]">كل شي ماعدا الفوترة وحذف الحساب</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 text-emerald-400" />
              <div>
                <b className="text-emerald-400">عضو:</b>{" "}
                <span className="text-[var(--text-faint)]">إدارة العقارات/العملاء/الصفقات</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Eye className="mt-0.5 h-4 w-4 text-[var(--text-faint)]" />
              <div>
                <b className="text-[var(--text-faint)]">مشاهد:</b>{" "}
                <span className="text-[var(--text-faint)]">قراءة فقط — لا يعدّل أو يحذف</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowInvite(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <UserPlus className="h-5 w-5 text-blue-400" />
                دعوة عضو جديد
              </h2>
              <button
                onClick={() => setShowInvite(false)}
                className="rounded p-1 hover:bg-[var(--bg-surface-2)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  الاسم (اختياري)
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="محمد أحمد"
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">الدور</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="admin">مدير — كل الصلاحيات ماعدا الفوترة</option>
                  <option value="member">عضو — إدارة العمل اليومي</option>
                  <option value="viewer">مشاهد — قراءة فقط</option>
                </select>
              </div>

              <div className="rounded-lg border border-blue-500/30 bg-blue-950/30 p-3 text-xs text-blue-200">
                💡 إذا كان المستخدم مسجّل أصلاً بنفس البريد، يصير عضواً مباشرة. لو جديد، يتم تفعيله
                تلقائياً بمجرد ما يسجّل بنفس البريد.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 rounded-lg bg-[var(--bg-surface-2)] px-4 py-2 transition hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium transition hover:bg-blue-500 disabled:bg-slate-700"
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
