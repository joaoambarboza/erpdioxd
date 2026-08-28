import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Script de bootstrap para um banco de produção vazio. Ao contrário de
// prisma/seed.ts (dados de demonstração, só para desenvolvimento), este
// script cria apenas o mínimo necessário para o sistema ficar utilizável:
// o usuário administrador e uma conta bancária inicial (obrigatória para
// registrar lançamentos — edite pela tela Cadastros > Contas Bancárias
// depois). É seguro rodar mais de uma vez — cada etapa só cria o que ainda
// não existe.

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminName = process.env.ADMIN_NAME ?? "Administrador Dioxd";
  const adminEmail = process.env.ADMIN_EMAIL ?? "joaobarboza@dioxd.com";
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "Defina ADMIN_PASSWORD antes de rodar este script (nunca deixe a senha hardcoded no código)."
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`Usuário administrador pronto: ${adminEmail}`);

  const existeContaBancaria = await prisma.contaBancaria.findFirst();
  if (!existeContaBancaria) {
    await prisma.contaBancaria.create({
      data: {
        nome: process.env.CONTA_BANCARIA_NOME ?? "Conta Principal",
        banco: process.env.CONTA_BANCARIA_BANCO ?? "A definir",
        saldoInicial: Number(process.env.CONTA_BANCARIA_SALDO_INICIAL ?? 0),
      },
    });
    console.log(
      "Conta bancária inicial criada (edite nome/banco/saldo direto no banco até existir uma tela de cadastro)."
    );
  } else {
    console.log("Conta bancária já existe, nada a fazer.");
  }

  console.log("Bootstrap de produção concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
