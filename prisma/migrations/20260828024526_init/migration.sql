-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'FINANCEIRO', 'LEITURA');

-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "NaturezaLancamento" AS ENUM ('RECEITA', 'CUSTO', 'DESPESA', 'TRANSFERENCIA', 'INVESTIMENTO', 'EMPRESTIMO', 'FINANCIAMENTO', 'IMPOSTO', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusLancamento" AS ENUM ('PROJETADO', 'EM_ABERTO', 'PAGO', 'RECEBIDO', 'VENCIDO', 'CANCELADO', 'PARCIAL_PAGO', 'PARCIAL_RECEBIDO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'BOLETO', 'PIX', 'TED', 'CARTAO', 'CHEQUE', 'OUTRO');

-- CreateEnum
CREATE TYPE "FrequenciaRecorrencia" AS ENUM ('SEMANAL', 'QUINZENAL', 'MENSAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Regional" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Regional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentroCusto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CentroCusto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoCategoria" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupoDRE" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "GrupoDRE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaDRE" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "grupoId" TEXT NOT NULL,

    CONSTRAINT "ContaDRE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaBancaria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "saldoInicial" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ContaBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "contato" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "regionalId" TEXT,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "contato" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recorrencia" (
    "id" TEXT NOT NULL,
    "frequencia" "FrequenciaRecorrencia" NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "parcelas" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL,
    "dataLancamento" TIMESTAMP(3) NOT NULL,
    "dataCompetencia" TIMESTAMP(3) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "tipo" "TipoLancamento" NOT NULL,
    "natureza" "NaturezaLancamento" NOT NULL,
    "status" "StatusLancamento" NOT NULL DEFAULT 'EM_ABERTO',
    "descricao" TEXT NOT NULL,
    "valorOriginal" DECIMAL(14,2) NOT NULL,
    "desconto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "acrescimo" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "juros" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "multa" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valorFinal" DECIMAL(14,2) NOT NULL,
    "valorPago" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "saldoAberto" DECIMAL(14,2) NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "subcategoriaId" TEXT,
    "contaDreId" TEXT NOT NULL,
    "centroCustoId" TEXT NOT NULL,
    "regionalId" TEXT NOT NULL,
    "projeto" TEXT,
    "contaBancariaId" TEXT NOT NULL,
    "clienteId" TEXT,
    "fornecedorId" TEXT,
    "formaPagamento" "FormaPagamento" NOT NULL,
    "tipoPagamento" TEXT,
    "observacao" TEXT,
    "numeroDocumento" TEXT,
    "numeroNotaFiscal" TEXT,
    "recorrenciaId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Regional_nome_key" ON "Regional"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "CentroCusto_nome_key" ON "CentroCusto"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_parentId_key" ON "Categoria"("nome", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoDRE_nome_key" ON "GrupoDRE"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "ContaDRE_nome_grupoId_key" ON "ContaDRE"("nome", "grupoId");

-- CreateIndex
CREATE UNIQUE INDEX "ContaBancaria_nome_key" ON "ContaBancaria"("nome");

-- CreateIndex
CREATE INDEX "Lancamento_tipo_status_idx" ON "Lancamento"("tipo", "status");

-- CreateIndex
CREATE INDEX "Lancamento_dataCompetencia_idx" ON "Lancamento"("dataCompetencia");

-- CreateIndex
CREATE INDEX "Lancamento_dataVencimento_idx" ON "Lancamento"("dataVencimento");

-- CreateIndex
CREATE INDEX "Lancamento_regionalId_idx" ON "Lancamento"("regionalId");

-- CreateIndex
CREATE INDEX "Lancamento_centroCustoId_idx" ON "Lancamento"("centroCustoId");

-- CreateIndex
CREATE INDEX "Lancamento_categoriaId_idx" ON "Lancamento"("categoriaId");

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ContaDRE" ADD CONSTRAINT "ContaDRE_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoDRE"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_regionalId_fkey" FOREIGN KEY ("regionalId") REFERENCES "Regional"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_subcategoriaId_fkey" FOREIGN KEY ("subcategoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_contaDreId_fkey" FOREIGN KEY ("contaDreId") REFERENCES "ContaDRE"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "CentroCusto"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_regionalId_fkey" FOREIGN KEY ("regionalId") REFERENCES "Regional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "ContaBancaria"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_recorrenciaId_fkey" FOREIGN KEY ("recorrenciaId") REFERENCES "Recorrencia"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
