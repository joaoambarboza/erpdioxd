"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export type ActionState = { error?: string };

const roleEnum = z.enum(["ADMIN", "FINANCEIRO", "LEITURA"]);

const createSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
  role: roleEnum,
});

const updateSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  email: z.string().email("E-mail inválido"),
  role: roleEnum,
});

export async function createUsuario(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("ADMIN");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }

  const existente = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existente) return { error: "Já existe um usuário com este e-mail." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const criado = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: "CRIAR",
    entidade: "User",
    entidadeId: criado.id,
    detalhes: `${criado.name} (${criado.email}) — ${criado.role}`,
  });

  revalidatePath("/usuarios");
  return {};
}

export async function updateUsuario(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("ADMIN");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }

  const existente = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existente && existente.id !== id) return { error: "Já existe um usuário com este e-mail." };

  const atualizado = await prisma.user.update({ where: { id }, data: parsed.data });

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: "EDITAR",
    entidade: "User",
    entidadeId: id,
    detalhes: `${atualizado.name} (${atualizado.email}) — ${atualizado.role}`,
  });

  revalidatePath("/usuarios");
  return {};
}

export async function resetSenha(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("ADMIN");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  const password = formData.get("password");
  const parsed = z.string().min(6, "Mínimo de 6 caracteres").safeParse(password);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Senha inválida." };

  const passwordHash = await bcrypt.hash(parsed.data, 10);
  const usuario = await prisma.user.update({ where: { id }, data: { passwordHash } });

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: "RESETAR_SENHA",
    entidade: "User",
    entidadeId: id,
    detalhes: usuario.email,
  });

  revalidatePath("/usuarios");
  return {};
}

export async function toggleAtivo(id: string): Promise<ActionState> {
  const check = await requireRole("ADMIN");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  if (id === session.user.id) {
    return { error: "Você não pode desativar sua própria conta." };
  }

  const usuario = await prisma.user.findUnique({ where: { id } });
  if (!usuario) return { error: "Usuário não encontrado." };

  const atualizado = await prisma.user.update({
    where: { id },
    data: { ativo: !usuario.ativo },
  });

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: atualizado.ativo ? "ATIVAR" : "DESATIVAR",
    entidade: "User",
    entidadeId: id,
    detalhes: atualizado.email,
  });

  revalidatePath("/usuarios");
  return {};
}
