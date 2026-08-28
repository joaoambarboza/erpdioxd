"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Paperclip, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadAnexo, deleteAnexo, type ActionState } from "./anexos-actions";

const initialState: ActionState = {};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AnexosSection({
  lancamentoId,
  anexos,
}: {
  lancamentoId: string | null;
  anexos: { id: string; nomeArquivo: string; tamanho: number }[];
}) {
  const uploadAction = lancamentoId ? uploadAnexo.bind(null, lancamentoId) : null;
  const [state, formAction, pending] = useActionState(uploadAction ?? uploadAnexo.bind(null, ""), initialState);
  const [isDeleting, startDeleteTransition] = useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const wasPending = React.useRef(false);

  React.useEffect(() => {
    if (wasPending.current && !pending && !state.error && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  if (!lancamentoId) {
    return (
      <section>
        <h3 className="mb-3 text-sm font-semibold text-muted">Anexos</h3>
        <p className="text-sm text-muted">Salve o lançamento para anexar arquivos.</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-muted">Anexos</h3>

      {anexos.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {anexos.map((anexo) => (
            <li
              key={anexo.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <Paperclip size={14} className="shrink-0 text-muted" />
                <span className="truncate">{anexo.nomeArquivo}</span>
                <span className="shrink-0 text-xs text-muted">{formatBytes(anexo.tamanho)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={`/api/anexos/${anexo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-muted hover:bg-background hover:text-foreground"
                  aria-label="Baixar"
                >
                  <Download size={16} />
                </a>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="rounded-md p-1.5 text-muted hover:bg-saida-bg hover:text-saida disabled:opacity-50"
                  aria-label="Remover"
                  onClick={() => {
                    startDeleteTransition(() => {
                      deleteAnexo(anexo.id);
                    });
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          required
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
          className="flex-1 text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? "Enviando..." : "Anexar"}
        </Button>
      </form>
      {state.error && <p className="mt-2 text-sm text-saida">{state.error}</p>}
      <p className="mt-1 text-xs text-muted">PDF, imagem ou documento do Office. Máximo 10MB.</p>
    </section>
  );
}
