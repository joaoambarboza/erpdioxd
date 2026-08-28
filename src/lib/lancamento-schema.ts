import { z } from "zod";

const optionalId = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined));

export const lancamentoSchema = z.object({
  dataLancamento: z.string().min(1, "Obrigatório"),
  dataCompetencia: z.string().min(1, "Obrigatório"),
  dataVencimento: z.string().min(1, "Obrigatório"),
  dataPagamento: z.string().optional(),

  tipo: z.enum(["ENTRADA", "SAIDA"]),
  natureza: z.enum([
    "RECEITA",
    "CUSTO",
    "DESPESA",
    "TRANSFERENCIA",
    "INVESTIMENTO",
    "EMPRESTIMO",
    "FINANCIAMENTO",
    "IMPOSTO",
    "OUTROS",
  ]),
  status: z.enum([
    "PROJETADO",
    "EM_ABERTO",
    "PAGO",
    "RECEBIDO",
    "VENCIDO",
    "CANCELADO",
    "PARCIAL_PAGO",
    "PARCIAL_RECEBIDO",
  ]),
  descricao: z.string().min(1, "Obrigatório"),

  valorOriginal: z.coerce.number().positive("Deve ser maior que zero"),
  desconto: z.coerce.number().min(0).default(0),
  acrescimo: z.coerce.number().min(0).default(0),
  juros: z.coerce.number().min(0).default(0),
  multa: z.coerce.number().min(0).default(0),
  valorPago: z.coerce.number().min(0).default(0),

  categoriaId: z.string().min(1, "Obrigatório"),
  subcategoriaId: optionalId,
  contaDreId: z.string().min(1, "Obrigatório"),
  centroCustoId: z.string().min(1, "Obrigatório"),
  regionalId: z.string().min(1, "Obrigatório"),
  projeto: z.string().optional(),
  contaBancariaId: z.string().min(1, "Obrigatório"),
  clienteId: optionalId,
  fornecedorId: optionalId,
  formaPagamento: z.enum([
    "DINHEIRO",
    "BOLETO",
    "PIX",
    "TED",
    "CARTAO",
    "CHEQUE",
    "OUTRO",
  ]),
  tipoPagamento: z.string().optional(),

  observacao: z.string().optional(),
  numeroDocumento: z.string().optional(),
  numeroNotaFiscal: z.string().optional(),
});

export type LancamentoFormValues = z.infer<typeof lancamentoSchema>;

export function computeValores(values: {
  valorOriginal: number;
  desconto: number;
  acrescimo: number;
  juros: number;
  multa: number;
  valorPago: number;
}) {
  const valorFinal =
    values.valorOriginal -
    values.desconto +
    values.acrescimo +
    values.juros +
    values.multa;
  const saldoAberto = valorFinal - values.valorPago;
  return { valorFinal, saldoAberto };
}
