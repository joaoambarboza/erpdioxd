import { readFile } from "fs/promises";
import { getConfiguracao } from "@/lib/configuracao";
import { requireRole } from "@/lib/permissions";
import { resolveLogoPath } from "@/lib/storage";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET() {
  const check = await requireRole("LEITURA");
  if (check.error !== undefined) return new Response(check.error, { status: 401 });

  const configuracao = await getConfiguracao();
  if (!configuracao.logoPath) return new Response("Sem logo.", { status: 404 });

  const ext = configuracao.logoPath.slice(configuracao.logoPath.lastIndexOf("."));

  try {
    const buffer = await readFile(resolveLogoPath(configuracao.logoPath));
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new Response("Arquivo não encontrado.", { status: 404 });
  }
}
