export const roleRank = { LEITURA: 0, FINANCEIRO: 1, ADMIN: 2 } as const;

export type Role = keyof typeof roleRank;

export const roleLabels: Record<Role, string> = {
  LEITURA: "Leitura",
  FINANCEIRO: "Financeiro",
  ADMIN: "Administrador",
};
