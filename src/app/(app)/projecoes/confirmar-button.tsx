"use client";

import { useState, useTransition } from "react";
import { CircleCheck } from "lucide-react";
import { confirmarProjecao } from "./actions";

export function ConfirmarButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-background disabled:opacity-50"
        onClick={() => {
          setError(undefined);
          startTransition(async () => {
            const result = await confirmarProjecao(id);
            if (result.error) setError(result.error);
          });
        }}
      >
        <CircleCheck size={14} />
        {isPending ? "Confirmando..." : "Confirmar"}
      </button>
      {error && <p className="max-w-[200px] text-right text-xs text-saida">{error}</p>}
    </div>
  );
}
