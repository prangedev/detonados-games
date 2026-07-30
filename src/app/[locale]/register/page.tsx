"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useRouter, Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      setError(true);
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    router.push("/profile");
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <Image src="/logo.png" alt="Detonados Games" width={172} height={154} className="mx-auto h-16 w-auto" />
      <h1 className="text-center font-display text-xl font-bold text-ink">{t("registerTitle")}</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-ink-faint">{t("name")}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-faint">{t("email")}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-faint">{t("password")}</label>
          <Input
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-xs text-danger">{t("registerError")}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {t("registerButton")}
        </Button>
      </form>
      <p className="text-center text-sm text-ink-muted">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-brand hover:underline">
          {t("loginButton")}
        </Link>
      </p>
    </div>
  );
}
