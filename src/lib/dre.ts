/**
 * Regras puras da DRE (sem acesso a banco): rótulo "Receita Líquida", períodos
 * (trimestres fiscais + acumulado), montagem das linhas e margem líquida.
 * A consulta ao banco fica em `financials.ts`.
 */

export type DreValores = { projetado: number; realizado: number };
export type DrePercentual = { projetado: number | null; realizado: number | null };

export const ZERO_DRE: DreValores = { projetado: 0, realizado: 0 };

// ---------- Rótulo "Receita Líquida" ----------

export const RECEITA_LIQUIDA_LABEL = "Receita Líquida";

function normalizarRotulo(label: string) {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Aceita variações de caixa/acento/espaços, para dados antigos continuarem funcionando. */
export function ehReceitaLiquida(label: string | null | undefined) {
  return label != null && normalizarRotulo(label) === normalizarRotulo(RECEITA_LIQUIDA_LABEL);
}

/** Rótulo gravado: sem espaços nas pontas e, para Receita Líquida, sempre na grafia padrão. */
export function padronizarRotuloSubtotal(label: string | null | undefined) {
  const trimmed = label?.trim() ?? "";
  if (!trimmed) return null;
  return ehReceitaLiquida(trimmed) ? RECEITA_LIQUIDA_LABEL : trimmed;
}

// ---------- Períodos ----------

export type DrePeriodoKey = "T1" | "T2" | "T3" | "T4" | "ACUM";

export const DRE_TRIMESTRES: Exclude<DrePeriodoKey, "ACUM">[] = ["T1", "T2", "T3", "T4"];
export const DRE_PERIODOS: DrePeriodoKey[] = [...DRE_TRIMESTRES, "ACUM"];

const monthShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function labelPeriodo(key: DrePeriodoKey, mesInicioAnoFiscal: number, curto = false) {
  if (key === "ACUM") return curto ? "Acumulado" : "Acumulado do ano fiscal";
  const trimestre = Number(key.slice(1));
  if (curto) return key;
  const startIdx = (mesInicioAnoFiscal - 1 + (trimestre - 1) * 3) % 12;
  const meses = [0, 1, 2].map((offset) => monthShort[(startIdx + offset) % 12]);
  return `${key} (${meses.join("-")})`;
}

/** Intervalo [start, end) do trimestre fiscal `trimestre` (1–4) do ano fiscal `ano`. */
export function intervaloTrimestre(ano: number, trimestre: number, mesInicioAnoFiscal: number) {
  const offset = (trimestre - 1) * 3;
  return {
    periodStart: new Date(Date.UTC(ano, mesInicioAnoFiscal - 1 + offset, 1)),
    periodEnd: new Date(Date.UTC(ano, mesInicioAnoFiscal - 1 + offset + 3, 1)),
  };
}

/**
 * Períodos marcados na tela, em ordem fixa. Param `periodos=T1,T3,ACUM`.
 * Sem nada válido, mostra tudo.
 */
export function parsePeriodosDre(params: Record<string, string | string[] | undefined>): DrePeriodoKey[] {
  const raw = params.periodos;
  const tokens = (Array.isArray(raw) ? raw : raw ? [raw] : []).flatMap((v) => v.split(","));
  const marcados = new Set(tokens.map((t) => t.trim().toUpperCase()));
  const validos = DRE_PERIODOS.filter((p) => marcados.has(p));
  return validos.length > 0 ? validos : DRE_PERIODOS;
}

// ---------- Montagem ----------

export type DreGrupoInput = {
  id: string;
  nome: string;
  subtotalLabel: string | null;
  mostrarPercentual: boolean;
  contas: { id: string; nome: string; regime: "CAIXA" | "COMPETENCIA" }[];
};

export type DreLinhaGrupo = {
  id: string;
  nome: string;
  /** Null quando o rótulo está em branco: a linha de subtotal não é exibida (nem título, nem valor). */
  subtotalLabel: string | null;
  mostrarPercentual: boolean;
  contas: { id: string; nome: string; regime: "CAIXA" | "COMPETENCIA"; projetado: number; realizado: number }[];
  totalGrupo: DreValores;
  resultadoParcial: DreValores;
  /** Percentual do resultado parcial sobre a Receita Líquida; null se não se aplica. */
  percentual: DrePercentual | null;
};

export type DreTotais = { receita: DreValores; despesas: DreValores };

export type DreResultado = {
  linhasGrupo: DreLinhaGrupo[];
  receita: DreValores;
  despesas: DreValores;
  resultado: DreValores;
  /** Resultado parcial do grupo cujo subtotal é "Receita Líquida"; null se nenhum grupo tem esse rótulo. */
  receitaLiquida: DreValores | null;
  /** Resultado parcial do último grupo da DRE (lucro líquido). */
  resultadoFinal: DreValores;
  /** Resultado final ÷ Receita Líquida, em %. Null quando não há Receita Líquida ou ela é zero. */
  margemLiquida: DrePercentual;
};

export function somarValores(a: DreValores, b: DreValores): DreValores {
  return { projetado: a.projetado + b.projetado, realizado: a.realizado + b.realizado };
}

export function somarMapas(mapas: Map<string, DreValores>[]) {
  const soma = new Map<string, DreValores>();
  for (const mapa of mapas) {
    for (const [id, v] of mapa) soma.set(id, somarValores(soma.get(id) ?? ZERO_DRE, v));
  }
  return soma;
}

function razaoPercentual(valor: number, base: number | undefined) {
  return base === undefined || base === 0 ? null : (valor / base) * 100;
}

export function montarDre(
  grupos: DreGrupoInput[],
  valoresPorConta: Map<string, DreValores>,
  totais: DreTotais
): DreResultado {
  const linhasGrupo = grupos.reduce<DreLinhaGrupo[]>((linhas, grupo) => {
    const contas = grupo.contas.map((conta) => ({
      id: conta.id,
      nome: conta.nome,
      regime: conta.regime,
      projetado: valoresPorConta.get(conta.id)?.projetado ?? 0,
      realizado: valoresPorConta.get(conta.id)?.realizado ?? 0,
    }));
    const totalGrupo: DreValores = {
      projetado: contas.reduce((acc, c) => acc + c.projetado, 0),
      realizado: contas.reduce((acc, c) => acc + c.realizado, 0),
    };
    const anterior = linhas.at(-1)?.resultadoParcial ?? ZERO_DRE;
    linhas.push({
      id: grupo.id,
      nome: grupo.nome,
      subtotalLabel: grupo.subtotalLabel?.trim() || null,
      mostrarPercentual: grupo.mostrarPercentual,
      contas,
      totalGrupo,
      resultadoParcial: somarValores(anterior, totalGrupo),
      percentual: null,
    });
    return linhas;
  }, []);

  const receitaLiquida = linhasGrupo.find((l) => ehReceitaLiquida(l.subtotalLabel))?.resultadoParcial ?? null;

  for (const linha of linhasGrupo) {
    if (!linha.mostrarPercentual || !receitaLiquida) continue;
    linha.percentual = {
      projetado: razaoPercentual(linha.resultadoParcial.projetado, receitaLiquida.projetado),
      realizado: razaoPercentual(linha.resultadoParcial.realizado, receitaLiquida.realizado),
    };
  }

  const resultadoFinal = linhasGrupo.at(-1)?.resultadoParcial ?? ZERO_DRE;

  return {
    linhasGrupo,
    receita: totais.receita,
    despesas: totais.despesas,
    resultado: {
      projetado: totais.receita.projetado - totais.despesas.projetado,
      realizado: totais.receita.realizado - totais.despesas.realizado,
    },
    receitaLiquida,
    resultadoFinal,
    margemLiquida: {
      projetado: razaoPercentual(resultadoFinal.projetado, receitaLiquida?.projetado),
      realizado: razaoPercentual(resultadoFinal.realizado, receitaLiquida?.realizado),
    },
  };
}
