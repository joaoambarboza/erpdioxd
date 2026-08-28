"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Checkbox } from "@/components/ui/field";
import { createRegional, updateRegional, type ActionState } from "./actions";

const initialState: ActionState = {};

export function RegionalDialog({
  initial,
  trigger,
}: {
  initial?: { id: string; nome: string; ativo: boolean };
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(initial);
  const action = isEdit ? updateRegional.bind(null, initial!.id) : createRegional;
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
          <Button>
            <Plus size={16} />
            Nova Regional
          </Button>
        )}
      </span>

      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? "Editar Regional" : "Nova Regional"}>
        <form action={formAction} className="flex flex-col gap-4">
          <FieldGroup label="Nome" htmlFor="nome">
            <Input id="nome" name="nome" required defaultValue={initial?.nome} autoFocus />
          </FieldGroup>
          <Checkbox name="ativo" defaultChecked={initial?.ativo ?? true} label="Ativo" />

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
