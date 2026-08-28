"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Select } from "@/components/ui/field";
import { createContaDRE, updateContaDRE, type ActionState } from "./actions";

const initialState: ActionState = {};

export function ContaDialog({
  grupos,
  initial,
  trigger,
}: {
  grupos: { id: string; nome: string }[];
  initial?: { id: string; nome: string; ordem: number; grupoId: string };
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(initial);
  const action = isEdit ? updateContaDRE.bind(null, initial!.id) : createContaDRE;
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
            Nova Conta
          </Button>
        )}
      </span>

      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? "Editar Conta do DRE" : "Nova Conta do DRE"}>
        <form action={formAction} className="flex flex-col gap-4">
          <FieldGroup label="Nome" htmlFor="nome">
            <Input id="nome" name="nome" required defaultValue={initial?.nome} autoFocus />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Grupo" htmlFor="grupoId">
              <Select id="grupoId" name="grupoId" required defaultValue={initial?.grupoId}>
                <option value="">Selecione</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Ordem" htmlFor="ordem">
              <Input id="ordem" name="ordem" type="number" min="0" defaultValue={initial?.ordem ?? 0} />
            </FieldGroup>
          </div>

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
