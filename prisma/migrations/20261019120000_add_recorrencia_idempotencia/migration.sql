-- AlterTable
ALTER TABLE "Recorrencia" ADD COLUMN     "chaveIdempotencia" TEXT;

-- AlterTable
ALTER TABLE "Lancamento" ADD COLUMN     "parcelaNumero" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Recorrencia_chaveIdempotencia_key" ON "Recorrencia"("chaveIdempotencia");

-- CreateIndex
CREATE UNIQUE INDEX "Lancamento_recorrenciaId_parcelaNumero_key" ON "Lancamento"("recorrenciaId", "parcelaNumero");
