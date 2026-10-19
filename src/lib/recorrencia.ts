import { z } from "zod";

export const MAX_MESES_RECORRENCIA = 60;

/**
 * Campos de recorrência enviados pelo formulário de novo lançamento. `chave` é
 * um token gerado no cliente a cada abertura do formulário: é ele que impede
 * que um reenvio (duplo clique, retry de rede) gere a série duas vezes.
 */
export const recorrenciaSchema = z.object({
  meses: z.coerce
    .number({ error: "Informe a quantidade de meses" })
    .int("Deve ser um número inteiro")
    .min(2, "Mínimo de 2 (inclui o lançamento original)")
    .max(MAX_MESES_RECORRENCIA, `Máximo de ${MAX_MESES_RECORRENCIA} meses`),
  dia: z.coerce
    .number({ error: "Informe o dia do mês" })
    .int("Deve ser um número inteiro")
    .min(1, "Dia entre 1 e 31")
    .max(31, "Dia entre 1 e 31"),
  chave: z.string().min(8, "Requisição inválida. Reabra o formulário.").max(100),
});

export type RecorrenciaValues = z.infer<typeof recorrenciaSchema>;

export function diasNoMes(ano: number, mes: number) {
  // mes: 0–11. O dia 0 do mês seguinte é o último dia deste mês.
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

/**
 * Desloca `base` em `meses` meses (UTC). Se `dia` for informado, ele substitui o
 * dia de `base`. Quando o mês de destino não tem o dia pedido (31 em fevereiro),
 * usa o último dia do mês. Sempre calculado a partir de `base`, nunca de forma
 * cumulativa, para que um mês curto não "arraste" o dia dos meses seguintes.
 */
export function deslocarMes(base: Date, meses: number, dia?: number) {
  const total = base.getUTCFullYear() * 12 + base.getUTCMonth() + meses;
  const ano = Math.floor(total / 12);
  const mes = total - ano * 12;
  const diaDesejado = dia ?? base.getUTCDate();
  return new Date(Date.UTC(ano, mes, Math.min(diaDesejado, diasNoMes(ano, mes))));
}

export type ParcelaRecorrencia = {
  parcela: number;
  dataLancamento: Date;
  dataCompetencia: Date;
  dataVencimento: Date;
};

/**
 * Parcela 1 é o lançamento original, com as datas exatamente como digitadas.
 * Nas demais, o vencimento cai no `dia` escolhido; a competência avança o mesmo
 * número de meses (mantendo o próprio dia); a data do lançamento é repetida.
 */
export function gerarParcelas({
  dataLancamento,
  dataCompetencia,
  dataVencimento,
  meses,
  dia,
}: {
  dataLancamento: Date;
  dataCompetencia: Date;
  dataVencimento: Date;
  meses: number;
  dia: number;
}): ParcelaRecorrencia[] {
  return Array.from({ length: meses }, (_, i) => {
    if (i === 0) {
      return { parcela: 1, dataLancamento, dataCompetencia, dataVencimento };
    }
    return {
      parcela: i + 1,
      dataLancamento,
      dataCompetencia: deslocarMes(dataCompetencia, i),
      dataVencimento: deslocarMes(dataVencimento, i, dia),
    };
  });
}

export function descricaoComParcela(descricao: string, parcela: number, total: number) {
  return `${descricao} (${parcela}/${total})`;
}

/** "MM/AAAA" (UTC), usado nas mensagens de mês fechado. */
export function formatMesAno(data: Date) {
  return `${String(data.getUTCMonth() + 1).padStart(2, "0")}/${data.getUTCFullYear()}`;
}

/** Meses distintos (MM/AAAA), em ordem cronológica. */
export function mesesDistintos(datas: Date[]) {
  const unicos = new Map<number, Date>();
  for (const d of datas) unicos.set(d.getUTCFullYear() * 12 + d.getUTCMonth(), d);
  return [...unicos.entries()].sort((a, b) => a[0] - b[0]).map(([, d]) => formatMesAno(d));
}
