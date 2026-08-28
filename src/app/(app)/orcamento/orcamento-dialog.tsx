"use client";

import * as React from "react";
import { useActionState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input } from "@/components/ui/field";
import { setOrcamento, type ActionState } from "./actions";

const initialState: ActionState = {};

export function OrcamentoDialog({
  ano,
  mes,
  categoriaId,
  categoriaNome,
  valorAtual,
  open,
  onClose,
}: {
  ano: number;
  mes: number;
  categoriaId: string;
  categoriaNome: string;
  valorAtual: number;
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(setOrcamento, initialState);
  const wasPending = React.useRef(false);

  React.useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      onClose();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state.error]);

  return (
    <Modal open={open} onClose={onClose} title={`Orçamento — ${categoriaNome}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="ano" value={ano} />
        <input type="hidden" name="mes" value={mes} />
        <input type="hidden" name="categoriaId" value={categoriaId} />

        <FieldGroup label="Valor orçado" htmlFor="valorOrcado">
          <Input
            id="valorOrcado"
            name="valorOrcado"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={valorAtual || undefined}
            autoFocus
          />
        </FieldGroup>

        {state.error && (
          <p className="rounded-md bg-saida-bg px-3 py-2 text-sm text-saida">{state.error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
