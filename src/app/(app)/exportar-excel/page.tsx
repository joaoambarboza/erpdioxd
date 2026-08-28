import { Card } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";

const reports = [
  {
    href: "/api/relatorios/lancamentos",
    title: "Lançamentos",
    description: "Todos os lançamentos financeiros, sem filtro.",
  },
  {
    href: "/api/relatorios/dre",
    title: "DRE",
    description: "Demonstração de resultado do mês atual.",
  },
  {
    href: "/api/relatorios/fluxo-de-caixa",
    title: "Fluxo de Caixa",
    description: "Ledger mensal com saldo inicial e final.",
  },
  {
    href: "/api/relatorios/contas-a-receber",
    title: "Contas a Receber",
    description: "Todos os recebimentos em aberto e quitados.",
  },
  {
    href: "/api/relatorios/contas-a-pagar",
    title: "Contas a Pagar",
    description: "Todos os pagamentos em aberto e quitados.",
  },
];

export default function ExportarExcelPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Exportar Excel</h1>
        <p className="text-sm text-muted">Baixe qualquer relatório em formato .xlsx</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.href} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="text-primary" size={20} />
              <h2 className="font-semibold text-foreground">{report.title}</h2>
            </div>
            <p className="text-sm text-muted">{report.description}</p>
            <a
              href={report.href}
              className="mt-auto inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-background"
            >
              Baixar Excel
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
