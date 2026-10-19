"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { deleteLancamento, type EscopoSerie } from "./actions";
import { LancamentoDialog, type LancamentoInitial, type LancamentoOptions } from "./lancamento-dialog";

export function RowActions({
  id,
  descricao,
  initial,
  options,
}: {
  id: string;
  descricao: string;
  initial: LancamentoInitial;
  options: LancamentoOptions;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [escopo, setEscopo] = useState<EscopoSerie>("este");
  const emSerie = Boolean(initial.recorrenciaId);

  return (
    <div className="flex items-center justify-end gap-1">
      <LancamentoDialog
        options={options}
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
      <button
        type="button"
        className="rounded-md p-1.5 text-muted hover:bg-saida-bg hover:text-saida"
        aria-label="Excluir"
        onClick={() => {
          setDeleteError(undefined);
          setEscopo("este");
          setConfirmOpen(true);
        }}
      >
        <Trash2 size={16} />
      </button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Excluir lançamento"
      >
        <p className="text-sm text-muted">
          Tem certeza que deseja excluir <strong>{descricao}</strong>? Esta
          ação não pode ser desfeita.
        </p>
        {emSerie && (
          <fieldset className="mt-4 flex flex-col gap-1.5">
            <legend className="mb-1 text-sm font-medium text-foreground">
              Este lançamento faz parte de uma recorrência
            </legend>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="escopo-exclusao"
                checked={escopo === "este"}
                onChange={() => setEscopo("este")}
              />
              Excluir somente este lançamento
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="escopo-exclusao"
                checked={escopo === "seguintes"}
                onChange={() => setEscopo("seguintes")}
              />
              Excluir este e os seguintes
            </label>
          </fieldset>
        )}
        {deleteError && (
          <p className="mt-3 rounded-md bg-saida-bg px-3 py-2 text-sm text-saida">{deleteError}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await deleteLancamento(id, escopo);
                if (result.error) {
                  setDeleteError(result.error);
                } else {
                  setConfirmOpen(false);
                }
              });
            }}
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
