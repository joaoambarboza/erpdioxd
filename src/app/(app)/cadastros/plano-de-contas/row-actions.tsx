"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { deleteGrupoDRE, deleteContaDRE, type ActionState } from "./actions";
import { GrupoDialog } from "./grupo-dialog";
import { ContaDialog } from "./conta-dialog";

function DeleteConfirm({
  title,
  nome,
  onConfirm,
}: {
  title: string;
  nome: string;
  onConfirm: () => Promise<ActionState>;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  return (
    <>
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

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={title}>
        <p className="text-sm text-muted">
          Tem certeza que deseja excluir <strong>{nome}</strong>?
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
                const result = await onConfirm();
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
    </>
  );
}

export function GrupoRowActions({ id, nome, ordem }: { id: string; nome: string; ordem: number }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <GrupoDialog
        initial={{ id, nome, ordem }}
        trigger={
          <button type="button" className="rounded-md p-1.5 text-muted hover:bg-background hover:text-foreground" aria-label="Editar">
            <Pencil size={16} />
          </button>
        }
      />
      <DeleteConfirm title="Excluir grupo do DRE" nome={nome} onConfirm={() => deleteGrupoDRE(id)} />
    </div>
  );
}

export function ContaRowActions({
  id,
  nome,
  ordem,
  grupoId,
  grupos,
}: {
  id: string;
  nome: string;
  ordem: number;
  grupoId: string;
  grupos: { id: string; nome: string }[];
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ContaDialog
        grupos={grupos}
        initial={{ id, nome, ordem, grupoId }}
        trigger={
          <button type="button" className="rounded-md p-1.5 text-muted hover:bg-background hover:text-foreground" aria-label="Editar">
            <Pencil size={16} />
          </button>
        }
      />
      <DeleteConfirm title="Excluir conta do DRE" nome={nome} onConfirm={() => deleteContaDRE(id)} />
    </div>
  );
}
