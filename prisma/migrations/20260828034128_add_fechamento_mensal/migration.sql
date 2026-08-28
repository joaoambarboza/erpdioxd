-- CreateEnum
CREATE TYPE "StatusFechamento" AS ENUM ('ABERTO', 'FECHADO');

-- CreateTable
CREATE TABLE "FechamentoMensal" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "status" "StatusFechamento" NOT NULL DEFAULT 'ABERTO',
    "fechadoEm" TIMESTAMP(3),
    "fechadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FechamentoMensal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FechamentoMensal_ano_mes_key" ON "FechamentoMensal"("ano", "mes");

-- AddForeignKey
ALTER TABLE "FechamentoMensal" ADD CONSTRAINT "FechamentoMensal_fechadoPorId_fkey" FOREIGN KEY ("fechadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE RESTRICT;
