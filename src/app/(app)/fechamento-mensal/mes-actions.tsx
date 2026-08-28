"use client";

import { useState, useTransition } from "react";
import { Lock, LockOpen } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { fecharMes, reabrirMes } from "./actions";

export function MesActions({
  ano,
  mes,
  mesLabel,
  status,
  pendentes,
}: {
  ano: number;
  mes: number;
  mesLabel: string;
  status: "ABERTO" | "FECHADO";
  pendentes: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (status === "FECHADO") {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await reabrirMes(ano, mes);
          });
        }}
      >
        <LockOpen size={14} />
        Reabrir mês
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setError(undefined);
          setConfirmOpen(true);
        }}
      >
        <Lock size={14} />
        Fechar mês
      </Button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={`Fechar ${mesLabel}/${ano}`}>
        <p className="text-sm text-muted">
          Depois de fechado, lançamentos com competência em {mesLabel}/{ano} não
          poderão mais ser criados, editados ou excluídos até o mês ser reaberto.
        </p>
        {pendentes > 0 && (
          <p className="mt-3 rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
            {pendentes} lançamento(s) ainda em aberto neste mês. Você pode fechar
            mesmo assim.
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-md bg-saida-bg px-3 py-2 text-sm text-saida">{error}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await fecharMes(ano, mes);
                if (result.error) {
                  setError(result.error);
                } else {
                  setConfirmOpen(false);
                }
              });
            }}
          >
            {isPending ? "Fechando..." : "Fechar mês"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
