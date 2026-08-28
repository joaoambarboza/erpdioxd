"use client";

import { useActionState } from "react";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input } from "@/components/ui/field";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Sprout className="text-primary" size={28} />
          <h1 className="text-lg font-semibold text-foreground">
            Dioxd ERP Financeiro
          </h1>
          <p className="text-sm text-muted">Entre com sua conta</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <FieldGroup label="E-mail" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="voce@dioxd.com.br"
            />
          </FieldGroup>
          <FieldGroup label="Senha" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </FieldGroup>

          {state?.error && (
            <p className="text-sm text-saida">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
