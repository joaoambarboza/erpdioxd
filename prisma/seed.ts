import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "joaobarboza@dioxd.com";
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "Defina ADMIN_PASSWORD no .env antes de rodar o seed (nunca deixe a senha hardcoded no código)."
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador Dioxd",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  const regionaisNomes = ["Sul", "Centro-Oeste", "Nordeste", "Sudeste"];
  const regionais = await Promise.all(
    regionaisNomes.map((nome) =>
      prisma.regional.upsert({ where: { nome }, update: {}, create: { nome } })
    )
  );

  const centrosCustoNomes = [
    "Administrativo",
    "Comercial",
    "Produção",
    "Logística",
    "Manutenção",
  ];
  const centrosCusto = await Promise.all(
    centrosCustoNomes.map((nome) =>
      prisma.centroCusto.upsert({ where: { nome }, update: {}, create: { nome } })
    )
  );

  const contasBancariasData = [
    { nome: "Banco do Brasil - CC", banco: "Banco do Brasil", saldoInicial: 185000 },
    { nome: "Sicredi - CC", banco: "Sicredi", saldoInicial: 62000 },
  ];
  const contasBancarias = await Promise.all(
    contasBancariasData.map((c) =>
      prisma.contaBancaria.upsert({ where: { nome: c.nome }, update: {}, create: c })
    )
  );

  // Estrutura real da DRE da Dioxd: regime de caixa e competência misturados
  // por conta, com 5 checkpoints de subtotal (Receita Líquida, Lucro Bruto,
  // EBITDA, EBIT, Lucro Líquido do Exercício) — ver GrupoDRE.subtotalLabel.
  const grupoReceita = await prisma.grupoDRE.upsert({
    where: { nome: "Receita Operacional Bruta" },
    update: {},
    create: { nome: "Receita Operacional Bruta", ordem: 1 },
  });
  const grupoImpostos = await prisma.grupoDRE.upsert({
    where: { nome: "Impostos sobre Vendas" },
    update: {},
    create: { nome: "Impostos sobre Vendas", ordem: 2, subtotalLabel: "Receita Líquida" },
  });
  const grupoCustosComissao = await prisma.grupoDRE.upsert({
    where: { nome: "Custos de Serviços Prestados e Comissão" },
    update: {},
    create: {
      nome: "Custos de Serviços Prestados e Comissão",
      ordem: 3,
      subtotalLabel: "Lucro Bruto",
      mostrarPercentual: true,
    },
  });
  const grupoDespesas = await prisma.grupoDRE.upsert({
    where: { nome: "Despesas" },
    update: {},
    create: { nome: "Despesas", ordem: 4, subtotalLabel: "EBITDA", mostrarPercentual: true },
  });
  const grupoDepreciacao = await prisma.grupoDRE.upsert({
    where: { nome: "Depreciação e Amortização" },
    update: {},
    create: { nome: "Depreciação e Amortização", ordem: 5, subtotalLabel: "EBIT", mostrarPercentual: true },
  });
  const grupoReceitasFinanceiras = await prisma.grupoDRE.upsert({
    where: { nome: "Receitas Financeiras" },
    update: {},
    create: { nome: "Receitas Financeiras", ordem: 6 },
  });
  const grupoDespesasFinanceiras = await prisma.grupoDRE.upsert({
    where: { nome: "Despesas Financeiras" },
    update: {},
    create: {
      nome: "Despesas Financeiras",
      ordem: 7,
      subtotalLabel: "Lucro Líquido do Exercício",
      mostrarPercentual: true,
    },
  });

  const contaDreVendas = await prisma.contaDRE.upsert({
    where: { nome_grupoId: { nome: "Venda de Grãos", grupoId: grupoReceita.id } },
    update: {},
    create: { nome: "Venda de Grãos", ordem: 1, grupoId: grupoReceita.id, regime: "COMPETENCIA" },
  });
  await prisma.contaDRE.upsert({
    where: { nome_grupoId: { nome: "Impostos sobre Vendas", grupoId: grupoImpostos.id } },
    update: {},
    create: { nome: "Impostos sobre Vendas", ordem: 1, grupoId: grupoImpostos.id, regime: "COMPETENCIA" },
  });
  const contaDreInsumos = await prisma.contaDRE.upsert({
    where: { nome_grupoId: { nome: "Insumos Agrícolas", grupoId: grupoCustosComissao.id } },
    update: {},
    create: { nome: "Insumos Agrícolas", ordem: 1, grupoId: grupoCustosComissao.id, regime: "CAIXA" },
  });
  const contaDreFrete = await prisma.contaDRE.upsert({
    where: { nome_grupoId: { nome: "Frete e Logística", grupoId: grupoCustosComissao.id } },
    update: {},
    create: { nome: "Frete e Logística", ordem: 2, grupoId: grupoCustosComissao.id, regime: "CAIXA" },
  });
  const contaDreComissao = await prisma.contaDRE.upsert({
    where: { nome_grupoId: { nome: "Comissão", grupoId: grupoCustosComissao.id } },
    update: {},
    create: { nome: "Comissão", ordem: 3, grupoId: grupoCustosComissao.id, regime: "COMPETENCIA" },
  });
  const contaDreMaoDeObra = await prisma.contaDRE.upsert({
    where: { nome_grupoId: { nome: "Mão de Obra", grupoId: grupoDespesas.id } },
    update: {},
    create: { nome: "Mão de Obra", ordem: 1, grupoId: grupoDespesas.id, regime: "CAIXA" },
  });
  const contaDreAdmin = await prisma.contaDRE.upsert({
    where: { nome_grupoId: { nome: "Despesas Administrativas", grupoId: grupoDespesas.id } },
    update: {},
    create: { nome: "Despesas Administrativas", ordem: 2, grupoId: grupoDespesas.id, regime: "CAIXA" },
  });
  const contaDreManutencao = await prisma.contaDRE.upsert({
    where: { nome_grupoId: { nome: "Manutenção de Máquinas", grupoId: grupoDespesas.id } },
    update: {},
    create: { nome: "Manutenção de Máquinas", ordem: 3, grupoId: grupoDespesas.id, regime: "CAIXA" },
  });
  const contaDreDepreciacao = await prisma.contaDRE.upsert({
    where: { nome_grupoId: { nome: "Depreciação de Equipamentos", grupoId: grupoDepreciacao.id } },
    update: {},
    create: { nome: "Depreciação de Equipamentos", ordem: 1, grupoId: grupoDepreciacao.id, regime: "CAIXA" },
  });
  const contaDreReceitasFinanceiras = await prisma.contaDRE.upsert({
    where: { nome_grupoId: { nome: "Rendimentos de Aplicação", grupoId: grupoReceitasFinanceiras.id } },
    update: {},
    create: { nome: "Rendimentos de Aplicação", ordem: 1, grupoId: grupoReceitasFinanceiras.id, regime: "CAIXA" },
  });
  const contaDreDespesasFinanceiras = await prisma.contaDRE.upsert({
    where: { nome_grupoId: { nome: "Juros e Tarifas Bancárias", grupoId: grupoDespesasFinanceiras.id } },
    update: {},
    create: { nome: "Juros e Tarifas Bancárias", ordem: 1, grupoId: grupoDespesasFinanceiras.id, regime: "CAIXA" },
  });

  async function upsertRootCategoria(nome: string, tipo: "ENTRADA" | "SAIDA") {
    const existing = await prisma.categoria.findFirst({
      where: { nome, parentId: null },
    });
    if (existing) return existing;
    return prisma.categoria.create({ data: { nome, tipo } });
  }

  const catVendas = await upsertRootCategoria("Vendas", "ENTRADA");
  const catSoja = await prisma.categoria.upsert({
    where: { nome_parentId: { nome: "Soja", parentId: catVendas.id } },
    update: {},
    create: { nome: "Soja", tipo: "ENTRADA", parentId: catVendas.id },
  });
  const catMilho = await prisma.categoria.upsert({
    where: { nome_parentId: { nome: "Milho", parentId: catVendas.id } },
    update: {},
    create: { nome: "Milho", tipo: "ENTRADA", parentId: catVendas.id },
  });
  const catInsumos = await upsertRootCategoria("Insumos", "SAIDA");
  const catFertilizante = await prisma.categoria.upsert({
    where: { nome_parentId: { nome: "Fertilizantes", parentId: catInsumos.id } },
    update: {},
    create: { nome: "Fertilizantes", tipo: "SAIDA", parentId: catInsumos.id },
  });
  const catDefensivos = await prisma.categoria.upsert({
    where: { nome_parentId: { nome: "Defensivos", parentId: catInsumos.id } },
    update: {},
    create: { nome: "Defensivos", tipo: "SAIDA", parentId: catInsumos.id },
  });
  const catFolha = await upsertRootCategoria("Folha de Pagamento", "SAIDA");
  const catManutencao = await upsertRootCategoria("Manutenção", "SAIDA");
  const catFrete = await upsertRootCategoria("Frete", "SAIDA");
  const catAdmin = await upsertRootCategoria("Administrativo", "SAIDA");
  const catComissao = await upsertRootCategoria("Comissões", "SAIDA");
  const catDepreciacao = await upsertRootCategoria("Depreciação", "SAIDA");
  const catReceitasFinanceiras = await upsertRootCategoria("Receitas Financeiras", "ENTRADA");
  const catDespesasFinanceiras = await upsertRootCategoria("Despesas Financeiras", "SAIDA");

  const clientesData = [
    { nome: "Cooperativa Agropecuária Vale Verde", regionalId: regionais[0].id },
    { nome: "Cerealista Bom Grão", regionalId: regionais[1].id },
    { nome: "Trading Rio Sul Exportação", regionalId: regionais[0].id },
    { nome: "Armazéns Planalto", regionalId: regionais[2].id },
  ];
  const clientes = await Promise.all(
    clientesData.map((c) => prisma.cliente.create({ data: c }))
  );

  const fornecedoresData = [
    { nome: "AgroInsumos Distribuidora" },
    { nome: "Mecânica Rural Ltda" },
    { nome: "Transportes Caminho Verde" },
  ];
  const fornecedores = await Promise.all(
    fornecedoresData.map((f) => prisma.fornecedor.create({ data: f }))
  );

  const today = new Date();
  const baseDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  type SeedLancamento = {
    offsetDays: number;
    tipo: "ENTRADA" | "SAIDA";
    natureza:
      | "RECEITA"
      | "CUSTO"
      | "DESPESA"
      | "TRANSFERENCIA"
      | "INVESTIMENTO"
      | "EMPRESTIMO"
      | "FINANCIAMENTO"
      | "IMPOSTO"
      | "OUTROS";
    status: "PROJETADO" | "EM_ABERTO" | "PAGO" | "RECEBIDO" | "VENCIDO" | "CANCELADO" | "PARCIAL_PAGO" | "PARCIAL_RECEBIDO";
    descricao: string;
    valor: number;
    categoriaId: string;
    contaDreId: string;
    centroCustoId: string;
    regionalId: string;
    clienteId?: string;
    fornecedorId?: string;
    valorPagoFrac: number;
  };

  const lancamentosSeed: SeedLancamento[] = [
    { offsetDays: -75, tipo: "ENTRADA", natureza: "RECEITA", status: "RECEBIDO", descricao: "Venda de soja - safra 24/25", valor: 145000, categoriaId: catSoja.id, contaDreId: contaDreVendas.id, centroCustoId: centrosCusto[1].id, regionalId: regionais[0].id, clienteId: clientes[0].id, valorPagoFrac: 1 },
    { offsetDays: -60, tipo: "ENTRADA", natureza: "RECEITA", status: "RECEBIDO", descricao: "Venda de milho - lote 12", valor: 88000, categoriaId: catMilho.id, contaDreId: contaDreVendas.id, centroCustoId: centrosCusto[1].id, regionalId: regionais[1].id, clienteId: clientes[1].id, valorPagoFrac: 1 },
    { offsetDays: -45, tipo: "SAIDA", natureza: "CUSTO", status: "PAGO", descricao: "Compra de fertilizante NPK", valor: 32000, categoriaId: catFertilizante.id, contaDreId: contaDreInsumos.id, centroCustoId: centrosCusto[2].id, regionalId: regionais[0].id, fornecedorId: fornecedores[0].id, valorPagoFrac: 1 },
    { offsetDays: -40, tipo: "SAIDA", natureza: "DESPESA", status: "PAGO", descricao: "Folha de pagamento - safristas", valor: 41000, categoriaId: catFolha.id, contaDreId: contaDreMaoDeObra.id, centroCustoId: centrosCusto[2].id, regionalId: regionais[0].id, valorPagoFrac: 1 },
    { offsetDays: -30, tipo: "SAIDA", natureza: "DESPESA", status: "PAGO", descricao: "Manutenção de colheitadeira", valor: 18500, categoriaId: catManutencao.id, contaDreId: contaDreManutencao.id, centroCustoId: centrosCusto[4].id, regionalId: regionais[1].id, fornecedorId: fornecedores[1].id, valorPagoFrac: 1 },
    { offsetDays: -20, tipo: "ENTRADA", natureza: "RECEITA", status: "RECEBIDO", descricao: "Venda de soja - excedente", valor: 52000, categoriaId: catSoja.id, contaDreId: contaDreVendas.id, centroCustoId: centrosCusto[1].id, regionalId: regionais[2].id, clienteId: clientes[3].id, valorPagoFrac: 1 },
    { offsetDays: -15, tipo: "SAIDA", natureza: "DESPESA", status: "PAGO", descricao: "Frete de transporte de grãos", valor: 15200, categoriaId: catFrete.id, contaDreId: contaDreFrete.id, centroCustoId: centrosCusto[3].id, regionalId: regionais[0].id, fornecedorId: fornecedores[2].id, valorPagoFrac: 1 },
    { offsetDays: -10, tipo: "SAIDA", natureza: "DESPESA", status: "PARCIAL_PAGO", descricao: "Compra de defensivos agrícolas", valor: 27800, categoriaId: catDefensivos.id, contaDreId: contaDreInsumos.id, centroCustoId: centrosCusto[2].id, regionalId: regionais[1].id, fornecedorId: fornecedores[0].id, valorPagoFrac: 0.5 },
    { offsetDays: -8, tipo: "SAIDA", natureza: "DESPESA", status: "PAGO", descricao: "Despesas administrativas do mês", valor: 9600, categoriaId: catAdmin.id, contaDreId: contaDreAdmin.id, centroCustoId: centrosCusto[0].id, regionalId: regionais[0].id, valorPagoFrac: 1 },
    { offsetDays: -5, tipo: "ENTRADA", natureza: "RECEITA", status: "PARCIAL_RECEBIDO", descricao: "Venda de milho - contrato futuro", valor: 96000, categoriaId: catMilho.id, contaDreId: contaDreVendas.id, centroCustoId: centrosCusto[1].id, regionalId: regionais[3].id, clienteId: clientes[2].id, valorPagoFrac: 0.4 },
    { offsetDays: -3, tipo: "SAIDA", natureza: "DESPESA", status: "VENCIDO", descricao: "Manutenção de trator - peças", valor: 6400, categoriaId: catManutencao.id, contaDreId: contaDreManutencao.id, centroCustoId: centrosCusto[4].id, regionalId: regionais[2].id, fornecedorId: fornecedores[1].id, valorPagoFrac: 0 },
    { offsetDays: -1, tipo: "ENTRADA", natureza: "RECEITA", status: "VENCIDO", descricao: "Venda de soja - cliente regional", valor: 34500, categoriaId: catSoja.id, contaDreId: contaDreVendas.id, centroCustoId: centrosCusto[1].id, regionalId: regionais[1].id, clienteId: clientes[1].id, valorPagoFrac: 0 },
    { offsetDays: 5, tipo: "ENTRADA", natureza: "RECEITA", status: "EM_ABERTO", descricao: "Venda de soja - novo contrato", valor: 112000, categoriaId: catSoja.id, contaDreId: contaDreVendas.id, centroCustoId: centrosCusto[1].id, regionalId: regionais[0].id, clienteId: clientes[0].id, valorPagoFrac: 0 },
    { offsetDays: 10, tipo: "SAIDA", natureza: "CUSTO", status: "EM_ABERTO", descricao: "Compra de fertilizante para plantio", valor: 41000, categoriaId: catFertilizante.id, contaDreId: contaDreInsumos.id, centroCustoId: centrosCusto[2].id, regionalId: regionais[0].id, fornecedorId: fornecedores[0].id, valorPagoFrac: 0 },
    { offsetDays: 15, tipo: "SAIDA", natureza: "DESPESA", status: "EM_ABERTO", descricao: "Folha de pagamento - próximo mês", valor: 43000, categoriaId: catFolha.id, contaDreId: contaDreMaoDeObra.id, centroCustoId: centrosCusto[2].id, regionalId: regionais[0].id, valorPagoFrac: 0 },
    { offsetDays: 20, tipo: "ENTRADA", natureza: "RECEITA", status: "PROJETADO", descricao: "Venda de milho - previsão safrinha", valor: 78000, categoriaId: catMilho.id, contaDreId: contaDreVendas.id, centroCustoId: centrosCusto[1].id, regionalId: regionais[1].id, clienteId: clientes[1].id, valorPagoFrac: 0 },
    { offsetDays: 25, tipo: "SAIDA", natureza: "DESPESA", status: "EM_ABERTO", descricao: "Frete para escoamento da safra", valor: 21000, categoriaId: catFrete.id, contaDreId: contaDreFrete.id, centroCustoId: centrosCusto[3].id, regionalId: regionais[2].id, fornecedorId: fornecedores[2].id, valorPagoFrac: 0 },
    { offsetDays: 35, tipo: "ENTRADA", natureza: "RECEITA", status: "PROJETADO", descricao: "Venda de soja - contrato futuro 2", valor: 133000, categoriaId: catSoja.id, contaDreId: contaDreVendas.id, centroCustoId: centrosCusto[1].id, regionalId: regionais[3].id, clienteId: clientes[3].id, valorPagoFrac: 0 },
    { offsetDays: -50, tipo: "SAIDA", natureza: "DESPESA", status: "PAGO", descricao: "Despesas administrativas - mês anterior", valor: 8900, categoriaId: catAdmin.id, contaDreId: contaDreAdmin.id, centroCustoId: centrosCusto[0].id, regionalId: regionais[0].id, valorPagoFrac: 1 },
    { offsetDays: -90, tipo: "ENTRADA", natureza: "RECEITA", status: "RECEBIDO", descricao: "Venda de soja - safra anterior", valor: 156000, categoriaId: catSoja.id, contaDreId: contaDreVendas.id, centroCustoId: centrosCusto[1].id, regionalId: regionais[0].id, clienteId: clientes[0].id, valorPagoFrac: 1 },

    // Linhas de regime caixa/competência da nova composição de DRE — dados
    // suficientes para exercitar Lucro Bruto/EBITDA/EBIT/Lucro Líquido tanto
    // no projetado quanto no realizado.
    { offsetDays: -12, tipo: "SAIDA", natureza: "DESPESA", status: "PAGO", descricao: "Comissão sobre vendas - safra atual", valor: 8000, categoriaId: catComissao.id, contaDreId: contaDreComissao.id, centroCustoId: centrosCusto[1].id, regionalId: regionais[0].id, valorPagoFrac: 1 },
    { offsetDays: 18, tipo: "SAIDA", natureza: "DESPESA", status: "PROJETADO", descricao: "Comissão sobre vendas - previsão", valor: 9500, categoriaId: catComissao.id, contaDreId: contaDreComissao.id, centroCustoId: centrosCusto[1].id, regionalId: regionais[0].id, valorPagoFrac: 0 },
    { offsetDays: -7, tipo: "SAIDA", natureza: "OUTROS", status: "PAGO", descricao: "Depreciação de equipamentos - trimestre", valor: 12000, categoriaId: catDepreciacao.id, contaDreId: contaDreDepreciacao.id, centroCustoId: centrosCusto[2].id, regionalId: regionais[0].id, valorPagoFrac: 1 },
    { offsetDays: 22, tipo: "SAIDA", natureza: "OUTROS", status: "PROJETADO", descricao: "Depreciação de equipamentos - previsão", valor: 12000, categoriaId: catDepreciacao.id, contaDreId: contaDreDepreciacao.id, centroCustoId: centrosCusto[2].id, regionalId: regionais[0].id, valorPagoFrac: 0 },
    { offsetDays: -6, tipo: "ENTRADA", natureza: "RECEITA", status: "RECEBIDO", descricao: "Rendimento de aplicação financeira", valor: 3200, categoriaId: catReceitasFinanceiras.id, contaDreId: contaDreReceitasFinanceiras.id, centroCustoId: centrosCusto[0].id, regionalId: regionais[0].id, valorPagoFrac: 1 },
    { offsetDays: -4, tipo: "SAIDA", natureza: "DESPESA", status: "PAGO", descricao: "Tarifas bancárias e IOF", valor: 950, categoriaId: catDespesasFinanceiras.id, contaDreId: contaDreDespesasFinanceiras.id, centroCustoId: centrosCusto[0].id, regionalId: regionais[0].id, valorPagoFrac: 1 },
    { offsetDays: 28, tipo: "SAIDA", natureza: "DESPESA", status: "PROJETADO", descricao: "Juros de empréstimo - previsão", valor: 2100, categoriaId: catDespesasFinanceiras.id, contaDreId: contaDreDespesasFinanceiras.id, centroCustoId: centrosCusto[0].id, regionalId: regionais[0].id, valorPagoFrac: 0 },
  ];

  for (const item of lancamentosSeed) {
    const dataCompetencia = addDays(baseDate, item.offsetDays);
    const dataVencimento = addDays(dataCompetencia, 10);
    const valorPago = Math.round(item.valor * item.valorPagoFrac * 100) / 100;
    const saldoAberto = Math.round((item.valor - valorPago) * 100) / 100;

    await prisma.lancamento.create({
      data: {
        dataLancamento: dataCompetencia,
        dataCompetencia,
        dataVencimento,
        dataPagamento: item.valorPagoFrac > 0 ? dataVencimento : null,
        tipo: item.tipo,
        natureza: item.natureza,
        status: item.status,
        descricao: item.descricao,
        valorOriginal: item.valor,
        desconto: 0,
        acrescimo: 0,
        juros: 0,
        multa: 0,
        valorFinal: item.valor,
        valorPago,
        saldoAberto,
        categoriaId: item.categoriaId,
        contaDreId: item.contaDreId,
        centroCustoId: item.centroCustoId,
        regionalId: item.regionalId,
        contaBancariaId: contasBancarias[0].id,
        clienteId: item.clienteId,
        fornecedorId: item.fornecedorId,
        formaPagamento: item.tipo === "ENTRADA" ? "PIX" : "BOLETO",
        createdById: admin.id,
      },
    });
  }

  console.log("Seed concluído.");
  console.log(`Login: ${adminEmail} / (senha definida em ADMIN_PASSWORD)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
