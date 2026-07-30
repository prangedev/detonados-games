import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./db";
import type { RoleType } from "./roles";

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

/**
 * Papel do usuário atual, direto da sessão (evita uma consulta extra ao
 * banco). A sessão é recarregada do banco a cada chamada de
 * getServerSession/useSession — veja o callback `session` em src/lib/auth.ts —
 * então uma mudança de papel feita pelo administrador já reflete aqui sem
 * precisar de novo login.
 */
export async function getCurrentUserRole(): Promise<RoleType> {
  const session = await getServerSession(authOptions);
  return (session?.user?.role as RoleType | undefined) ?? "USER";
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}
