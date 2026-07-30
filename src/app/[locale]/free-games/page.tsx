import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { fetchFreeGameOffers } from "@/lib/free-games";
import { Badge } from "@/components/ui/badge";

export default async function FreeGamesPage() {
  const t = await getTranslations("freeGames");
  const offers = await fetchFreeGameOffers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
      </div>

      {offers.length === 0 ? (
        <p className="text-sm text-ink-faint">{t("noOffers")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <a
              key={offer.id}
              href={offer.openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-xl border border-base-border bg-base-surface transition-colors hover:border-brand"
            >
              <div className="relative aspect-[460/215] w-full overflow-hidden bg-base-raised">
                {offer.thumbnail && (
                  <Image
                    src={offer.thumbnail}
                    alt={offer.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-3">
                <div className="mb-1.5 flex flex-wrap gap-1.5">
                  <Badge>{offer.store}</Badge>
                  {offer.worth && offer.worth !== "N/A" && <Badge>{offer.worth}</Badge>}
                </div>
                <h3 className="mb-1 line-clamp-1 font-display text-sm font-semibold text-ink">
                  {offer.title}
                </h3>
                {offer.endDate && offer.endDate !== "N/A" && (
                  <p className="font-mono text-[11px] text-ink-faint">
                    {t("endsOn")} {offer.endDate}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      <p className="font-mono text-[10px] text-ink-faint">{t("source")}</p>
    </div>
  );
}
