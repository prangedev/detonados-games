import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_LABELS, type PlatformType } from "@/lib/constants";

export function GameCard({
  slug,
  title,
  coverImage,
  platforms,
}: {
  slug: string;
  title: string;
  coverImage: string | null;
  platforms: PlatformType[];
}) {
  return (
    <Link
      href={`/games/${slug}`}
      className="group block overflow-hidden rounded-xl border border-base-border bg-base-surface transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-glow"
    >
      <div className="relative aspect-[460/215] w-full overflow-hidden bg-base-raised">
        {coverImage ? (
          <>
            <Image
              src={coverImage}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="scale-110 object-cover opacity-40 blur-xl"
            />
            <Image
              src={coverImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-ink-faint">
            {title}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="mb-2 truncate font-display text-sm font-semibold text-ink">{title}</h3>
        <div className="flex flex-wrap gap-1">
          {platforms.slice(0, 3).map((p) => (
            <Badge key={p}>{PLATFORM_LABELS[p]}</Badge>
          ))}
          {platforms.length > 3 && <Badge>+{platforms.length - 3}</Badge>}
        </div>
      </div>
    </Link>
  );
}
