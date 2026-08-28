"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Checkbox } from "@/components/ui/field";
import { createContaBancaria, updateContaBancaria, type ActionState } from "./actions";

const initialState: ActionState = {};

export function ContaBancariaDialog({
  initial,
  trigger,
}: {
  initial?: { id: string; nome: string; banco: string; saldoInicial: number; ativo: boolean };
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(initial);
  const action = isEdit ? updateContaBancaria.bind(null, initial!.id) : createContaBancaria;
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
            Nova Conta Bancária
          </Button>
        )}
      </span>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "Editar Conta Bancária" : "Nova Conta Bancária"}
      >
        <form action={formAction} className="flex flex-col gap-4">
          <FieldGroup label="Nome" htmlFor="nome">
            <Input id="nome" name="nome" required defaultValue={initial?.nome} autoFocus />
          </FieldGroup>
          <FieldGroup label="Banco" htmlFor="banco">
            <Input id="banco" name="banco" required defaultValue={initial?.banco} />
          </FieldGroup>
          <FieldGroup label="Saldo inicial" htmlFor="saldoInicial">
            <Input
              id="saldoInicial"
              name="saldoInicial"
              type="number"
              step="0.01"
              defaultValue={initial?.saldoInicial ?? 0}
            />
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
