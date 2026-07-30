import type { ParsedRequirements } from "@/lib/hardware-compat";

interface Labels {
  os: string;
  processor: string;
  memory: string;
  graphics: string;
  storage: string;
}

export function RequirementsTable({
  title,
  req,
  labels,
}: {
  title: string;
  req: ParsedRequirements | null;
  labels: Labels;
}) {
  if (!req) return null;

  const rows: [string, string | number | undefined][] = [
    [labels.os, req.os],
    [labels.processor, req.cpu],
    [labels.memory, req.ramGb ? `${req.ramGb} GB` : undefined],
    [labels.graphics, req.gpu],
    [labels.storage, req.storageGb ? `${req.storageGb} GB` : undefined],
  ];

  const visibleRows = rows.filter(([, value]) => value);
  if (visibleRows.length === 0) return null;

  return (
    <div className="rounded-xl border border-base-border bg-base-surface p-4">
      <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-ink-faint">{title}</h3>
      <dl className="space-y-2 font-mono text-xs">
        {visibleRows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-base-border/50 pb-1.5">
            <dt className="text-ink-faint">&gt; {label}</dt>
            <dd className="text-right text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
