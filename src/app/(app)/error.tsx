"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-lg font-semibold text-foreground">Algo deu errado</h1>
      <p className="max-w-md text-sm text-muted">
        Ocorreu um erro inesperado ao carregar esta página. Tente novamente — se o
        problema continuar, verifique se o arquivo ou dado enviado não é grande ou
        inválido demais.
      </p>
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  );
}
