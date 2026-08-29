"use client";

import { useState, useTransition } from "react";
import { Lock, LockOpen, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { fecharMes, reabrirMes } from "./actions";

function comemorar() {
  const disparar = (opts: confetti.Options) =>
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, ...opts });
  disparar({ angle: 60, origin: { x: 0, y: 0.6 } });
  disparar({ angle: 120, origin: { x: 1, y: 0.6 } });
}

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
  const [fechado, setFechado] = useState(false);

  // Ao fechar com sucesso, o `revalidatePath` do server action já entrega
  // `status="FECHADO"` de volta antes do usuário ver a comemoração — por
  // isso o desvio para o botão "Reabrir" espera o modal ser fechado
  // (`!confirmOpen`) em vez de reagir ao status assim que ele muda.
  if (status === "FECHADO" && !confirmOpen) {
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
      {status === "ABERTO" && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setError(undefined);
            setFechado(false);
            setConfirmOpen(true);
          }}
        >
          <Lock size={14} />
          Fechar mês
        </Button>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={fechado ? "Mês fechado!" : `Fechar ${mesLabel}/${ano}`}
      >
        {fechado ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <PartyPopper className="text-primary" size={36} />
            <p className="text-base font-semibold text-foreground">
              &ldquo;Ebenézer, até aqui nos ajudou o Senhor&rdquo;
            </p>
            <p className="text-sm text-muted">1 Samuel 7:12</p>
            <Button className="mt-2" onClick={() => setConfirmOpen(false)}>
              Continuar
            </Button>
          </div>
        ) : (
          <>
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
                      setFechado(true);
                      comemorar();
                    }
                  });
                }}
              >
                {isPending ? "Fechando..." : "Fechar mês"}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
