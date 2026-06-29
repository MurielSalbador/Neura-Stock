import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Instancia edge-safe (sin Prisma/bcrypt) solo para leer la sesión.
const { auth } = NextAuth(authConfig);

const PUBLICAS = ["/login", "/registro"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const esPublica = PUBLICAS.some((p) => pathname.startsWith(p));
  const logueado = !!req.auth;

  if (esPublica) {
    if (logueado) return NextResponse.redirect(new URL("/app", req.nextUrl));
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
