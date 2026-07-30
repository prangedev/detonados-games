"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { Trophy, User, Rss, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/search-bar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/components/notification-bell";
import { MoreMenu } from "@/components/more-menu";
import { Button } from "@/components/ui/button";
import { hasAtLeastRole } from "@/lib/roles";

export function Header() {
  const t = useTranslations("nav");
  const { data: session, status } = useSession();
  const isStaff = hasAtLeastRole(session?.user?.role, "MODERATOR");

  return (
    <header className="sticky top-0 z-40 border-b border-base-border bg-base/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center">
            <Image src="/logo.png" alt="Detonados Games" width={172} height={154} className="h-11 w-auto" priority />
          </Link>

          <div className="hidden flex-1 justify-center sm:flex">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/feed"
              className="hidden h-9 items-center gap-1.5 rounded-full border border-base-border px-3 text-xs text-ink-muted hover:border-ink-faint md:flex"
            >
              <Rss className="h-3.5 w-3.5" /> {t("feed")}
            </Link>
            <Link
              href="/leaderboard"
              className="hidden h-9 items-center gap-1.5 rounded-full border border-base-border px-3 text-xs text-ink-muted hover:border-ink-faint md:flex"
            >
              <Trophy className="h-3.5 w-3.5" /> {t("leaderboard")}
            </Link>
            {isStaff && (
              <Link
                href="/admin"
                className="hidden h-9 items-center gap-1.5 rounded-full border border-brand/40 px-3 text-xs text-brand hover:border-brand md:flex"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> {t("admin")}
              </Link>
            )}

            <LanguageSwitcher />
            <MoreMenu />
            <NotificationBell />

            {status === "authenticated" ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/profile"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-base-border bg-base-surface text-ink hover:border-ink-faint"
                  aria-label={t("profile")}
                >
                  <User className="h-4 w-4" />
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  {t("logout")}
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">{t("login")}</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="sm:hidden">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
