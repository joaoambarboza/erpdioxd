"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Select } from "@/components/ui/field";
import { updateConfiguracao, uploadLogo, removeLogo, type ActionState } from "./actions";

const initialState: ActionState = {};

const monthLabels = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function ConfiguracaoForm({
  nome,
  cnpj,
  endereco,
  mesInicioAnoFiscal,
  hasLogo,
  logoVersion,
}: {
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  mesInicioAnoFiscal: number;
  hasLogo: boolean;
  logoVersion: string;
}) {
  const [state, formAction, pending] = useActionState(updateConfiguracao, initialState);
  const [logoState, logoFormAction, logoPending] = useActionState(uploadLogo, initialState);
  const [isRemoving, startRemoveTransition] = useTransition();

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Dados da empresa</h2>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup label="Nome" htmlFor="nome">
              <Input id="nome" name="nome" required defaultValue={nome} />
            </FieldGroup>
            <FieldGroup label="CNPJ" htmlFor="cnpj">
              <Input id="cnpj" name="cnpj" defaultValue={cnpj ?? ""} />
            </FieldGroup>
            <FieldGroup label="Endereço" htmlFor="endereco" className="sm:col-span-2">
              <Input id="endereco" name="endereco" defaultValue={endereco ?? ""} />
            </FieldGroup>
            <FieldGroup label="Mês de início do ano fiscal" htmlFor="mesInicioAnoFiscal">
              <Select id="mesInicioAnoFiscal" name="mesInicioAnoFiscal" defaultValue={mesInicioAnoFiscal}>
                {monthLabels.map((label, idx) => (
                  <option key={label} value={idx + 1}>
                    {label}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>
          <p className="text-xs text-muted">
            Um filtro de &quot;Ano&quot; sem mês específico passa a considerar o período de 12 meses
            a partir deste mês, em vez de janeiro a dezembro.
          </p>

          {state.error && <p className="text-sm text-saida">{state.error}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Logo</h2>
        <div className="flex items-center gap-4">
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/configuracao/logo?v=${logoVersion}`}
              alt="Logo da empresa"
              className="h-16 w-16 rounded-md border border-border object-contain"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted">
              Sem logo
            </div>
          )}

          <form action={logoFormAction} className="flex items-center gap-2">
            <input
              type="file"
              name="file"
              required
              accept="image/jpeg,image/png,image/webp"
              className="text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
            />
            <Button type="submit" size="sm" variant="secondary" disabled={logoPending}>
              {logoPending ? "Enviando..." : "Enviar"}
            </Button>
          </form>

          {hasLogo && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isRemoving}
              onClick={() =>
                startRemoveTransition(() => {
                  removeLogo();
                })
              }
            >
              Remover
            </Button>
          )}
        </div>
        {logoState.error && <p className="mt-2 text-sm text-saida">{logoState.error}</p>}
        <p className="mt-2 text-xs text-muted">JPG, PNG ou WEBP. Máximo 2MB.</p>
      </section>
    </div>
  );
}
