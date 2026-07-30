"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ROLES, type RoleType } from "@/lib/roles";

const ROLE_KEY: Record<RoleType, string> = {
  USER: "roleUser",
  MODERATOR: "roleModerator",
  ADMIN: "roleAdmin",
};

export function RoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    setSaving(true);
    const previous = role;
    setRole(next);
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    if (!res.ok) {
      setRole(previous);
    } else {
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <select
      value={role}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className="h-8 rounded-lg border border-base-border bg-base-surface px-2 text-xs text-ink outline-none focus:border-brand"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {t(ROLE_KEY[r])}
        </option>
      ))}
    </select>
  );
}
