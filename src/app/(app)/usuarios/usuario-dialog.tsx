"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Select } from "@/components/ui/field";
import { roleLabels, type Role } from "@/lib/roles";
import { createUsuario, updateUsuario, type ActionState } from "./actions";

const initialState: ActionState = {};

export type UsuarioInitial = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export function UsuarioDialog({
  initial,
  trigger,
}: {
  initial?: UsuarioInitial;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(initial);
  const action = isEdit ? updateUsuario.bind(null, initial!.id) : createUsuario;
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
            Novo Usuário
          </Button>
        )}
      </span>

      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? "Editar Usuário" : "Novo Usuário"}>
        <form action={formAction} className="flex flex-col gap-4">
          <FieldGroup label="Nome" htmlFor="name">
            <Input id="name" name="name" required defaultValue={initial?.name} autoFocus />
          </FieldGroup>
          <FieldGroup label="E-mail" htmlFor="email">
            <Input id="email" name="email" type="email" required defaultValue={initial?.email} />
          </FieldGroup>
          {!isEdit && (
            <FieldGroup label="Senha" htmlFor="password">
              <Input id="password" name="password" type="password" required minLength={6} />
            </FieldGroup>
          )}
          <FieldGroup label="Perfil" htmlFor="role">
            <Select id="role" name="role" defaultValue={initial?.role ?? "FINANCEIRO"}>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
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
