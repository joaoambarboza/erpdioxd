import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { resolveAnexoPath } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireRole("LEITURA");
  if (check.error !== undefined) return new Response(check.error, { status: 401 });

  const { id } = await params;
  const anexo = await prisma.anexo.findUnique({ where: { id } });
  if (!anexo) return new Response("Anexo não encontrado.", { status: 404 });

  try {
    const buffer = await readFile(resolveAnexoPath(anexo.caminhoArquivo));
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": anexo.tipoMime,
        "Content-Disposition": `inline; filename="${anexo.nomeArquivo}"`,
        "Content-Length": String(anexo.tamanho),
      },
    });
  } catch {
    return new Response("Arquivo não encontrado no armazenamento.", { status: 404 });
  }
}
