-- CreateTable
CREATE TABLE "Anexo" (
    "id" TEXT NOT NULL,
    "lancamentoId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Anexo_lancamentoId_idx" ON "Anexo"("lancamentoId");

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "Lancamento"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE RESTRICT;
