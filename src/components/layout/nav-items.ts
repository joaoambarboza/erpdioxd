export type NavItem = {
  label: string;
  href?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    title: "Visão Geral",
    items: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Lançamentos", href: "/lancamentos" },
      { label: "Contas a Receber", href: "/contas-a-receber" },
      { label: "Contas a Pagar", href: "/contas-a-pagar" },
      { label: "Fluxo de Caixa", href: "/fluxo-de-caixa" },
      { label: "DRE", href: "/dre" },
      { label: "Projetado x Realizado", href: "/projetado-x-realizado" },
      { label: "Fechamento Mensal", href: "/fechamento-mensal" },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { label: "Clientes", href: "/cadastros/clientes" },
      { label: "Fornecedores", href: "/cadastros/fornecedores" },
      { label: "Centros de Custo", href: "/cadastros/centros-de-custo" },
      { label: "Regionais", href: "/cadastros/regionais" },
      { label: "Categorias", href: "/cadastros/categorias" },
      { label: "Plano de Contas", href: "/cadastros/plano-de-contas" },
      { label: "Contas Bancárias", href: "/cadastros/contas-bancarias" },
    ],
  },
  {
    title: "Planejamento",
    items: [
      { label: "Projeções", href: "/projecoes" },
      { label: "Orçamento", href: "/orcamento" },
    ],
  },
  {
    title: "Relatórios",
    items: [
      { label: "Relatórios", href: "/relatorios" },
      { label: "Exportar Excel", href: "/exportar-excel" },
    ],
  },
  {
    title: "Administração",
    items: [
      { label: "Configurações", href: "/configuracoes" },
      { label: "Usuários", href: "/usuarios" },
      { label: "Permissões", href: "/permissoes" },
      { label: "Auditoria", href: "/auditoria" },
    ],
  },
];
