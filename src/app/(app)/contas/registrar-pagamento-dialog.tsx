"use client";

import * as React from "react";
import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input } from "@/components/ui/field";
import { formatCurrency } from "@/lib/utils";
import { registrarPagamento, type ActionState } from "./actions";

const initialState: ActionState = {};

export function RegistrarPagamentoDialog({
  id,
  descricao,
  saldoAberto,
  tipo,
  revalidatePaths,
}: {
  id: string;
  descricao: string;
  saldoAberto: number;
  tipo: "ENTRADA" | "SAIDA";
  revalidatePaths: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const action = registrarPagamento.bind(null, id, revalidatePaths);
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = React.useRef(false);
  const label = tipo === "ENTRADA" ? "recebimento" : "pagamento";

  React.useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  if (saldoAberto <= 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-background"
      >
        <CircleCheck size={14} />
        Registrar {label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Registrar ${label}`}
      >
        <p className="mb-4 text-sm text-muted">
          <strong>{descricao}</strong> — saldo em aberto: {formatCurrency(saldoAberto)}
        </p>
        <form action={formAction} className="flex flex-col gap-4">
          <FieldGroup label={`Valor ${tipo === "ENTRADA" ? "recebido" : "pago"} agora`} htmlFor="valorRegistrado">
            <Input
              id="valorRegistrado"
              name="valorRegistrado"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={saldoAberto}
              autoFocus
            />
          </FieldGroup>
          <FieldGroup label={`Data do ${label}`} htmlFor="dataPagamento">
            <Input
              id="dataPagamento"
              name="dataPagamento"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </FieldGroup>

          {state.error && (
            <p className="rounded-md bg-saida-bg px-3 py-2 text-sm text-saida">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
