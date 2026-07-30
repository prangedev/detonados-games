import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { getThemeAccent } from "@/lib/site-settings";
import { hexToRgbChannels } from "@/lib/utils";
import "../globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Detonados Games",
  description: "Detonados, requisitos e compatibilidade de hardware para os jogos mais jogados.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  // Cor de destaque configurada pelo administrador em /admin/settings.
  // Sem customização, cai no valor padrão já definido em globals.css.
  const themeAccent = await getThemeAccent().catch(() => null);
  const rgbChannels = themeAccent ? hexToRgbChannels(themeAccent) : null;

  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        {rgbChannels && (
          <style dangerouslySetInnerHTML={{ __html: `:root { --color-brand: ${rgbChannels}; }` }} />
        )}
      </head>
      <body className="min-h-screen bg-base bg-hud">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
