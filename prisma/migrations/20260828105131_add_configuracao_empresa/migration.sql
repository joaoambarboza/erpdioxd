-- CreateTable
CREATE TABLE "ConfiguracaoEmpresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT 'Dioxd',
    "cnpj" TEXT,
    "endereco" TEXT,
    "logoPath" TEXT,
    "mesInicioAnoFiscal" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoEmpresa_pkey" PRIMARY KEY ("id")
);
