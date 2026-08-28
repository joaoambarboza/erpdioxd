"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { deleteCategoria } from "./actions";
import { CategoriaDialog, type CategoriaInitial, type CategoriaRoot } from "./categoria-dialog";

export function RowActions({
  initial,
  raizes,
}: {
  initial: CategoriaInitial;
  raizes: CategoriaRoot[];
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  return (
    <div className="flex items-center justify-end gap-1">
      <CategoriaDialog
        raizes={raizes}
        initial={initial}
        trigger={
          <button type="button" className="rounded-md p-1.5 text-muted hover:bg-background hover:text-foreground" aria-label="Editar">
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
          setConfirmOpen(true);
        }}
      >
        <Trash2 size={16} />
      </button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Excluir categoria">
        <p className="text-sm text-muted">
          Tem certeza que deseja excluir <strong>{initial.nome}</strong>?
        </p>
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
                const result = await deleteCategoria(initial.id);
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
