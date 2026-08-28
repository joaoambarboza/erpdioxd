import Link from "next/link";
import { roleRank, roleLabels, type Role } from "@/lib/permissions";
import { Check, X } from "lucide-react";

const capabilities: { label: string; minRole: Role }[] = [
  { label: "Visualizar todos os módulos", minRole: "LEITURA" },
  {
    label: "Lançar, editar e excluir (Lançamentos, Contas, Cadastros, Fechamento, Orçamento, Projeções)",
    minRole: "FINANCEIRO",
  },
  { label: "Gerenciar usuários e perfis de acesso", minRole: "ADMIN" },
];

const roles = Object.keys(roleRank) as Role[];

export default function PermissoesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Permissões</h1>
        <p className="text-sm text-muted">
          O que cada perfil pode fazer. Para alterar o perfil de alguém, vá em{" "}
          <Link href="/usuarios" className="text-primary underline">
            Usuários
          </Link>
          .
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Capacidade</th>
              {roles.map((role) => (
                <th key={role} className="px-4 py-3 text-center font-medium">
                  {roleLabels[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capabilities.map((cap) => (
              <tr key={cap.label} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{cap.label}</td>
                {roles.map((role) => (
                  <td key={role} className="px-4 py-3 text-center">
                    {roleRank[role] >= roleRank[cap.minRole] ? (
                      <Check className="mx-auto text-entrada" size={18} />
                    ) : (
                      <X className="mx-auto text-muted" size={18} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted">
        Estas regras são aplicadas no servidor em toda ação de criar, editar ou excluir. Um
        usuário com perfil Leitura ainda vê os mesmos botões na tela, mas recebe uma mensagem de
        permissão ao tentar salvar.
      </p>
    </div>
  );
}
