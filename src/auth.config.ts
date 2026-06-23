import type { NextAuthConfig, DefaultSession } from "next-auth";
import type { Rol } from "@/generated/prisma/enums";

// Extiende la sesión con los datos de tenant que viajan en el token.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      empresaId: string;
      rol: Rol;
      sucursalId: string | null;
    } & DefaultSession["user"];
  }
}

/**
 * Config base, segura para el Edge runtime (sin Prisma ni bcrypt).
 * El middleware la usa tal cual; auth.ts le agrega el provider Credentials.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // se agregan en auth.ts (runtime Node)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.empresaId = (user as { empresaId: string }).empresaId;
        token.rol = (user as { rol: Rol }).rol;
        token.sucursalId = (user as { sucursalId: string | null }).sucursalId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.empresaId = token.empresaId as string;
        session.user.rol = token.rol as Rol;
        session.user.sucursalId = (token.sucursalId as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
