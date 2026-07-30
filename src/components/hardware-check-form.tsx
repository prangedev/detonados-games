"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KNOWN_CPUS, KNOWN_GPUS } from "@/lib/hardware-compat";
import type { HardwareVerdict } from "@/lib/constants";

interface Props {
  gameId: string;
}

interface CheckResponse {
  verdict: HardwareVerdict;
  notes: string[];
}

const VERDICT_STYLES: Record<HardwareVerdict, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  GOOD: { icon: CheckCircle2, color: "text-mint", bg: "bg-mint/10 border-mint/40" },
  WARNING: { icon: AlertTriangle, color: "text-warn", bg: "bg-warn/10 border-warn/40" },
  BAD: { icon: XCircle, color: "text-danger", bg: "bg-danger/10 border-danger/40" },
};

export function HardwareCheckForm({ gameId }: Props) {
  const t = useTranslations("hardware");
  const [cpu, setCpu] = useState("");
  const [gpu, setGpu] = useState("");
  const [ramGb, setRamGb] = useState(8);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/hardware-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, cpu, gpu, ramGb }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-base-border bg-base-surface p-4">
      <h3 className="mb-3 font-display text-sm font-semibold text-ink">{t("title")}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            {t("cpuLabel")}
          </label>
          <Input list="cpu-options" value={cpu} onChange={(e) => setCpu(e.target.value)} required />
          <datalist id="cpu-options">
            {KNOWN_CPUS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            {t("gpuLabel")}
          </label>
          <Input list="gpu-options" value={gpu} onChange={(e) => setGpu(e.target.value)} required />
          <datalist id="gpu-options">
            {KNOWN_GPUS.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            {t("ramLabel")}
          </label>
          <Input
            type="number"
            min={1}
            max={256}
            value={ramGb}
            onChange={(e) => setRamGb(Number(e.target.value))}
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "..." : t("checkButton")}
        </Button>
      </form>

      {result && (
        <div className={cn("mt-4 flex gap-3 rounded-lg border p-3", VERDICT_STYLES[result.verdict].bg)}>
          {(() => {
            const Icon = VERDICT_STYLES[result.verdict].icon;
            return <Icon className={cn("h-5 w-5 shrink-0", VERDICT_STYLES[result.verdict].color)} />;
          })()}
          <div>
            <p className={cn("font-display text-sm font-semibold", VERDICT_STYLES[result.verdict].color)}>
              {result.verdict === "GOOD" && t("verdictGood")}
              {result.verdict === "WARNING" && t("verdictWarning")}
              {result.verdict === "BAD" && t("verdictBad")}
            </p>
            <p className="text-xs text-ink-muted">
              {result.verdict === "GOOD" && t("verdictGoodDesc")}
              {result.verdict === "WARNING" && t("verdictWarningDesc")}
              {result.verdict === "BAD" && t("verdictBadDesc")}
            </p>
          </div>
        </div>
      )}
      <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-faint">{t("disclaimer")}</p>
    </div>
  );
}
