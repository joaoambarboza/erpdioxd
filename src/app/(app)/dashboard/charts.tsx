"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
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

export function EntradasSaidasChart({
  data,
}: {
  data: { mes: string; entradas: number; saidas: number }[];
}) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Entradas x Saídas por mês
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={tickFormatter} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: 8,
                borderColor: "var(--border)",
                fontSize: 13,
              }}
            />
            <Legend />
            <Bar dataKey="entradas" name="Entradas" fill="var(--entrada)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="saidas" name="Saídas" fill="var(--saida)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function EvolucaoCaixaChart({ data }: { data: { mes: string; saldo: number }[] }) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Evolução do Caixa
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={tickFormatter} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: 8,
                borderColor: "var(--border)",
                fontSize: 13,
              }}
            />
            <Line
              type="monotone"
              dataKey="saldo"
              name="Saldo final"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function DespesasPorCategoriaChart({
  data,
}: {
  data: { categoria: string; valor: number }[];
}) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Despesas por Categoria
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={tickFormatter} />
            <YAxis type="category" dataKey="categoria" tick={{ fontSize: 12 }} width={120} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: 8,
                borderColor: "var(--border)",
                fontSize: 13,
              }}
            />
            <Bar dataKey="valor" name="Despesas" fill="var(--saida)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
