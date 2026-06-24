-- CreateTable
CREATE TABLE "SucursalEncargado" (
    "usuarioId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,

    CONSTRAINT "SucursalEncargado_pkey" PRIMARY KEY ("usuarioId","sucursalId")
);

-- CreateIndex
CREATE INDEX "SucursalEncargado_usuarioId_idx" ON "SucursalEncargado"("usuarioId");

-- CreateIndex
CREATE INDEX "SucursalEncargado_sucursalId_idx" ON "SucursalEncargado"("sucursalId");

-- AddForeignKey
ALTER TABLE "SucursalEncargado" ADD CONSTRAINT "SucursalEncargado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SucursalEncargado" ADD CONSTRAINT "SucursalEncargado_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
