// Verificación rápida del runtime: crea una empresa + admin y lee de vuelta.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = `smoke_${Date.now()}@test.com`;
  const passwordHash = await bcrypt.hash("secret123", 10);

  const empresa = await prisma.empresa.create({
    data: {
      nombre: "Smoke Test SRL",
      sucursales: { create: { nombre: "Casa central", tipo: "LOCAL" } },
      usuarios: { create: { nombre: "Admin", email, passwordHash, rol: "ADMIN" } },
    },
    include: { sucursales: true, usuarios: true },
  });

  const leido = await prisma.usuario.findUnique({ where: { email } });
  const okPass = leido?.passwordHash
    ? await bcrypt.compare("secret123", leido.passwordHash)
    : false;

  console.log("Empresa creada:", empresa.id);
  console.log("Sucursal:", empresa.sucursales[0]?.nombre);
  console.log("Usuario:", empresa.usuarios[0]?.email, "rol:", empresa.usuarios[0]?.rol);
  console.log("Login (compare password):", okPass ? "OK" : "FALLO");

  // Limpieza
  await prisma.empresa.delete({ where: { id: empresa.id } });
  console.log("Limpieza OK. Smoke test PASÓ ✅");
}

main()
  .catch((e) => {
    console.error("Smoke test FALLÓ ❌", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
