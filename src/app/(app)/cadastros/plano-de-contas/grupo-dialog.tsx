"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Checkbox } from "@/components/ui/field";
import { createGrupoDRE, updateGrupoDRE, type ActionState } from "./actions";

const initialState: ActionState = {};

export function GrupoDialog({
  initial,
  trigger,
}: {
  initial?: {
    id: string;
    nome: string;
    ordem: number;
    subtotalLabel: string | null;
    mostrarPercentual: boolean;
  };
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(initial);
  const action = isEdit ? updateGrupoDRE.bind(null, initial!.id) : createGrupoDRE;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = React.useRef(false);

  React.useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <>
      <span onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button size="sm" variant="secondary">
            <Plus size={14} />
            Novo Grupo
          </Button>
        )}
      </span>

      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? "Editar Grupo do DRE" : "Novo Grupo do DRE"}>
        <form action={formAction} className="flex flex-col gap-4">
          <FieldGroup label="Nome" htmlFor="nome">
            <Input id="nome" name="nome" required defaultValue={initial?.nome} autoFocus />
          </FieldGroup>
          <FieldGroup label="Ordem" htmlFor="ordem">
            <Input id="ordem" name="ordem" type="number" min="0" defaultValue={initial?.ordem ?? 0} />
          </FieldGroup>
          <FieldGroup label="Rótulo do subtotal (opcional)" htmlFor="subtotalLabel">
            <Input
              id="subtotalLabel"
              name="subtotalLabel"
              defaultValue={initial?.subtotalLabel ?? ""}
              placeholder='Ex: "Lucro Bruto", "EBITDA"'
            />
          </FieldGroup>
          <p className="-mt-2 text-xs text-muted">
            Quando preenchido, a linha &quot;= Resultado parcial&quot; deste grupo passa a
            mostrar este rótulo em vez do texto genérico.
          </p>
          <Checkbox
            name="mostrarPercentual"
            defaultChecked={initial?.mostrarPercentual ?? false}
            label="Mostrar percentual sobre a Receita Bruta"
          />

          {state.error && (
            <p className="rounded-md bg-saida-bg px-3 py-2 text-sm text-saida">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
