import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { grantDailyLoginXp } from "./achievements";

/**
 * Login por credenciais (e-mail + senha) com sessão em JWT. O registro de
 * usuários acontece em /api/register, que já grava o hash da senha
 * diretamente no model User — por isso não usamos o PrismaAdapter aqui
 * (ele é voltado principalmente a provedores OAuth). Para adicionar Google/
 * GitHub no futuro, inclua o adapter + os providers correspondentes.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({ where: { email: credentials.email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // 15 XP por login, no máximo 1x/dia — veja src/lib/achievements.ts
        await grantDailyLoginXp(user.id).catch((err) =>
          console.error("[auth] falha ao conceder XP diário:", err)
        );

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as { id: string }).id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Busca o papel direto do banco a cada checagem de sessão, assim uma
        // mudança de papel feita pelo administrador vale imediatamente, sem
        // exigir logout/login do usuário afetado.
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        session.user.role = dbUser?.role ?? "USER";
      }
      return session;
    },
  },
};
