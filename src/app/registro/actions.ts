"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

const schema = z.object({
  empresa:  z.string().min(2, "Nombre de empresa muy corto").max(100, "Nombre de empresa demasiado largo"),
  nombre:   z.string().min(2, "Ingresá tu nombre").max(100, "Nombre demasiado largo"),
  email:    z.string().email("Email inválido").max(254, "Email demasiado largo"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(128, "Contraseña demasiado larga"),
});

export type RegistroState = { error?: string };

export async function registrar(
  _prev: RegistroState,
  formData: FormData,
): Promise<RegistroState> {
  const parsed = schema.safeParse({
    empresa: formData.get("empresa"),
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { empresa, nombre, email, password } = parsed.data;
  const emailNorm = email.toLowerCase();

  const passwordHash = await bcrypt.hash(password, 10);

  // Crea empresa + sucursal inicial + usuario admin en una transacción.
  // La unicidad del email la garantiza la constraint de la DB (no el check previo),
  // para evitar la race condition de check-then-insert concurrente.
  try {
    await prisma.$transaction(async (tx) => {
      const nuevaEmpresa = await tx.empresa.create({
        data: { nombre: empresa, plan: "trial" },
      });
      await tx.sucursal.create({
        data: { empresaId: nuevaEmpresa.id, nombre: "Casa central", tipo: "LOCAL" },
      });
      await tx.usuario.create({
        data: {
          empresaId: nuevaEmpresa.id,
          nombre,
          email: emailNorm,
          passwordHash,
          rol: "ADMIN",
        },
      });
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return { error: "Ya existe una cuenta con ese email" };
    return { error: "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  // signIn redirige al panel si todo va bien.
  await signIn("credentials", {
    email: emailNorm,
    password,
    redirectTo: "/app",
  });

  return {};
}
