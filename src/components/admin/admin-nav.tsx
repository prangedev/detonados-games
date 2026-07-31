import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const t = await getTranslations("admin");

  const links = [
    { href: "/admin", label: t("navDashboard") },
    { href: "/admin/games", label: t("navGames") },
    { href: "/admin/detonados", label: t("navDetonados") },
    { href: "/admin/comments", label: t("navComments") },
    ...(isAdmin
      ? [
          { href: "/admin/users", label: t("navUsers") },
          { href: "/admin/settings", label: t("navSettings") },
        ]
      : []),
  ];

  return (
    <div className="flex flex-wrap gap-2 border-b border-base-border pb-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border border-base-border bg-base-surface px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-muted transition-colors hover:border-brand hover:text-brand"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
