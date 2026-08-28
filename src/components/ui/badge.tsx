import { cn } from "@/lib/utils";
import type { StatusLancamento, TipoLancamento } from "@/generated/prisma/enums";
import { roleLabels, type Role } from "@/lib/roles";

const statusLabels: Record<StatusLancamento, string> = {
  PROJETADO: "Projetado",
  EM_ABERTO: "Em aberto",
  PAGO: "Pago",
  RECEBIDO: "Recebido",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
  PARCIAL_PAGO: "Parcial. pago",
  PARCIAL_RECEBIDO: "Parcial. recebido",
};

const statusTones: Record<StatusLancamento, string> = {
  PROJETADO: "bg-background text-muted",
  EM_ABERTO: "bg-warning-bg text-warning",
  PAGO: "bg-entrada-bg text-entrada",
  RECEBIDO: "bg-entrada-bg text-entrada",
  VENCIDO: "bg-saida-bg text-saida",
  CANCELADO: "bg-background text-muted line-through",
  PARCIAL_PAGO: "bg-warning-bg text-warning",
  PARCIAL_RECEBIDO: "bg-warning-bg text-warning",
};

export function StatusBadge({ status }: { status: StatusLancamento }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusTones[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function TipoBadge({ tipo }: { tipo: TipoLancamento }) {
  const isEntrada = tipo === "ENTRADA";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        isEntrada ? "bg-entrada-bg text-entrada" : "bg-saida-bg text-saida"
      )}
    >
      {isEntrada ? "Entrada" : "Saída"}
    </span>
  );
}

export function FechamentoBadge({ status }: { status: "ABERTO" | "FECHADO" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "ABERTO" ? "bg-entrada-bg text-entrada" : "bg-background text-muted"
      )}
    >
      {status === "ABERTO" ? "Aberto" : "Fechado"}
    </span>
  );
}

const roleTones: Record<Role, string> = {
  ADMIN: "bg-primary/10 text-primary",
  FINANCEIRO: "bg-entrada-bg text-entrada",
  LEITURA: "bg-background text-muted",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        roleTones[role]
      )}
    >
      {roleLabels[role]}
    </span>
  );
}

export function AtivoBadge({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        ativo ? "bg-entrada-bg text-entrada" : "bg-background text-muted"
      )}
    >
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}
