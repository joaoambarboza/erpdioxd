import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  const toneClasses = {
    default: "text-foreground",
    positive: "text-entrada",
    negative: "text-saida",
    warning: "text-warning",
  } as const;

  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className={cn("text-2xl font-semibold", toneClasses[tone])}>
        {value}
      </span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </Card>
  );
}

export function ComparisonCard({
  label,
  projetado,
  realizado,
  formatValue,
}: {
  label: string;
  projetado: number;
  realizado: number;
  formatValue: (value: number) => string;
}) {
  const desvio = realizado - projetado;
  const desvioPercent = projetado !== 0 ? (desvio / Math.abs(projetado)) * 100 : null;

  return (
    <Card className="flex flex-col gap-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-xs text-muted">Projetado</p>
          <p className="text-lg font-semibold text-foreground">{formatValue(projetado)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Realizado</p>
          <p className="text-lg font-semibold text-foreground">{formatValue(realizado)}</p>
        </div>
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          desvio >= 0 ? "text-entrada" : "text-saida"
        )}
      >
        Desvio: {formatValue(desvio)}
        {desvioPercent !== null && ` (${desvioPercent >= 0 ? "+" : ""}${desvioPercent.toFixed(1)}%)`}
      </span>
    </Card>
  );
}
