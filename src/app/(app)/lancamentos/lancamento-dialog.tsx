"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/field";
import {
  tipoLabels,
  naturezaLabels,
  statusLabels,
  formaPagamentoLabels,
} from "@/lib/enum-labels";
import { createLancamento, updateLancamento, type ActionState } from "./actions";
import { AnexosSection } from "./anexos-section";

type Option = { id: string; nome: string };

export type LancamentoOptions = {
  categorias: { id: string; nome: string; tipo: "ENTRADA" | "SAIDA"; parentId: string | null }[];
  contasDre: { id: string; nome: string; grupoNome: string }[];
  centrosCusto: Option[];
  regionais: Option[];
  contasBancarias: Option[];
  clientes: Option[];
  fornecedores: Option[];
};

export type LancamentoInitial = {
  id: string;
  dataLancamento: string;
  dataCompetencia: string;
  dataVencimento: string;
  dataPagamento: string | null;
  tipo: string;
  natureza: string;
  status: string;
  descricao: string;
  valorOriginal: string;
  desconto: string;
  acrescimo: string;
  juros: string;
  multa: string;
  valorPago: string;
  categoriaId: string;
  subcategoriaId: string | null;
  contaDreId: string;
  centroCustoId: string;
  regionalId: string;
  projeto: string | null;
  contaBancariaId: string;
  clienteId: string | null;
  fornecedorId: string | null;
  formaPagamento: string;
  tipoPagamento: string | null;
  observacao: string | null;
  numeroDocumento: string | null;
  numeroNotaFiscal: string | null;
  anexos: { id: string; nomeArquivo: string; tamanho: number }[];
};

const initialState: ActionState = {};

function toDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function LancamentoDialog({
  options,
  initial,
  trigger,
  defaultStatus = "EM_ABERTO",
}: {
  options: LancamentoOptions;
  initial?: LancamentoInitial;
  trigger?: React.ReactNode;
  defaultStatus?: LancamentoInitial["status"];
}) {
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(initial);
  const action = isEdit
    ? updateLancamento.bind(null, initial!.id)
    : createLancamento;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tipo, setTipo] = React.useState(initial?.tipo ?? "ENTRADA");
  const [categoriaId, setCategoriaId] = React.useState(
    initial?.categoriaId ?? ""
  );

  const wasPending = React.useRef(false);
  React.useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  const categoriasRaiz = options.categorias.filter(
    (c) => !c.parentId && c.tipo === tipo
  );
  const subcategorias = options.categorias.filter(
    (c) => c.parentId === categoriaId
  );

  const fieldError = (name: string) => state.fieldErrors?.[name];

  return (
    <>
      <span onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button>
            <Plus size={16} />
            Novo Lançamento
          </Button>
        )}
      </span>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "Editar Lançamento" : "Novo Lançamento"}
        wide
      >
        <form action={formAction} className="flex flex-col gap-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted">
              Identificação
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FieldGroup label="Data do lançamento" htmlFor="dataLancamento">
                <Input
                  id="dataLancamento"
                  name="dataLancamento"
                  type="date"
                  required
                  defaultValue={toDateInput(initial?.dataLancamento ?? null) || new Date().toISOString().slice(0, 10)}
                />
              </FieldGroup>
              <FieldGroup label="Data de competência" htmlFor="dataCompetencia">
                <Input
                  id="dataCompetencia"
                  name="dataCompetencia"
                  type="date"
                  required
                  defaultValue={toDateInput(initial?.dataCompetencia ?? null) || new Date().toISOString().slice(0, 10)}
                />
              </FieldGroup>
              <FieldGroup label="Data de vencimento" htmlFor="dataVencimento">
                <Input
                  id="dataVencimento"
                  name="dataVencimento"
                  type="date"
                  required
                  defaultValue={toDateInput(initial?.dataVencimento ?? null) || new Date().toISOString().slice(0, 10)}
                />
              </FieldGroup>
              <FieldGroup label="Data de pagamento/recebimento" htmlFor="dataPagamento">
                <Input
                  id="dataPagamento"
                  name="dataPagamento"
                  type="date"
                  defaultValue={toDateInput(initial?.dataPagamento ?? null)}
                />
              </FieldGroup>

              <FieldGroup label="Tipo" htmlFor="tipo">
                <Select
                  id="tipo"
                  name="tipo"
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value);
                    setCategoriaId("");
                  }}
                >
                  {Object.entries(tipoLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Natureza" htmlFor="natureza">
                <Select id="natureza" name="natureza" defaultValue={initial?.natureza ?? "RECEITA"}>
                  {Object.entries(naturezaLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Status" htmlFor="status">
                <Select id="status" name="status" defaultValue={initial?.status ?? defaultStatus}>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Descrição" htmlFor="descricao" className="sm:col-span-2 lg:col-span-1">
                <Input
                  id="descricao"
                  name="descricao"
                  required
                  defaultValue={initial?.descricao}
                  placeholder="Ex: Venda de insumos"
                />
                {fieldError("descricao") && (
                  <p className="text-xs text-saida">{fieldError("descricao")}</p>
                )}
              </FieldGroup>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted">Valores</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <FieldGroup label="Valor original" htmlFor="valorOriginal">
                <Input
                  id="valorOriginal"
                  name="valorOriginal"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={initial?.valorOriginal}
                />
                {fieldError("valorOriginal") && (
                  <p className="text-xs text-saida">{fieldError("valorOriginal")}</p>
                )}
              </FieldGroup>
              <FieldGroup label="Desconto" htmlFor="desconto">
                <Input id="desconto" name="desconto" type="number" step="0.01" min="0" defaultValue={initial?.desconto ?? "0"} />
              </FieldGroup>
              <FieldGroup label="Acréscimo" htmlFor="acrescimo">
                <Input id="acrescimo" name="acrescimo" type="number" step="0.01" min="0" defaultValue={initial?.acrescimo ?? "0"} />
              </FieldGroup>
              <FieldGroup label="Juros" htmlFor="juros">
                <Input id="juros" name="juros" type="number" step="0.01" min="0" defaultValue={initial?.juros ?? "0"} />
              </FieldGroup>
              <FieldGroup label="Multa" htmlFor="multa">
                <Input id="multa" name="multa" type="number" step="0.01" min="0" defaultValue={initial?.multa ?? "0"} />
              </FieldGroup>
              <FieldGroup label="Valor pago/recebido" htmlFor="valorPago">
                <Input id="valorPago" name="valorPago" type="number" step="0.01" min="0" defaultValue={initial?.valorPago ?? "0"} />
              </FieldGroup>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted">
              Classificação
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldGroup label="Categoria" htmlFor="categoriaId">
                <Select
                  id="categoriaId"
                  name="categoriaId"
                  required
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {categoriasRaiz.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Subcategoria" htmlFor="subcategoriaId">
                <Select id="subcategoriaId" name="subcategoriaId" defaultValue={initial?.subcategoriaId ?? ""}>
                  <option value="">Nenhuma</option>
                  {subcategorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Conta do DRE" htmlFor="contaDreId">
                <Select id="contaDreId" name="contaDreId" required defaultValue={initial?.contaDreId}>
                  <option value="">Selecione</option>
                  {options.contasDre.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.grupoNome} · {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Centro de custo" htmlFor="centroCustoId">
                <Select id="centroCustoId" name="centroCustoId" required defaultValue={initial?.centroCustoId}>
                  <option value="">Selecione</option>
                  {options.centrosCusto.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Regional" htmlFor="regionalId">
                <Select id="regionalId" name="regionalId" required defaultValue={initial?.regionalId}>
                  <option value="">Selecione</option>
                  {options.regionais.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Projeto" htmlFor="projeto">
                <Input id="projeto" name="projeto" defaultValue={initial?.projeto ?? ""} />
              </FieldGroup>
              <FieldGroup label="Conta bancária" htmlFor="contaBancariaId">
                <Select id="contaBancariaId" name="contaBancariaId" required defaultValue={initial?.contaBancariaId}>
                  <option value="">Selecione</option>
                  {options.contasBancarias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Cliente" htmlFor="clienteId">
                <Select id="clienteId" name="clienteId" defaultValue={initial?.clienteId ?? ""}>
                  <option value="">Nenhum</option>
                  {options.clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Fornecedor" htmlFor="fornecedorId">
                <Select id="fornecedorId" name="fornecedorId" defaultValue={initial?.fornecedorId ?? ""}>
                  <option value="">Nenhum</option>
                  {options.fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Forma de pagamento" htmlFor="formaPagamento">
                <Select id="formaPagamento" name="formaPagamento" defaultValue={initial?.formaPagamento ?? "PIX"}>
                  {Object.entries(formaPagamentoLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Tipo de pagamento" htmlFor="tipoPagamento">
                <Input id="tipoPagamento" name="tipoPagamento" defaultValue={initial?.tipoPagamento ?? ""} placeholder="Ex: À vista, parcelado" />
              </FieldGroup>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted">
              Observações
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldGroup label="Número do documento" htmlFor="numeroDocumento">
                <Input id="numeroDocumento" name="numeroDocumento" defaultValue={initial?.numeroDocumento ?? ""} />
              </FieldGroup>
              <FieldGroup label="Número da nota fiscal" htmlFor="numeroNotaFiscal">
                <Input id="numeroNotaFiscal" name="numeroNotaFiscal" defaultValue={initial?.numeroNotaFiscal ?? ""} />
              </FieldGroup>
              <FieldGroup label="Observação" htmlFor="observacao" className="sm:col-span-2">
                <Textarea id="observacao" name="observacao" rows={3} defaultValue={initial?.observacao ?? ""} />
              </FieldGroup>
            </div>
          </section>

          {state.error && (
            <p className="rounded-md bg-saida-bg px-3 py-2 text-sm text-saida">
              {state.error}
            </p>
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

        <div className="mt-6 border-t border-border pt-6">
          <AnexosSection lancamentoId={initial?.id ?? null} anexos={initial?.anexos ?? []} />
        </div>
      </Modal>
    </>
  );
}
