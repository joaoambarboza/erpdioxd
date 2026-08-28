"use client";

import { useState, useTransition } from "react";
import { Pencil, Power } from "lucide-react";
import { UsuarioDialog, type UsuarioInitial } from "./usuario-dialog";
import { ResetSenhaDialog } from "./reset-senha-dialog";
import { toggleAtivo } from "./actions";

export function RowActions({
  initial,
  ativo,
  isSelf,
}: {
  initial: UsuarioInitial;
  ativo: boolean;
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-1">
        <UsuarioDialog
          initial={initial}
          trigger={
            <button
              type="button"
              className="rounded-md p-1.5 text-muted hover:bg-background hover:text-foreground"
              aria-label="Editar"
            >
              <Pencil size={16} />
            </button>
          }
        />
        <ResetSenhaDialog id={initial.id} nome={initial.name} />
        <button
          type="button"
          disabled={isPending || isSelf}
          title={isSelf ? "Você não pode desativar sua própria conta" : undefined}
          className="rounded-md p-1.5 text-muted hover:bg-saida-bg hover:text-saida disabled:opacity-40"
          aria-label={ativo ? "Desativar" : "Ativar"}
          onClick={() => {
            setError(undefined);
            startTransition(async () => {
              const result = await toggleAtivo(initial.id);
              if (result.error) setError(result.error);
            });
          }}
        >
          <Power size={16} />
        </button>
      </div>
      {error && <p className="max-w-[200px] text-right text-xs text-saida">{error}</p>}
    </div>
  );
}
