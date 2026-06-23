import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const usuario = await prisma.usuario.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!usuario || !usuario.passwordHash || !usuario.activo) return null;

        const ok = await bcrypt.compare(password, usuario.passwordHash);
        if (!ok) return null;

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.email,
          empresaId: usuario.empresaId,
          rol: usuario.rol,
          sucursalId: usuario.sucursalId,
        };
      },
    }),
  ],
});
