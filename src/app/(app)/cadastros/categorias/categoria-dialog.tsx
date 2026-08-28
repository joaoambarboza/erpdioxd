"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Select, Checkbox } from "@/components/ui/field";
import { tipoLabels } from "@/lib/enum-labels";
import { createCategoria, updateCategoria, type ActionState } from "./actions";

const initialState: ActionState = {};

export type CategoriaInitial = {
  id: string;
  nome: string;
  tipo: "ENTRADA" | "SAIDA";
  parentId: string | null;
  ativo: boolean;
};

export type CategoriaRoot = { id: string; nome: string; tipo: "ENTRADA" | "SAIDA" };

export function CategoriaDialog({
  raizes,
  initial,
  trigger,
}: {
  raizes: CategoriaRoot[];
  initial?: CategoriaInitial;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(initial);
  const action = isEdit ? updateCategoria.bind(null, initial!.id) : createCategoria;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = React.useRef(false);
  const [tipo, setTipo] = React.useState<"ENTRADA" | "SAIDA">(initial?.tipo ?? "ENTRADA");

  React.useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  const raizesFiltradas = raizes.filter((r) => r.tipo === tipo && r.id !== initial?.id);

  return (
    <>
      <span onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button>
            <Plus size={16} />
            Nova Categoria
          </Button>
        )}
      </span>

      <Modal open={open} onClose={() => setOpen(false)} title={isEdit ? "Editar Categoria" : "Nova Categoria"}>
        <form action={formAction} className="flex flex-col gap-4">
          <FieldGroup label="Nome" htmlFor="nome">
            <Input id="nome" name="nome" required defaultValue={initial?.nome} autoFocus />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Tipo" htmlFor="tipo">
              <Select
                id="tipo"
                name="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "ENTRADA" | "SAIDA")}
              >
                {Object.entries(tipoLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Categoria pai" htmlFor="parentId">
              <Select id="parentId" name="parentId" defaultValue={initial?.parentId ?? ""}>
                <option value="">Nenhuma (categoria raiz)</option>
                {raizesFiltradas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>
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
