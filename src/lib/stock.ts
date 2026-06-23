import { prisma } from "@/lib/prisma";
import type { TipoMovimiento } from "@/generated/prisma/enums";

type RegistrarMov = {
  empresaId: string;
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  sucursalOrigenId?: string | null;
  sucursalDestinoId?: string | null;
  motivo?: string | null;
  usuarioId?: string | null;
};

/**
 * Registra un movimiento y actualiza el cache de stock en una transacción.
 * El stock real siempre se deriva de los movimientos.
 *
 * - ENTRADA: suma en destino
 * - SALIDA: resta en origen
 * - TRANSFERENCIA: resta en origen, suma en destino
 * - AJUSTE: aplica el delta (puede ser negativo) en origen
 */
export async function registrarMovimiento(m: RegistrarMov) {
  if (m.cantidad === 0) throw new Error("La cantidad no puede ser 0");

  return prisma.$transaction(async (tx) => {
    const sumar = async (sucursalId: string, delta: number) => {
      await tx.stock.upsert({
        where: { productoId_sucursalId: { productoId: m.productoId, sucursalId } },
        create: {
          empresaId: m.empresaId,
          productoId: m.productoId,
          sucursalId,
          cantidad: delta,
        },
        update: { cantidad: { increment: delta } },
      });
    };

    const cant = Math.abs(m.cantidad);

    switch (m.tipo) {
      case "ENTRADA":
        if (!m.sucursalDestinoId) throw new Error("Falta sucursal destino");
        await sumar(m.sucursalDestinoId, cant);
        break;
      case "SALIDA":
        if (!m.sucursalOrigenId) throw new Error("Falta sucursal origen");
        await sumar(m.sucursalOrigenId, -cant);
        break;
      case "TRANSFERENCIA":
        if (!m.sucursalOrigenId || !m.sucursalDestinoId)
          throw new Error("Faltan sucursales");
        if (m.sucursalOrigenId === m.sucursalDestinoId)
          throw new Error("Origen y destino no pueden ser iguales");
        await sumar(m.sucursalOrigenId, -cant);
        await sumar(m.sucursalDestinoId, cant);
        break;
      case "AJUSTE":
        if (!m.sucursalOrigenId) throw new Error("Falta sucursal");
        await sumar(m.sucursalOrigenId, m.cantidad); // respeta el signo
        break;
    }

    return tx.movimiento.create({
      data: {
        empresaId: m.empresaId,
        productoId: m.productoId,
        tipo: m.tipo,
        cantidad: cant,
        sucursalOrigenId: m.sucursalOrigenId ?? null,
        sucursalDestinoId: m.sucursalDestinoId ?? null,
        motivo: m.motivo ?? null,
        usuarioId: m.usuarioId ?? null,
      },
    });
  });
}
