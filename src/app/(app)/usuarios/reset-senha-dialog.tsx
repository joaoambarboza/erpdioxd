"use client";

import * as React from "react";
import { useActionState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input } from "@/components/ui/field";
import { resetSenha, type ActionState } from "./actions";

const initialState: ActionState = {};

export function ResetSenhaDialog({ id, nome }: { id: string; nome: string }) {
  const [open, setOpen] = React.useState(false);
  const action = resetSenha.bind(null, id);
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
      <button
        type="button"
        className="rounded-md px-2 py-1 text-xs text-muted hover:bg-background hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        Redefinir senha
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Redefinir senha — ${nome}`}>
        <form action={formAction} className="flex flex-col gap-4">
          <FieldGroup label="Nova senha" htmlFor="password">
            <Input id="password" name="password" type="password" required minLength={6} autoFocus />
          </FieldGroup>

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
