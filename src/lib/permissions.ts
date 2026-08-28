import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import { roleRank, type Role } from "@/lib/roles";

export { roleRank, roleLabels, type Role } from "@/lib/roles";

export async function requireRole(
  minRole: Role
): Promise<{ error: string; session?: undefined } | { error?: undefined; session: Session }> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado." };

  const userRole = session.user.role as Role;
  if (roleRank[userRole] < roleRank[minRole]) {
    return { error: "Seu perfil não tem permissão para esta ação." };
  }

  return { session };
}
