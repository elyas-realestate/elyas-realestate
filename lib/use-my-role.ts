"use client";
import { useState, useEffect } from "react";
import { supabase } from "./supabase-browser";

export type Role = "owner" | "admin" | "member" | "viewer" | "none";

export const ROLE_LABELS: Record<Role, string> = {
  owner:  "المالك",
  admin:  "مدير",
  member: "عضو",
  viewer: "مشاهد",
  none:   "—",
};

// صلاحيات كل دور
export const PERMS = {
  canManageBilling:    (r: Role) => r === "owner",
  canManageTeam:       (r: Role) => r === "owner" || r === "admin",
  canEditData:         (r: Role) => r === "owner" || r === "admin" || r === "member",
  canDeleteData:       (r: Role) => r === "owner" || r === "admin",
  canViewAuditLog:     (r: Role) => r === "owner" || r === "admin",
  canManageSettings:   (r: Role) => r === "owner" || r === "admin",
  isReadOnly:          (r: Role) => r === "viewer" || r === "none",
};

export function useMyRole(): { role: Role; loading: boolean } {
  const [role, setRole] = useState<Role>("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resolve();
  }, []);

  async function resolve() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRole("none"); setLoading(false); return; }

    // Owner check first (fast path)
    const { data: tenant } = await supabase
      .from("tenants").select("id").eq("owner_id", user.id).maybeSingle();

    if (tenant) { setRole("owner"); setLoading(false); return; }

    const { data: member } = await supabase
      .from("tenant_members").select("role")
      .eq("user_id", user.id).eq("status", "active").maybeSingle();

    setRole((member?.role as Role) || "none");
    setLoading(false);
  }

  return { role, loading };
}
