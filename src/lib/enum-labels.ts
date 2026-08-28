export const tipoLabels = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
} as const;

export const naturezaLabels = {
  RECEITA: "Receita",
  CUSTO: "Custo",
  DESPESA: "Despesa",
  TRANSFERENCIA: "Transferência",
  INVESTIMENTO: "Investimento",
  EMPRESTIMO: "Empréstimo",
  FINANCIAMENTO: "Financiamento",
  IMPOSTO: "Imposto",
  OUTROS: "Outros",
} as const;

export const statusLabels = {
  PROJETADO: "Projetado",
  EM_ABERTO: "Em aberto",
  PAGO: "Pago",
  RECEBIDO: "Recebido",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
  PARCIAL_PAGO: "Parcialmente pago",
  PARCIAL_RECEBIDO: "Parcialmente recebido",
} as const;

export const formaPagamentoLabels = {
  DINHEIRO: "Dinheiro",
  BOLETO: "Boleto",
  PIX: "Pix",
  TED: "TED",
  CARTAO: "Cartão",
  CHEQUE: "Cheque",
  OUTRO: "Outro",
} as const;
