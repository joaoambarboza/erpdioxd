-- CreateEnum
CREATE TYPE "RegimeContaDRE" AS ENUM ('CAIXA', 'COMPETENCIA');

-- AlterTable
ALTER TABLE "ContaDRE" ADD COLUMN     "regime" "RegimeContaDRE" NOT NULL DEFAULT 'COMPETENCIA';

-- AlterTable
ALTER TABLE "GrupoDRE" ADD COLUMN     "mostrarPercentual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subtotalLabel" TEXT;
