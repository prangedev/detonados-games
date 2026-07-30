import { getTranslations } from "next-intl/server";
import { FaqAccordion } from "@/components/faq-accordion";

export default async function FaqPage() {
  const t = await getTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
      </div>
      <FaqAccordion items={items} />
    </div>
  );
}
