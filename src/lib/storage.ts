import { mkdir, writeFile, unlink, readdir } from "fs/promises";
import path from "path";

const STORAGE_BASE = path.join(process.cwd(), "storage");
const ANEXOS_ROOT = path.join(STORAGE_BASE, "anexos");
const LOGO_ROOT = path.join(STORAGE_BASE, "logo");

export const MAX_ANEXO_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_ANEXO_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

export const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export async function saveAnexoFile(
  lancamentoId: string,
  fileId: string,
  originalName: string,
  buffer: Buffer
): Promise<string> {
  const dir = path.join(ANEXOS_ROOT, lancamentoId);
  await mkdir(dir, { recursive: true });

  const filename = `${fileId}-${sanitizeFilename(originalName)}`;
  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, buffer);

  return path.join(lancamentoId, filename);
}

export async function deleteAnexoFile(relativePath: string): Promise<void> {
  try {
    await unlink(path.join(ANEXOS_ROOT, relativePath));
  } catch {
    // arquivo já pode ter sido removido — não bloqueia a exclusão do registro
  }
}

export function resolveAnexoPath(relativePath: string): string {
  return path.join(ANEXOS_ROOT, relativePath);
}

/** Salva o logo, substituindo qualquer arquivo anterior — só existe um por vez. */
export async function saveLogoFile(originalName: string, buffer: Buffer): Promise<string> {
  await mkdir(LOGO_ROOT, { recursive: true });
  await clearLogoFiles();

  const ext = path.extname(originalName) || "";
  const filename = `logo${sanitizeFilename(ext)}`;
  await writeFile(path.join(LOGO_ROOT, filename), buffer);

  return filename;
}

export async function clearLogoFiles(): Promise<void> {
  try {
    const files = await readdir(LOGO_ROOT);
    await Promise.all(files.map((f) => unlink(path.join(LOGO_ROOT, f)).catch(() => {})));
  } catch {
    // diretório pode não existir ainda
  }
}

export function resolveLogoPath(relativePath: string): string {
  return path.join(LOGO_ROOT, relativePath);
}
