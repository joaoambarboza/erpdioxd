import { Prisma } from "@/generated/prisma/client";

export const RESTRICT_DELETE_MESSAGE =
  "Não é possível excluir: existem registros vinculados a este cadastro. Desative-o em vez de excluir.";

export function isRestrictError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
