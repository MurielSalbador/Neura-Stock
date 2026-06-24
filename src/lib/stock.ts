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

    // Verifica que haya stock suficiente antes de descontar.
    const verificarSuficiente = async (sucursalId: string, necesario: number) => {
      const row = await tx.stock.findUnique({
        where: { productoId_sucursalId: { productoId: m.productoId, sucursalId } },
        select: { cantidad: true },
      });
      const actual = Number(row?.cantidad ?? 0);
      if (actual < necesario) {
        throw new Error(`Stock insuficiente: disponible ${actual}, requerido ${necesario}`);
      }
    };

    const cant = Math.abs(m.cantidad);

    switch (m.tipo) {
      case "ENTRADA":
        if (!m.sucursalDestinoId) throw new Error("Falta sucursal destino");
        await sumar(m.sucursalDestinoId, cant);
        break;
      case "SALIDA":
        if (!m.sucursalOrigenId) throw new Error("Falta sucursal origen");
        await verificarSuficiente(m.sucursalOrigenId, cant);
        await sumar(m.sucursalOrigenId, -cant);
        break;
      case "TRANSFERENCIA":
        if (!m.sucursalOrigenId || !m.sucursalDestinoId)
          throw new Error("Faltan sucursales");
        if (m.sucursalOrigenId === m.sucursalDestinoId)
          throw new Error("Origen y destino no pueden ser iguales");
        await verificarSuficiente(m.sucursalOrigenId, cant);
        await sumar(m.sucursalOrigenId, -cant);
        await sumar(m.sucursalDestinoId, cant);
        break;
      case "AJUSTE":
        if (!m.sucursalOrigenId) throw new Error("Falta sucursal");
        if (m.cantidad < 0) await verificarSuficiente(m.sucursalOrigenId, cant);
        await sumar(m.sucursalOrigenId, m.cantidad);
        break;
    }

    return tx.movimiento.create({
      data: {
        empresaId: m.empresaId,
        productoId: m.productoId,
        tipo: m.tipo,
        // AJUSTE guarda el delta CON signo para que la reversión sea siempre -cantidad.
        // El resto de tipos guardan el valor absoluto (el signo queda implícito en el tipo).
        cantidad: m.tipo === "AJUSTE" ? m.cantidad : cant,
        sucursalOrigenId: m.sucursalOrigenId ?? null,
        sucursalDestinoId: m.sucursalDestinoId ?? null,
        motivo: m.motivo ?? null,
        usuarioId: m.usuarioId ?? null,
      },
    });
  });
}
