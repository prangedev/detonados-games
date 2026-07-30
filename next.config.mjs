import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Qualquer host HTTPS é permitido porque o painel de administrador
      // deixa colar a URL de qualquer imagem ao criar/editar um jogo. Só
      // ADMIN tem acesso a esse campo (veja src/lib/roles.ts).
      { protocol: "https", hostname: "**" },
    ],
  },
  eslint: {
    // Lint runs separately in CI; don't block builds on it.
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
