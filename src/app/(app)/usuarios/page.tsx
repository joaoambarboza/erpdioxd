import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { AtivoBadge, RoleBadge } from "@/components/ui/badge";
import type { Role } from "@/lib/permissions";
import { UsuarioDialog } from "./usuario-dialog";
import { RowActions } from "./row-actions";

export default async function UsuariosPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="text-xl font-semibold text-foreground">Usuários</h1>
        <p className="mt-2 text-sm text-muted">
          Apenas administradores podem gerenciar usuários.
        </p>
      </div>
    );
  }

  const usuarios = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Usuários</h1>
          <p className="text-sm text-muted">{usuarios.length} usuário(s) cadastrado(s)</p>
        </div>
        <UsuarioDialog />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Criado em</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role as Role} />
                </td>
                <td className="px-4 py-3">
                  <AtivoBadge ativo={u.ativo} />
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <RowActions
                    initial={{ id: u.id, name: u.name, email: u.email, role: u.role as Role }}
                    ativo={u.ativo}
                    isSelf={u.id === session?.user?.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
