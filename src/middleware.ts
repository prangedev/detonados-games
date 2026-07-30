import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Roda em todas as rotas exceto API, arquivos internos do Next e arquivos estáticos.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
