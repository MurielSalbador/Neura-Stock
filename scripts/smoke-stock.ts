// Verifica el loop de stock: producto + 2 sucursales, entrada, transferencia,
// salida y ajuste, comprobando el cache de Stock en cada paso.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { registrarMovimiento } from "../src/lib/stock";

const cant = async (productoId: string, sucursalId: string) =>
  Number(
    (
      await prisma.stock.findUnique({
        where: { productoId_sucursalId: { productoId, sucursalId } },
      })
    )?.cantidad ?? 0,
  );

async function main() {
  const empresa = await prisma.empresa.create({
    data: {
      nombre: "Stock Test SRL",
      sucursales: {
        create: [
          { nombre: "Local", tipo: "LOCAL" },
          { nombre: "Depósito", tipo: "DEPOSITO" },
        ],
      },
      productos: { create: { sku: "T-1", nombre: "Tornillo", stockMinimo: 5 } },
    },
    include: { sucursales: true, productos: true },
  });

  const [local, deposito] = empresa.sucursales;
  const prod = empresa.productos[0];
  const base = { empresaId: empresa.id, productoId: prod.id };
  const check = (msg: string, real: number, esp: number) => {
    const ok = real === esp;
    console.log(`${ok ? "✅" : "❌"} ${msg}: ${real} (esperado ${esp})`);
    if (!ok) throw new Error(`Falló: ${msg}`);
  };

  // Entrada de 100 al depósito
  await registrarMovimiento({ ...base, tipo: "ENTRADA", cantidad: 100, sucursalDestinoId: deposito.id });
  check("Entrada → depósito", await cant(prod.id, deposito.id), 100);

  // Transferencia 30 depósito → local
  await registrarMovimiento({ ...base, tipo: "TRANSFERENCIA", cantidad: 30, sucursalOrigenId: deposito.id, sucursalDestinoId: local.id });
  check("Transferencia depósito", await cant(prod.id, deposito.id), 70);
  check("Transferencia local", await cant(prod.id, local.id), 30);

  // Salida 10 del local (venta)
  await registrarMovimiento({ ...base, tipo: "SALIDA", cantidad: 10, sucursalOrigenId: local.id });
  check("Salida local", await cant(prod.id, local.id), 20);

  // Ajuste -2 en local (merma)
  await registrarMovimiento({ ...base, tipo: "AJUSTE", cantidad: -2, sucursalOrigenId: local.id });
  check("Ajuste local", await cant(prod.id, local.id), 18);

  const movs = await prisma.movimiento.count({ where: { empresaId: empresa.id } });
  check("Movimientos registrados", movs, 4);

  await prisma.empresa.delete({ where: { id: empresa.id } });
  console.log("\nLoop de stock OK ✅ (limpieza hecha)");
}

main()
  .catch((e) => {
    console.error("FALLÓ ❌", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
