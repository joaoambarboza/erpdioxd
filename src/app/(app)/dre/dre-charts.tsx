"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const tickFormatter = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);

const tooltipStyle = { borderRadius: 8, borderColor: "var(--border)", fontSize: 13 };

export type DreChartPoint = { periodo: string; projetado: number | null; realizado: number | null };

export function MargemLiquidaChart({ data }: { data: DreChartPoint[] }) {
  return (
    <Card>
      <h3 className="mb-1 text-sm font-semibold text-foreground">Margem líquida: Projetada x Realizada</h3>
      <p className="mb-4 text-xs text-muted">Resultado final ÷ Receita Líquida, por trimestre e no acumulado do ano fiscal</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(value) => (value == null ? "—" : `${Number(value).toFixed(1)}%`)}
              contentStyle={tooltipStyle}
            />
            <Legend />
            <Bar dataKey="projetado" name="Projetada" fill="var(--muted)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realizado" name="Realizada" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function GrupoTrimestresChart({ nome, data }: { nome: string; data: DreChartPoint[] }) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-foreground">{nome}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={tickFormatter} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="projetado" name="Projetado" fill="var(--muted)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realizado" name="Realizado" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
