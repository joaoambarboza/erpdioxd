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

export function ReceitaProjetadoRealizadoChart({
  data,
}: {
  data: { mes: string; projetado: number; realizado: number }[];
}) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Receita: Projetado x Realizado
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={tickFormatter} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ borderRadius: 8, borderColor: "var(--border)", fontSize: 13 }}
            />
            <Legend />
            <Bar dataKey="projetado" name="Projetado" fill="var(--muted)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realizado" name="Realizado" fill="var(--entrada)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function DespesaProjetadoRealizadoChart({
  data,
}: {
  data: { mes: string; projetado: number; realizado: number }[];
}) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Despesas: Projetado x Realizado
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={tickFormatter} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ borderRadius: 8, borderColor: "var(--border)", fontSize: 13 }}
            />
            <Legend />
            <Bar dataKey="projetado" name="Projetado" fill="var(--muted)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realizado" name="Realizado" fill="var(--saida)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
