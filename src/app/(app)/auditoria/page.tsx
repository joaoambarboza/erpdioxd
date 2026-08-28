import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { AuditoriaFilters } from "./filters";
import { acaoLabels } from "./acao-labels";
import type { Prisma } from "@/generated/prisma/client";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="text-xl font-semibold text-foreground">Auditoria</h1>
        <p className="mt-2 text-sm text-muted">Apenas administradores podem ver o log de auditoria.</p>
      </div>
    );
  }

  const params = await searchParams;
  const str = (key: string) => (typeof params[key] === "string" && params[key] ? (params[key] as string) : undefined);

  const where: Prisma.AuditLogWhereInput = {};
  const userId = str("userId");
  if (userId) where.userId = userId;
  const acao = str("acao");
  if (acao) where.acao = acao;
  const de = str("de");
  const ate = str("ate");
  if (de || ate) {
    where.createdAt = {
      ...(de ? { gte: new Date(de) } : {}),
      ...(ate ? { lte: new Date(`${ate}T23:59:59`) } : {}),
    };
  }

  const [logs, usuarios] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Auditoria</h1>
        <p className="text-sm text-muted">Últimas {logs.length} ações registradas</p>
      </div>

      <AuditoriaFilters usuarios={usuarios.map((u) => ({ id: u.id, nome: u.name }))} />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Data/Hora</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Ação</th>
              <th className="px-4 py-3 font-medium">Entidade</th>
              <th className="px-4 py-3 font-medium">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3 whitespace-nowrap text-muted">
                  {formatDate(log.createdAt)} {log.createdAt.toISOString().slice(11, 16)}
                </td>
                <td className="px-4 py-3">{log.userName}</td>
                <td className="px-4 py-3">{acaoLabels[log.acao] ?? log.acao}</td>
                <td className="px-4 py-3 text-muted">{log.entidade}</td>
                <td className="px-4 py-3 text-muted">{log.detalhes ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
