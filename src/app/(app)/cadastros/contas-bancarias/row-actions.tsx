"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { deleteContaBancaria } from "./actions";
import { ContaBancariaDialog } from "./conta-bancaria-dialog";

export function RowActions({
  id,
  nome,
  banco,
  saldoInicial,
  ativo,
}: {
  id: string;
  nome: string;
  banco: string;
  saldoInicial: number;
  ativo: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  return (
    <div className="flex items-center justify-end gap-1">
      <ContaBancariaDialog
        initial={{ id, nome, banco, saldoInicial, ativo }}
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

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Excluir conta bancária">
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
                const result = await deleteContaBancaria(id);
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
