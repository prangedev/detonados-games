"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useRouter, Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError(true);
      return;
    }
    router.push("/profile");
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <Image src="/logo.png" alt="Detona Games" width={172} height={154} className="mx-auto h-16 w-auto" />
      <h1 className="text-center font-display text-xl font-bold text-ink">{t("loginTitle")}</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-ink-faint">{t("email")}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-faint">{t("password")}</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-xs text-danger">{t("error")}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {t("loginButton")}
        </Button>
      </form>
      <p className="text-center text-sm text-ink-muted">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-brand hover:underline">
          {t("registerButton")}
        </Link>
      </p>
    </div>
  );
}
