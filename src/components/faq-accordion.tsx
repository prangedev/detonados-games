"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-base-border rounded-xl border border-base-border bg-base-surface">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
          >
            <span className="font-display text-sm font-semibold text-ink">{item.q}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-ink-faint transition-transform",
                openIndex === i && "rotate-180"
              )}
            />
          </button>
          {openIndex === i && (
            <div className="px-4 pb-4 text-sm leading-relaxed text-ink-muted">{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}
